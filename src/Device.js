class Device {
  /**
   * @param {import('serialport').PortInfo & {friendlyName?: string}} info
   */
  constructor(info, pyMakr) {
    this.info = info;
    this.name = info.friendlyName;
    this.pyMakr = pyMakr
    console.log(this);
  }
}

module.exports = { Device };
