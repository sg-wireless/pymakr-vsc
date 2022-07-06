const { dirname, relative, posix } = require("path");
const { readFileSync, statSync, readdirSync, mkdirSync, createWriteStream } = require("fs");
const { MicroPythonDevice } = require("micropython-ctl-cont");
const { createBlockingProxy } = require("./utils/blockingProxy");
const { waitFor, getNearestPymakrConfig, createIsIncluded, serializeKeyValuePairs } = require("./utils/misc");
const { writable, derived } = require("./utils/store");
const { createStateObject, createListedConfigObject } = require("./utils/storageObj");
const picomatch = require("picomatch");
const { createSequenceHooksCollection } = require("hookar");
const { createReadUntil } = require("./utils/readUntil");
const vscode = require("vscode");
const { DeviceOfflineError } = require("./utils/errors");

/**
 * @typedef {Object} DeviceConfig
 * @prop {'always'|'never'|'onLostConnection'|'lastState'} autoConnect
 * @prop {string} name
 * @prop {string} username defaults to "micro"
 * @prop {string} password defaults to "python"
 * @prop {boolean} hidden
 * @prop {string} rootPath
 * @prop {object} adapterOptions
 * @prop {number=} adapterOptions.chunkSize
 * @prop {number=} adapterOptions.chunkDelay
 */

/** @type {DeviceConfig} */
const configDefaults = {
  autoConnect: "onLostConnection",
  name: "",
  username: "micro",
  password: "python",
  hidden: false,
  rootPath: null,
  adapterOptions: {},
};

/** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
const runScriptDefaults = {
  disableDedent: true,
  broadcastOutputAsTerminalData: true,
  runGcCollectBeforeCommand: true,
  resolveBeforeResult: false,
};

/** @type {Partial<PymakrConfFile>} */
const pymakrConfType = {};

class Device {
  /**
   * All devices are instances of this class
   * @param {PyMakr} pymakr
   * @param {DeviceInput} deviceInput
   */
  constructor(pymakr, deviceInput) {
    const { subscribe, set } = writable(this);
    this.busy = writable(false, { lazy: true });

    /** @type {Writable<string>} */
    this.action = writable(null, { lazy: true });
    this.online = writable(false, { lazy: true });
    this.connected = writable(false, { lazy: true });

    this.onTerminalData = createSequenceHooksCollection("");
    this.subscribe = subscribe;
    /** call whenever device changes need to be onChanged to subscriptions */
    this.changed = () => set(this);
    const { address, name, protocol, raw, password, id } = deviceInput;
    this.id = id || `${protocol}://${address}`;
    this.__connectingPromise = null;
    this.pymakr = pymakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.name = name;
    this.raw = raw;

    this.state = {
      /** device has not yet been connected and some device info (eg. pymakr.conf) could be stale */
      stale: true,
      main: derived([this.busy, this.action, this.online, this.connected], ([$busy, $action, $online, $connected]) =>
        !$online
          ? "offline"
          : !$connected
          ? "disconnected"
          : $busy && $action && $action !== "reset"
          ? "action"
          : $busy
          ? "script"
          : "idle"
      ),
      wasConnected: createStateObject(pymakr.context.workspaceState, `pymakr.devices.${this.id}.wasConnected`, true),
      pymakrConf: createStateObject(pymakr.context.globalState, `pymakr.devices.${this.id}.pymakrConf`, pymakrConfType),
      /** @type {import("./utils/storageObj").GetterSetter<import("micropython-ctl-cont").BoardInfo>} */
      info: createStateObject(pymakr.context.globalState, `pymakr.devices.${this.id}.info`),
    };

    this.busy.subscribe((isBusy) => !isBusy && !this.adapter.__proxyMeta.isBusy && this.action.set(null));

    this.state.main.subscribe(() => this.pymakr.refreshProvidersThrottled());

    this._config = createListedConfigObject("pymakr.devices", "configs", this.id, configDefaults);

    /** If true, device will disconnect at the end of execution queue */
    this.temporaryConnection = false;
    this.connecting = false;
    this.lostConnection = false;

    this.log = pymakr.log.createChild("Device: " + this.name);
    this.adapter = this.createAdapter();
    this.adapter.onclose = () => this.connected.set(false);

    this.autoConnectOnCommand();
    this.terminalLogFile = this.createTerminalLogFile();

    this.applyCustomDeviceConfig();

    subscribe(() => this.onChanged());

    this.busy.subscribe((val) => this.log.debugShort(val ? "busy..." : "idle."));

    this.readUntil = createReadUntil();
    this.readUntil(/\n>>> [^\n]*$/, (matches) => this.busy.set(!matches), { callOnFalse: true });

    this.config = this.config;
  }

  get config() {
    return this._config.get();
  }

  set config(value) {
    this._config.set(value);
  }

  get info() {
    return this.state.info.get();
  }

  get configOverride() {
    const customConfig = {};
    /** @type {{field: string, match: string, value: string}[]} */
    const cfgs = this.pymakr.config.get().get("devices.configOverride");
    cfgs
      .filter((cfg) => this.serialized.match(new RegExp(cfg.match, "gi")))
      .forEach((cfg) => (customConfig[cfg.field] = cfg.value));
    return customConfig;
  }

  applyCustomDeviceConfig() {
    Object.keys(this.configOverride).forEach((key) => {
      const target = Reflect.has(this, key) ? this : this.adapter;
      target[key] = this.configOverride[key];
    });
  }

  get serialized() {
    return serializeKeyValuePairs(this.raw);
  }

  /** the full device name using the naming template */
  get displayName() {
    const nameTemplate = this.pymakr.config.get().get("devices.nameTemplate");

    const words = {
      ...this.raw,
      protocol: this.protocol,
      displayName: this.config.name || this.name,
      projectName: (this.state.pymakrConf.get().name || "unknown") + (this.state.stale ? "?" : ""),
    };

    return nameTemplate.replace(/\{(.+?)\}/g, (_all, key) => words[key]);
  }

  get isHidden() {
    const { include, exclude } = this.pymakr.config.get().get("devices");
    return this.config.hidden || !createIsIncluded(include, exclude)(this.serialized);
  }

  async updatePymakrConf() {
    /** @type {Partial<PymakrConfFile>} */
    let conf = {};
    try {
      const file = await this.adapter.getFile(`${this.config.rootPath}/pymakr.conf`);
      conf = JSON.parse(file.toString());
    } catch (err) {}
    const changed = this.state.pymakrConf.set(conf);
    if (changed) this.changed();
  }

  safeBoot() {
    return new Promise((resolve) => {
      if (!this.connected.get()) throw new DeviceOfflineError();

      this.log.info("safe booting...");
      this.action.set("safeboot");
      this.busy.set(true);
      this.busy.subscribe((isBusy, unsub) => {
        if (!isBusy) {
          unsub();
          this.action.set(null);
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

  reset() {
    // resetting the device should also reset the waiting calls
    this.adapter.__proxyMeta.reset();
    return this.adapter.reset({ broadcastOutputAsTerminalData: true, softReset: false });
  }

  /**
   * Server.js will reactively assign this callback to the currently active terminal
   * Therefore any wrapping or extending of this method will be lost whenever a terminal is used
   * @param {string} data
   */
  __onTerminalDataExclusive(data) {}

  /**
   * Auto connects device if required by user preferences
   * This command gets called by devices.js when a device online status changes
   * If device has lost connection, set lostConnection=true and call this.changed() to save device state and refresh views
   */
  async refreshConnection() {
    if (this.online.get() && !this.adapter.__proxyMeta.target.isConnected()) {
      const shouldConnect = this.config.autoConnect === "always";
      const shouldResume = this.config.autoConnect === "lastState" && this.state.wasConnected.get();
      const shouldReconnect = this.config.autoConnect === "onLostConnection" && this.lostConnection;
      if (shouldConnect || shouldResume || shouldReconnect) await this.connect();
    } else {
      this.lostConnection = this.lostConnection || this.state.wasConnected.get();
      this.state.wasConnected.set(false);
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
    this.log.debug(`runScript:\n\n${script}\n\n`);
    this.busy.set(true);
    const start = Date.now();
    const result = await this.adapter.runScript(script + "\n\r\n\r\n", options);
    this.log.debug("finished script in", Date.now() - start);

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
    const adapter = createBlockingProxy(rawAdapter, { exceptions: ["sendData", "connectSerial"] });
    adapter.__proxyMeta.beforeEachCall(({ item }) => {
      this.action.set(item.field.toString());
      this.busy.set(true);
    });

    // emit line break to trigger a `>>>`. This triggers the `busyStatusUpdater`
    adapter.__proxyMeta.onIdle(() => {
      this.adapter.sendData("\r\n");
      this.action.set(null);
    });

    let outputChannel;

    rawAdapter.onTerminalData = (data) => {
      outputChannel =
        outputChannel || vscode.window.createOutputChannel(`Pymakr.${this.config.name || this.name}`, "log");
      this.__onTerminalDataExclusive(data);
      this.readUntil.push(data);
      this.onTerminalData.run(data);
      this.terminalLogFile.write(data);
      outputChannel.append(data);
    };

    return adapter;
  }

  /**
   * If a disconnected device receives commands,
   * it will automatically create a temporary connection
   */
  autoConnectOnCommand() {
    this.adapter.__proxyMeta.onAddedCall(async ({ proxy }) => {
      if (!this.connecting && !this.connected.get()) {
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
    if (!this.connecting && !this.connected.get()) {
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
            this.connected.set(true);
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

  /** @private */
  async _onConnectedHandler() {
    return new Promise((resolve) => {
      // we need to set it to true again cause it could be idle after we connected
      this.busy.set(true);
      this.log.info("Connected.");
      this.log.info("Waiting for access...");
      this.state.wasConnected.set(true);
      this.connecting = false;
      this.lostConnection = false;
      this.changed();

      // should take about 20 ms
      const timeoutHandle = setTimeout(resolve, 200);

      this.busy.subscribe(async (isBusy, unsub) => {
        if (!isBusy && this.connected.get()) {
          // start the proxy queue or all calls will be left hanging
          this.adapter.__proxyMeta.run();
          unsub();
          clearTimeout(timeoutHandle);
          this.busy.set(true);
          this.log.info("Got access.");
          this.log.info("Getting device info.");
          this.state.info.set(await this.adapter.getBoardInfo());
          if (!this.config.rootPath) this.config = { ...this.config, rootPath: await this.getRootPath() };
          await this.updatePymakrConf();
          this.state.stale = false;
          this.busy.set(false);
          resolve();
        }
      });

      this.openRepl();
    });
  }

  async getRootPath() {
    const files = (await this.adapter.listFiles("/")).map((file) => file.filename);
    const rootPath = files.includes("/flash") ? "/flash" : files.includes("/sd") ? "/sd" : "/";
    this.log.info("Detected root path:", rootPath);
    return rootPath;
  }

  openRepl() {
    this.adapter.sendData("\r\x02");
  }

  /** @private */
  async _connectSerial() {
    const connectPromise = this.adapter.connectSerial(this.address, this.config.adapterOptions);
    await waitFor(connectPromise, 2000, "Timed out while connecting.");
  }

  async disconnect() {
    if (this.adapter.__proxyMeta.target.isConnected()) {
      this.adapter.__proxyMeta.reset();
      this.adapter.__proxyMeta.isPaused = true;
      const lostConnectionPromise = new Promise((resolve) => this.connected.next(resolve)); // make sure we lost connection
      const disconnectPromise = this.adapter.__proxyMeta.target.disconnect(); // make sure disconnect script finished
      await waitFor(Promise.all([lostConnectionPromise, disconnectPromise]), 2000, "Timed out while disconnecting.");
      this.state.wasConnected.set(false);
      this.lostConnection = false;
      this.busy.set(false);
      this.changed();
    }
  }

  /**
   * @param {number} retries
   */
  stopScript(retries = 5, retryInterval = 1000) {
    this.log.debug("stop script");
    return new Promise((resolve, reject) => {
      if (this.busy.get()) {
        let counter = 0;
        const intervalHandle = setInterval(() => {
          if (counter >= retries) {
            clearInterval(intervalHandle);
            reject(`timed out after ${retries} retries in ${(retries * retryInterval) / 1000}s`);
          } else {
            counter++;
            this.adapter.sendData("\x03");
            this.log.log(`retry stop script (${counter})`);
          }
        }, retryInterval);
        this.busy.subscribe((isBusy, unsub) => {
          if (!isBusy) {
            unsub();
            resolve();
            clearInterval(intervalHandle);
          }
        });
        this.adapter.sendData("\x03");
      } else {
        this.adapter.sendData("\x03");
        resolve();
      }
    });
  }

  /**
   * saves state and refreshes views
   */
  onChanged() {
    this.applyCustomDeviceConfig();
    // throttle the UI refresh call. This makes sure that multiple devices doesn't trigger the same call.
    this.pymakr.refreshProvidersThrottled();
  }

  async remove(source) {
    source = posix.join(this.config.rootPath, `/${source}`.replace(/\/+/g, "/"));
    return this.adapter.remove(source);
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
    destination = posix.join(this.config.rootPath, `/${destination}`.replace(/\/+/g, "/"));
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
