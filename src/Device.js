const { dirname, relative, posix } = require("path");
const { readFileSync, statSync, readdirSync, mkdirSync, createWriteStream } = require("fs");
const { MicroPythonDevice } = require("micropython-ctl-cont");
const { createBlockingProxy } = require("./utils/blockingProxy");
const {
  waitFor,
  cherryPick,
  getNearestPymakrConfig,
  createIsIncluded,
  serializeKeyValuePairs,
  serializedEntriesToObj,
} = require("./utils/misc");
const { writable } = require("./utils/store");
const { StateManager } = require("./utils/StateManager");
const picomatch = require("picomatch");
const { createSequenceHooksCollection } = require("hookar");
const { createReadUntil } = require("./utils/readUntil");

/**
 * @typedef {Object} DeviceConfig
 * @prop {'always'|'never'|'onLostConnection'|'lastState'} autoConnect
 * @prop {string} name
 * @prop {string} username defaults to "micro"
 * @prop {string} password defaults to "python"
 * @prop {boolean} hidden
 */

/** @type {DeviceConfig} */
const configDefaults = {
  autoConnect: "onLostConnection",
  name: "",
  username: "micro",
  password: "python",
  hidden: false,
};

/** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
const runScriptDefaults = {
  disableDedent: true,
  broadcastOutputAsTerminalData: true,
  runGcCollectBeforeCommand: true,
  resolveBeforeResult: false,
};

class Device {
  /**
   * All devices are instances of this class
   * @param {PyMakr} pymakr
   * @param {DeviceInput} deviceInput
   */
  constructor(pymakr, deviceInput) {
    const { subscribe, set } = writable(this);
    this.busy = writable(false, { lazy: true });
    this.onTerminalData = createSequenceHooksCollection("");
    this.subscribe = subscribe;
    /** call whenever device changes need to be onChanged to subscriptions */
    this.changed = () => set(this);
    const { address, name, protocol, raw, password, id } = deviceInput;
    this.id = id || `${protocol}://${address}`;
    this.pymakrConf = {};
    this.__connectingPromise = null;
    this.pymakr = pymakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.name = name;
    this.raw = raw;
    this.state = this.createState();
    /** If true, device will disconnect at the end of execution queue */
    this.temporaryConnection = false;
    // TODO: determine the rootpath of a device when connecting. https://github.com/pycom/pymakr-vsc/discussions/224
    this.rootPath = "/flash"; // TODO: make this configurable

    this.connected = false;
    this.connecting = false;
    this.online = false;
    this.lostConnection = false;
    /** @type {DeviceConfig} */
    this.config = { ...configDefaults, ...this.state.load().config };

    this.log = pymakr.log.createChild("Device: " + this.name);
    this.adapter = this.createAdapter();
    this.autoConnectOnCommand();
    this.terminalLogFile = this.createTerminalLogFile();
    /** @type {import("micropython-ctl-cont").BoardInfo} */
    this.info = null;

    this.applyCustomDeviceConfig();

    if (!this.config.hidden) this.updateConnection();
    subscribe(() => this.onChanged());

    this.busy.subscribe((val) => this.log.info(val ? "busy..." : "idle."));

    this.readUntil = createReadUntil();
    this.readUntil(/\n>>> [^\n]*$/, (matches) => this.busy.set(!matches), { callOnFalse: true });
  }

  applyCustomDeviceConfig() {
    /** @type {{field: string, match: string, value: string}[]} */
    const cfgs = this.pymakr.config.get().get("devices.config");
    cfgs.forEach((cfg) => {
      if (this.serialized.match(new RegExp(cfg.match, "gi"))) {
        const target = Reflect.has(this, cfg.field) ? this : this.adapter;
        target[cfg.field] = cfg.value;
      }
    });
  }

  get serialized() {
    return serializeKeyValuePairs(this.raw);
  }

  /** the user provided name */
  get customName() {
    const names = serializedEntriesToObj(this.pymakr.config.get().get("devices.names"));
    return names[this.raw.serialNumber] || '';
  }

  /** the full device name using the naming template */
  get displayName() {
    const nameTemplate = this.pymakr.config.get().get("devices.nameTemplate");

    const words = {
      ...this.raw,
      protocol: this.protocol,
      displayName: this.customName || this.name,
      projectName: this.pymakrConf.name ? this.pymakrConf.name : "unknown",
    };

    return nameTemplate.replace(/\{(.+?)\}/g, (_all, key) => words[key]);
  }

  get isHidden() {
    const { include, exclude } = this.pymakr.config.get().get("devices");
    return this.config.hidden || !createIsIncluded(include, exclude)(this.serialized);
  }

  async readPymakrConf() {
    try {
      const file = await this.adapter.getFile(`${this.rootPath}/pymakr.conf`);
      const pymakrConf = JSON.parse(file.toString());
      const isChanged = JSON.stringify(pymakrConf) !== JSON.stringify(this.pymakrConf);
      this.pymakrConf = pymakrConf;
      return isChanged;
    } catch (err) {}
  }

  /**
   * Creates a state manager, that can save and load device state from VSCode's workspace state
   * The saved data is determined by the callback provided to the StateManager constructor
   */
  createState() {
    const createState = () => cherryPick(this, ["connected", "name", "id", "config"]);
    return new StateManager(this.pymakr, `devices.${this.id}`, createState);
  }

  safeBoot() {
    return new Promise((resolve) => {
      this.log.info("safe booting...");
      this.busy.set(true);
      this.busy.subscribe((isBusy, unsub) => {
        if (!isBusy) {
          unsub();
          this.log.info("safe booting complete!", isBusy);
          resolve();
        }
      });
      // resetting the device should also reset the waiting calls
      this.adapter.__proxyMeta.reset();
      this.log.info("send \\x06 (safeboot)");
      this.adapter.sendData("\x06"); // safeboot
    });
  }

  /**
   * Server.js will reactively assign this callback to the currently active terminal
   * Therefore any wrapping or extending of this method will be lost whenever a terminal is used
   * @param {string} data
   */
  __onTerminalDataExclusive(data) {}

  /**
   * Auto connects device if required by user preferences
   * If device has lost connection, set lostConnection=true and call this.changed() to save device state and refresh views
   */
  async updateConnection() {
    if (this.online && !this.connected) {
      const autoConnect = this.config.autoConnect || this.pymakr.config.get().get("devices").autoConnect;
      const shouldConnect = autoConnect === "always";
      const shouldResume = autoConnect === "lastState" && this.state.load().connected;
      const shouldReconnect = autoConnect === "onLostConnection" && this.lostConnection;
      if (shouldConnect || shouldResume || shouldReconnect) await this.connect();
    } else {
      this.lostConnection = this.lostConnection || this.connected;
      this.connected = false;
      this.changed();
    }
  }

  /**
   * Run a Python script on this device
   * @param {string} script
   * @param {import("micropython-ctl-cont").RunScriptOptions=} options
   */
  async runScript(script, options) {
    options = Object.assign({}, runScriptDefaults, options);
    this.log.info(`runScript:\n\n${script}\n\n`);
    this.busy.set(true);
    const result = await this.adapter.runScript(script + "\n\r\n\r\n", options);

    // to avoid a race condition, only return the result once "busy" is false
    if (this.busy.get() && !options.resolveBeforeResult)
      return new Promise((resolve) => this.busy.next(() => resolve(result)));

    return result;
  }

  /**
   * Creates a MicroPythonDevice
   */
  createAdapter() {
    const rawAdapter = new MicroPythonDevice();

    // We need to wrap the rawAdapter in a blocking proxy to make sure commands
    // run in sequence rather in in parallel. See JSDoc comment for more info.
    const adapter = createBlockingProxy(rawAdapter, { exceptions: ["sendData", "reset", "connectSerial"] });
    adapter.__proxyMeta.beforeEachCall(() => this.busy.set(true));

    // emit line break to trigger a `>>>`. This triggers the `busyStatusUpdater`
    adapter.__proxyMeta.onIdle(() => this.adapter.sendData("\r\n"));

    rawAdapter.onTerminalData = (data) => {
      this.__onTerminalDataExclusive(data);
      this.readUntil.push(data);
      this.onTerminalData.run(data);
      this.terminalLogFile.write(data);
    };

    return adapter;
  }

  /**
   * If a disconnected device receives commands,
   * it will automatically create a temporary connection
   */
  autoConnectOnCommand() {
    this.adapter.__proxyMeta.onAddedCall(async ({ proxy }) => {
      if (!this.connecting && !this.connected) {
        this.temporaryConnection = true;
        await this.connect();
        await proxy.processQueue();
      }
    });

    this.adapter.__proxyMeta.afterEachCall(async ({ proxy }) => {
      if (this.temporaryConnection && !proxy.queue.length) {
        this.temporaryConnection = false;
        await this.disconnect();
      }
    });
  }

  /**
   * Creates a log file for streaming out
   */
  createTerminalLogFile() {
    const logFileName =
      this.pymakr.context.logUri.fsPath + ["/device", this.protocol, this.address, Date.now() + ".log"].join("-");
    mkdirSync(dirname(logFileName), { recursive: true });
    return createWriteStream(logFileName);
  }

  async connect() {
    if (!this.connecting && !this.connected) {
      this.adapter.__proxyMeta.isPaused = true;
      this.busy.set(true);
      /* connectingPromise is used by other classes to detect when a device is connected.
         should maybe be changed to a subscribable */
      this.__connectingPromise = new Promise(async (resolve, reject) => {
        this._onConnectingHandler();
        let err;
        const reconnectIntervals = [0, 5, 500, 1000];
        while (reconnectIntervals.length) {
          try {
            await this._connectSerial();
            resolve(this._onConnectedHandler());
            return this.__connectingPromise;
          } catch (_err) {
            err = err || _err;
            if (reconnectIntervals.length) this.log.info(`Failed to connect. (${err.message}) Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, reconnectIntervals.shift()));
          }
        }
        // if we end here, we failed to connect
        reject(this._onFailedConnectHandler(err));
      });
      return this.__connectingPromise;
    }
  }

  // todo should be handleConnecting, handleFailedConnect and handleDisconnect
  _onConnectingHandler() {
    this.log.info(`connecting to "${this.name}"...`);
    this.connecting = true;
  }

  _onFailedConnectHandler(err) {
    this.connecting = false;
    const error = [`Failed to connect to ${this.address}.`, err.message];
    this.log.error(...error);
    // details to debug log
    this.log.debug(this.adapter);
    throw error;
  }

  _onDisconnected() {
    this.connected = false;
    this.lostConnection = false;
    this.busy.set(false);
    this.changed();
  }

  /** @private */
  async _onConnectedHandler() {
    return new Promise((resolve) => {
      // we need to set it to true again cause it could be idle after we connected
      this.busy.set(true);
      this.log.info("Connected.");
      this.log.info("Waiting for access...");
      this.connected = true;
      this.connecting = false;
      this.lostConnection = false;
      this.changed();

      // should take about 20 ms
      const timeoutHandle = setTimeout(resolve, 200);

      this.busy.subscribe(async (isBusy, unsub) => {
        if (!isBusy && this.connected) {
          // start the proxy queue or all calls will be left hanging
          this.adapter.__proxyMeta.run();
          unsub();
          clearTimeout(timeoutHandle);
          this.busy.set(true);
          this.log.info("Got access.");
          this.log.info("Getting device info.");
          this.info = await this.adapter.getBoardInfo();
          if (await this.readPymakrConf()) this.changed();
          this.busy.set(false);
          resolve();
        }
      });

      this.openRepl();
    });
  }

  openRepl() {
    this.adapter.sendData("\r\x02");
  }

  /** @private */
  async _connectSerial() {
    const connectPromise = this.adapter.connectSerial(this.address);
    await waitFor(connectPromise, 2000, "Timed out while connecting.");
  }

  async disconnect() {
    if (this.connected) {
      this.adapter.__proxyMeta.reset();
      this.adapter.__proxyMeta.isPaused = true;
      await waitFor(this.adapter.__proxyMeta.target.disconnect(), 2000, "Timed out while disconnecting.");
      this._onDisconnected();
    }
  }

  /**
   * saves state and refreshes views
   */
  onChanged() {
    this.applyCustomDeviceConfig();
    this.state.save();
    // throttle the UI refresh call. This makes sure that multiple devices doesn't trigger the same call.
    this.pymakr.refreshProvidersThrottled();
  }

  /**
   * Uploads file or folder to device
   * @param {string} source
   * @param {string} destination
   * @param {{
   *   onScanComplete: (files: string[]) => void,
   *   onUpload: (file: string) => void,
   * }} options
   */
  async upload(source, destination, options) {
    destination = posix.join(this.rootPath, `/${destination}`.replace(/\/+/g, "/"));
    const root = source;
    const ignores = [...this.pymakr.config.get().get("ignore")];
    const pymakrConfig = getNearestPymakrConfig(source);
    if (pymakrConfig) ignores.push(...(pymakrConfig.py_ignore || []));

    const isIgnore = picomatch(ignores);

    /** @type {{source: string, destination: string}[]} */
    const queue = [];

    const _uploadFile = async (file, destination) => {
      this.log.traceShort("uploadFile", file, "to", destination);
      const data = Buffer.from(readFileSync(file));
      return this.adapter.putFile(destination, data, { checkIfSimilarBeforeUpload: true });
    };

    const _uploadDir = async (dir, destination) => {
      try {
        await this.adapter.mkdir(destination);
      } catch (err) {
        if (!err.message.match("OSError: \\[Errno 17\\] EEXIST")) throw err;
      }
      for (const file of readdirSync(dir)) {
        await _upload(`${dir}/${file}`, `${destination}/${file}`);
      }
    };

    const _upload = (source, destination) => {
      // BUG: upload c:\develop\vscode\pymakr-vsc\templates\empty to /
      //  'The "from" argument must be of type string. Received null'
      const relativePath = relative(root, source);
      if (!isIgnore(relativePath))
        return statSync(source).isDirectory() ? _uploadDir(source, destination) : queue.push({ source, destination });
    };

    this.log.info("upload", source, "to", destination);
    await _upload(source, destination);
    options.onScanComplete(queue.map((entry) => entry.source));
    for (const file of queue) {
      options.onUpload(relative(root, file.source));
      await _uploadFile(file.source, file.destination);
    }
    this.log.info("upload completed");
  }
}

module.exports = { Device };
