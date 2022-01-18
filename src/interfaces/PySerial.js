const SerialPort = require("serialport/lib");
const { BaseInterface } = require("./Base");

class PySerial extends BaseInterface {
  /**
   *
   * @param {import('../Device').Device} device
   * @param {*} params
   */
  constructor(device, params) {
    super(device, params);
    this.log = device.log.createChild("PySerial");

    this.stream = new SerialPort(
      params.address,
      {
        baudRate: 115200,
        autoOpen: true,
      },
      (err) => {
        this.log.warn("Failed to connect to SerialPort", params.address);
        if (err) this.log.error(err);
        this.log.info("connected to", params.address);
      }
    );
  }
}

module.exports = { PySerial };
