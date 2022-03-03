const { Device } = require("../Device");
const { coerceArray } = require("../utils/misc");
const { writable } = require("../utils/store");
const { SerialPort } = require("serialport");

/**
 * converts serial.PortInfo to { address, name, protocol, raw }
 * @param {import("@serialport/bindings-cpp").PortInfo & {friendlyName: string}} raw
 * @returns {DeviceInput}
 */
const rawSerialToDeviceInput = (raw) => ({
  address: raw.path,
  name: raw.friendlyName || raw.path,
  protocol: "serial",
  raw,
});

/**
 * @param {DeviceInput} device
 * @returns {string}
 */
const createId = (device) => `${device.protocol}://${device.address}`;

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
      (input) => !store.get().find((device) => createId(device) === createId(input))
    );
    const newDevices = newDeviceInputs.map((input) => new Device(pymakr, input));
    if (newDevices.length) store.update((devices) => [...devices, ...newDevices]);
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

  const registerUSBDevices = async () => {
    pymakr.log.traceShort("register USB devices");
    const rawSerials = await SerialPort.list();
    const deviceInputs = rawSerials.map(rawSerialToDeviceInput);
    const inputIds = deviceInputs.map(createId);

    upsert(deviceInputs);

    store.get().forEach((device) => {
      const _lastOnlineState = device.online;

      // update online status
      device.online = inputIds.includes(device.id);

      // if status has changed, update connection
      if (device.online !== _lastOnlineState) device.updateConnection();
    });
  };

  /** @type {NodeJS.Timer} */
  let watchIntervalHandle;
  const watchUSBDevices = () => {
    watchIntervalHandle = setInterval(registerUSBDevices, 500);
    return () => clearInterval(watchIntervalHandle);
  };

  /**
   * @param {string|string[]} ids
   * @returns {Device[]}
   */
  const getAllById = (ids) => store.get().filter((_device) => coerceArray(ids).includes(_device.id));

  return {
    ...store,
    getByProtocolAndAddress,
    getAllById,
    upsert,
    remove,
    registerUSBDevices,
    watchUSBDevices,
    stopWatchingUSBDevices: () => clearInterval(watchIntervalHandle),
  };
};

/**
 * Store that contains the currently active (primary) device
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
