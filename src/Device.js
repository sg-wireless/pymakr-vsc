const { PySerial } = require("./interfaces/PySerial");

class Device {
  /**
   * @param {import('serialport').PortInfo & {friendlyName?: string}} info
   * @param {PyMakr} pyMakr
   */
  constructor(info, pyMakr) {
    this.info = info;
    this.name = info.friendlyName;
    this.pyMakr = pyMakr;
    this.log = pyMakr.log.createChild(info.friendlyName);
    
    this.interfaces = {
      usb: new PySerial(this, { address: info.path }),
    };
  }
}

module.exports = { Device };
