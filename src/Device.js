const { dirname, relative } = require("path");
const { readFileSync, statSync, readdirSync, mkdirSync, createWriteStream } = require("fs");
const { MicroPythonDevice } = require("micropython-ctl-cont");
const { createBlockingProxy } = require("./utils/blockingProxy");
const {
  waitFor,
  cherryPick,
  getNearestPymakrConfig,
  getNearestPymakrProjectDir,
  createIsIncluded,
  serializeKeyValuePairs,
} = require("./utils/misc");
const { writable } = require("./utils/store");
const { StateManager } = require("./utils/StateManager");
const picomatch = require("picomatch");
const { msgs } = require("./utils/msgs");

/**
 * @typedef {Object} DeviceConfig
 * @prop {'always'|'never'|'onLostConnection'|'lastState'} autoConnect
 * @prop {string} username defaults to "micro"
 * @prop {string} password defaults to "python"
 * @prop {boolean} hidden
 */

/** @type {DeviceConfig} */
const configDefaults = {
  autoConnect: "onLostConnection",
  username: "micro",
  password: "python",
  hidden: false,
};

/** @type {import("micropython-ctl-cont/dist-node/src/main").RunScriptOptions} */
const runScriptDefaults = {
  disableDedent: true,
  broadcastOutputAsTerminalData: true,
  runGcCollectBeforeCommand: true,
  resolveBeforeResult: true,
};

class Device {
  __connectingPromise = null;

  /**
   * All devices are instances of this class
   * @param {PyMakr} pymakr
   * @param {DeviceInput} deviceInput
   */
  constructor(pymakr, deviceInput) {
    const { subscribe, set } = writable(this);
    this.subscribe = subscribe;
    /** call whenever device changes need to be onChanged to subscriptions */
    this.changed = () => set(this);
    const { address, name, protocol, raw, password, id } = deviceInput;
    this.id = id || `${protocol}://${address}`;

    this.pymakr = pymakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.name = name;
    this.raw = raw;
    this.state = this.createState();

    this.connected = false;
    this.connecting = false;
    this.online = false;
    this.lostConnection = false;
    /** @type {DeviceConfig} */
    this.config = { ...configDefaults, ...this.state.load().config };

    this.log = pymakr.log.createChild("Device: " + this.name);
    this.adapter = this.createAdapter();
    this.terminalLogFile = this.createTerminalLogFile();
    /** @type {import("micropython-ctl-cont").BoardInfo} */
    this.info = null;

    this.updateHideStatus();
    if (!this.config.hidden) this.updateConnection();
    subscribe(() => this.onChanged());
  }

  /**
   * Hides / unhides this device depending on how it matches user's config.devices.include and config.devices.exclude
   */
  updateHideStatus() {
    const { include, exclude } = this.pymakr.config.get().get("devices");
    this.config.hidden = !createIsIncluded(include, exclude)(serializeKeyValuePairs(this.raw));
  }

  /**
   * Creates a state manager, that can save and load device state from VSCode's workspace state
   * The saved data is determined by the callback provided to the StateManager constructor
   */
  createState() {
    const createState = () => cherryPick(this, ["connected", "name", "id", "config"]);
    return new StateManager(this.pymakr, `devices.${this.id}`, createState);
  }

  /**
   * Proxies data from this.adapter.onTerminalData
   * Can be wrapped and extended
   * @param {string} data
   */
  onTerminalData(data) {}

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

    this.log.debugShort(`runScript:\n\n${script}\n\n`);
    return this.adapter.runScript(script + "\n\r\n\r\n", options);
  }

  /**
   * Creates a MicroPythonDevice
   */
  createAdapter() {
    const rawAdapter = new MicroPythonDevice();
    // We need to wrap the rawAdapter in a blocking proxy to make sure commands
    // run in sequence rather in in parallel. See JSDoc comment for more info.
    const adapter = createBlockingProxy(rawAdapter, {
      exceptions: ["sendData", "reset", "connectSerial"],
      beforeEachCall: () => this.connect(),
    });

    adapter.onTerminalData = (data) => {
      this.__onTerminalDataExclusive(data);
      this.onTerminalData(data);
      this.terminalLogFile.write(data);
    };

    return adapter;
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
    this.log.info("connecting...");
    this.connecting = true;
  }

  _onFailedConnectHandler(err) {
    this.connecting = false;
    const error = [`Failed to connect to ${this.address}.`, err.message, this.adapter];
    this.log.error(...error);
    throw error;
  }

  _onDisconnected() {
    this.connected = false;
    this.lostConnection = false;
    this.changed();
  }

  /** @private */
  async _onConnectedHandler() {
    this.log.info("connected.");
    this.connected = true;
    this.connecting = false;
    this.lostConnection = false;
    this.changed();
    const boardInfoPromise = this.adapter.getBoardInfo()
    // move getBoardInfo to front of queue and start the proxy
    this.adapter.__proxyMeta.shiftLastToFront().run()
    this.info = await waitFor(boardInfoPromise, 10000, msgs.boardInfoTimedOutErr(this.adapter));
    this.log.debug("boardInfo", this.info);
  }

  /** @private */
  async _connectSerial() {
    const connectPromise = this.adapter.connectSerial(this.address);
    await waitFor(connectPromise, 2000, "Timed out while connecting.");
  }

  async disconnect() {
    if (this.connected) {
      await waitFor(this.adapter.disconnect(), 2000, "Timed out while disconnecting.");
      this._onDisconnected();
    }
  }

  /**
   * saves state and refreshes views
   */
  onChanged() {
    this.state.save();
    this.pymakr.devicesProvider.refresh();
    this.pymakr.projectsProvider.refresh();
  }

  /**
   * Uploads file or folder to device
   * @param {string} source
   * @param {string} destination
   */
  async upload(source, destination) {
    const ignores = this.pymakr.config.get().get("ignore");
    const projectDir = getNearestPymakrProjectDir(source);
    const pymakrConfig = getNearestPymakrConfig(projectDir);
    if (pymakrConfig) ignores.push(...pymakrConfig.py_ignore);

    const isIgnore = picomatch(ignores);

    const _uploadFile = async (file, destination) => {
      const _destination = `/flash/${destination}`.replace(/\/+/g, "/");
      const destinationDir = dirname(_destination);
      this.log.traceShort("uploadFile", file, "to", _destination);
      const data = Buffer.from(readFileSync(file));
      // todo move mkdir logic to micropython-ctl-cont
      try {
        await this.adapter.mkdir(destinationDir);
      } catch (err) {
        if (!err.message.match("OSError: \\[Errno 17\\] EEXIST")) throw err;
      }
      return this.adapter.putFile(_destination, data, { checkIfSimilarBeforeUpload: true });
    };

    const _uploadDir = async (dir, destination) => {
      for (const file of readdirSync(dir)) await _upload(`${dir}/${file}`, `${destination}/${file}`);
    };

    const _upload = (source, destination) => {
      const relativePath = relative(projectDir, source).replace(/\\/g, "/");
      if (!isIgnore(relativePath))
        return statSync(source).isDirectory() ? _uploadDir(source, destination) : _uploadFile(source, destination);
    };

    this.log.info("upload", source, "to", destination);
    await _upload(source, destination);
    this.log.info("upload completed");
  }
}

module.exports = { Device };
