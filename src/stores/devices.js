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

/**
 * @param {PyMakr} pymakr
 */
const createActiveDeviceStore = (pymakr) => {
  /** @type {Writable<Device>} */
  const store = writable(null);

  /** @param {Device} value */
  const set = (value) => {
    pymakr.context.workspaceState.update("activeDevice", value.id);
    store.set(value);
  };

  /**
   * Recovers the active device from the workspace state
   * If no device is found, the first available device is chosen
   */
  const setToLastUsedOrFirstFound = () => {
    const deviceId = pymakr.context.workspaceState.get("activeDevice");
    const devices = pymakr.devicesStore.get();
    if (devices && devices.length) {
      const device = devices.find((d) => d.id === deviceId) || devices.find((d) => d.connected) || devices[0];
      set(device);
    }
  };
  return {
    ...store,
    set,
    setToLastUsedOrFirstFound,
  };
};

module.exports = { createDevicesStore, createActiveDeviceStore };
