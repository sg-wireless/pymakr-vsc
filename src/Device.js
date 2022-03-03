const { dirname } = require("path");
const { readFileSync, statSync, readdirSync, mkdirSync, createWriteStream } = require("fs");
const { MicroPythonDevice } = require("micropython-ctl-cont");
const { createBlockingProxy } = require("./utils/blockingProxy");
const { waitFor, cherryPick } = require("./utils/misc");
const { writable } = require("./utils/store");
const vscode = require("vscode");
const { StateManager } = require("./utils/stateManager");

/** @type {DeviceConfig} */
const configDefaults = {
  autoConnect: "onLostConnection",
  username: "micro",
  password: "python",
  hidden: false,
};

class Device {
  __connectingPromise = null;

  /**
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
    /** @type {import("micropython-ctl").BoardInfo} */
    this.info = null;

    this.updateConnection();
    subscribe(() => this.onChanged());
  }

  createState() {
    const getState = () => cherryPick(this, ["connected", "name", "id", "config"]);
    return new StateManager(this.pymakr, `devices.${this.id}`, getState);
  }

  /**
   * Handles data from this.adapter.onTerminalData
   * @param {string} data
   */
  onTerminalData(data) {}

  async updateConnection() {
    if (this.online && !this.connected) {
      const autoConnect = this.config.autoConnect || this.pymakr.config.get().get("autoConnect");
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
   *
   * @param {string} script
   * @param {import("micropython-ctl-cont").RunScriptOptions} options
   * @returns
   */
  async runScript(script, options) {
    /** @type {import("micropython-ctl-cont").RunScriptOptions} options */
    const defaults = {
      runGcCollectBeforeCommand: true,
    };
    this.log.debugShort(`runScript:\n\n${script}\n\n`);
    const result = await this.adapter.runScript(script + "\n", Object.assign(defaults, options));
    this.log.debugShort(`script returned:\n\n${result}\n\n`);
    return result;
  }

  createAdapter() {
    const rawAdapter = new MicroPythonDevice();
    // We need to wrap the rawAdapter in a blocking proxy to make sure commands
    // run in sequence rather in in parallel. See JSDoc comment for more info.
    const adapter = createBlockingProxy(rawAdapter, { exceptions: ["sendData"] });

    adapter.onTerminalData = (data) => {
      this.onTerminalData(data);
      this.terminalLogFile.write(data);
    };

    return adapter;
  }

  createTerminalLogFile() {
    const logFileName =
      this.pymakr.context.logUri.fsPath + ["/device", this.protocol, this.address, Date.now() + ".log"].join("-");
    mkdirSync(dirname(logFileName), { recursive: true });
    return createWriteStream(logFileName);
  }

  async connect() {
    if (!this.connecting) {
      this.connecting = true;
      this.__connectingPromise = new Promise(async (resolve, reject) => {
        if (this.protocol === "serial") {
          try {
            this.log.info("connecting...");
            const connectPromise = this.adapter.connectSerial(this.address);
            await waitFor(connectPromise, 2000, "Timed out while connecting.");
            this.connected = true;
            this.lostConnection = false;
            this.changed();
            this.log.info("connected.");
            this.info = await waitFor(this.adapter.getBoardInfo(), 10000, "timed out while getting board info");
            this.log.debug("boardInfo", this.info);
            await this.pymakr.activeDeviceStore.setToLastUsedOrFirstFound();
            resolve();
          } catch (err) {
            const error = [`Failed to connect to ${this.address}.`, err.message, this.adapter];
            vscode.window.showErrorMessage(
              [error[0], err.message, "Please see developer logs for more info."].join(" - ")
            );
            this.log.error(...error);
            reject(err);
          }
        }
      });
      this.connecting = false;
    }
    return this.__connectingPromise;
  }

  async disconnect() {
    const connectPromise = this.adapter.disconnect();
    await waitFor(connectPromise, 2000, "Timed out while disconnecting.");
    this.connected = false;
    this.lostConnection = false;
    this.changed();
  }

  onChanged() {
    this.state.save();
    this.pymakr.devicesProvider.refresh();
    this.pymakr.projectsProvider.refresh();
  }

  async _uploadFile(file, destination) {
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
  }

  async _uploadDir(dir, destination) {
    for (const file of readdirSync(dir)) await this._upload(`${dir}/${file}`, `${destination}/${file}`);
  }

  _upload(source, destination) {
    return statSync(source).isDirectory()
      ? this._uploadDir(source, destination)
      : this._uploadFile(source, destination);
  }

  /**
   * Uploads file or folder to device
   * @param {string} source
   * @param {string} destination
   */
  async upload(source, destination) {
    // todo move tight coupled vscode
    try {
      this.log.info("copy from", source, "to", destination);
      await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: `copy to ${this.name}` });
        this.log.info("upload", source, "to", destination);
        await this._upload(source, destination);
        this.log.info("upload completed");
      });
    } catch (err) {
      const errors = ["failed to upload", source, "to", destination, "\r\nReason:", err];
      vscode.window.showErrorMessage(errors.join(" "));
      this.log.error(errors);
    }
  }
}

module.exports = { Device };
