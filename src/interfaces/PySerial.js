const SerialPort = require("serialport/lib");

class PySerial {
  /** @param {PyMakr} pyMakr */
  constructor(pyMakr, params) {
    this.log = pyMakr.log.createChild("PySerial");
    this.pyMakr = pyMakr;
    this.stream = new SerialPort(
      params.address,
      {
        baudRate: 115200,
        autoOpen: false,
      },
      (err) => {
        this.log.warn("Failed to connect to SerialPort");
        this.log.error(err);
      }
    );
  }
}
