const { MicroPythonDevice } = require("micropython-ctl");

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
    this.adapter = new MicroPythonDevice();
    /** @type {import("micropython-ctl").BoardInfo} */
    this.info = null;
    this.connect();
  }

  async connect() {
    if (this.protocol === "serial") {
      await this.adapter.connectSerial(this.address);
      
      const boardInfoPromise = this.adapter.getBoardInfo();
      const timeOutPromise = new Promise((_res, rej) =>
        setTimeout(() => rej("timed out while getting board info"), 3000)
      );

      return Promise.race([boardInfoPromise, timeOutPromise])
        .then((res) => {
          this.log.debug("boardInfo", res);
          this.info = res;
        })
        .catch((err) => this.log.error(err));
    }
  }

  upload() {
    // this.adapter.
  }
}

module.exports = { Device };
