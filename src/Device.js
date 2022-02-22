const { MicroPythonDevice } = require("micropython-ctl");
const { createBlockingProxy } = require("./utils/blockingProxy");
const { waitFor } = require("./utils/misc");
const { writable } = require("./utils/store");
const vscode = require("vscode");

class Device {
  /**
   * @param {PyMakr} pymakr
   * @param {DeviceInput} deviceInput
   */
  constructor(pymakr, deviceInput) {
    const { subscribe, set } = writable(this);
    this.subscribe = subscribe;
    /** call whenever device changes need to be propagated to subscriptions */
    this.changed = () => set(this);
    const { address, name, protocol, raw, password } = deviceInput;
    this.pymakr = pymakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.connected = false;
    this.name = name;
    this.raw = raw;
    /** `${protocol}://${address}` */
    this.id = `${protocol}://${address}`;
    this.log = pymakr.log.createChild("Device: " + this.name);
    this.adapter = this.createAdapter();
    /** @type {import("micropython-ctl").BoardInfo} */
    this.info = null;
    this.connect();
    subscribe(() => this.propagate());
  }

  createAdapter() {
    const rawAdapter = new MicroPythonDevice();
    // We need to wrap the rawAdapter in a blocking proxy to make sure commands
    // run in sequence rather in in parallel. See JSDoc comment for more info.
    return createBlockingProxy(rawAdapter, { exceptions: ["sendData"] });
  }

  async connect() {
    if (this.protocol === "serial") {
      try {
        this.log.info("connecting...");
        const connectPromise = this.adapter.connectSerial(this.address);
        await waitFor(connectPromise, 2000, "Timed out while connecting.");
        this.connected = true;
        this.changed();
        this.log.info("connected.");
        this.info = await waitFor(this.adapter.getBoardInfo(), 10000, "timed out while getting board info");
        this.log.debug("boardInfo", this.info);
        await this.pymakr.activeDeviceStore.setToLastUsedOrFirstFound();
      } catch (err) {
        const error = [`Failed to connect to ${this.address}.`, err.message, this.adapter];
        vscode.window.showErrorMessage([error[0], err.message, "Please see developer logs for more info."].join(" - "));
        this.log.error(...error);
      }
    }
  }
  async disconnect() {
    const connectPromise = this.adapter.disconnect();
    await waitFor(connectPromise, 2000, "Timed out while disconnecting.");
    this.connected = false;
    this.changed();
  }

  propagate() {
    this.pymakr.devicesProvider.refresh();
    this.pymakr.projectsProvider.refresh();
  }

  upload() {
    // this.adapter.
  }
}

module.exports = { Device };
