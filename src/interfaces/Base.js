class BaseInterface {
  /**
   *  @param {import('../Device').Device} device
   *  @param {{address: string}} params
   */
  constructor(device, params) {
    this.device = device;
  }
}

module.exports = { BaseInterface };
