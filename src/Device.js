const { MicroPythonDevice } = require("micropython-ctl");
const vscode = require("vscode");
const { createBlockingProxy } = require("./utils/blockingProxy");
const { waitFor } = require("./utils/misc");

class Device {
  /**
   * @param {PyMakr} pymakr
   * @param {DeviceInput} deviceInput
   */
  constructor(pymakr, deviceInput) {
    const { address, name, protocol, raw, password } = deviceInput;
    this.pymakr = pymakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.name = name;
    this.raw = raw;
    this.id = `${protocol}://${address}`;
    this.log = pymakr.log.createChild("Device: " + this.name);
    const adapter = new MicroPythonDevice();
    this.adapter = createBlockingProxy(adapter, { exceptions: ["sendData"] });
    /** @type {import("micropython-ctl").BoardInfo} */
    this.info = null;
    this.connect();
  }

  async connect() {
    if (this.protocol === "serial") {
      try {
        this.log.debug("connecting...");
        const connectPromise = this.adapter.connectSerial(this.address);
        await waitFor(connectPromise, 1000, "Timed out while connecting.");
        this.info = await waitFor(this.adapter.getBoardInfo(), 1000, "timed out while getting board info");

        this.log.debug("boardInfo", this.info);

        vscode.workspace.updateWorkspaceFolders(0, 0, {
          uri: vscode.Uri.parse(`${this.protocol}://${this.address}/flash`),
          name: `${this.protocol}://${this.address}`,
        });
      } catch (err) {
        this.log.error(`Failed to connect to ${this.address} Error:`, err, this.adapter);
      }
    }
  }

  upload() {
    // this.adapter.
  }
}

module.exports = { Device };
