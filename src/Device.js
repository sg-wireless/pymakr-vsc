class Device {
  /**
   * @param {PyMakr} pyMakr
   * @param {Object} info
   */
  constructor(pyMakr, name, protocol, address, password, info = {}) {
    this.pyMakr = pyMakr;
    this.protocol = protocol;
    this.address = address;
    this.password = password;
    this.name = name;
    this.info = info;
    this.id = `${protocol}://${address}`;
    this.log = pyMakr.log.createChild(this.name);
  }
}

module.exports = { Device };
