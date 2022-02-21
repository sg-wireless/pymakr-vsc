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
  const upsert = (deviceInput) => {
    const deviceInputs = coerceArray(deviceInput);
    const newDeviceInputs = deviceInputs.filter(
      (input) => !store.get().find((device) => device.protocol === input.protocol && device.address === input.address)
    );
    const newDevices = newDeviceInputs.map((input) => new Device(pymakr, input));
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

  return { ...store, getByProtocolAndAddress, upsert, remove };
};

module.exports = { createDevicesStore };
