const { Device } = require("../Device");
const { coerceArray } = require("../utils/misc");
const { writable } = require("../utils/store");

/**
 * @param {PyMakr} pymakr
 */
const createDevicesStore = (pymakr) => {
  /** @type {Writable<Device[]>} */
  const store = writable([]);

  /**
   * @param {DeviceInput|DeviceInput[]} deviceInput
   */
  const insert = (deviceInput) => {
    const newDevices = coerceArray(deviceInput).map((input) => new Device(pymakr, input));
    store.update((devices) => [...devices, ...newDevices]);
  };

  /**
   * @param {Device} device
   */
  const remove = (device) => {
    store.update((devices) => devices.filter((_device) => _device !== device));
  };

  /**
   * @param {string} protocol
   * @param {string} address
   */
  const getByProtocolAndAddress = (protocol, address) =>
    store
      .get()
      .find(
        (_device) => _device.protocol === protocol && _device.address.toLowerCase() === address.toLocaleLowerCase()
      );

  return { ...store, getByProtocolAndAddress, insert, remove };
};

module.exports = { createDevicesStore };
