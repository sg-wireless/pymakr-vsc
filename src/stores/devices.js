const { Device } = require("../Device");
const { coerceArray } = require("../utils/misc");
const { writable } = require("../utils/store");
const { SerialPort } = require("serialport");

/**
 * converts serial.PortInfo to { address, name, protocol, raw }
 * @param {DeviceInputRaw} raw
 * @returns {DeviceInput}
 */
const rawSerialToDeviceInput = (raw) => ({
  address: raw.path,
  name: raw.friendlyName || raw.path.replace(/^\/dev\//, ""),
  protocol: "serial",
  id: raw.serialNumber,
  raw,
});

/**
 * converts configuration's websocket DeviceInput into a DeviceInput 
 * @param {String} id
 * @param {DeviceInput} diConf
 * @returns {DeviceInput}
 */
const wsConfigToDeviceInput = (id, diConf) => {
  const address = id.substring('ws://'.length);
  const protocol = "ws";
  const name = diConf.name == undefined || diConf.name === '' ? id : diConf.name;
  const password = diConf.password;
  return { address, protocol, name, password, id };
};


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
    pymakr.log.trace("register USB devices");
    const rawSerials = await SerialPort.list();
    const deviceInputs = rawSerials.map(rawSerialToDeviceInput);
    const inputIds = deviceInputs.map((deviceInput) => deviceInput.id);
    upsert(deviceInputs);

    store.get().forEach((device) => {
      const _lastOnlineState = device.online.get();

      // update online status
      device.online.set(inputIds.includes(device.id));

      // if status has changed, update connection
      if (device.online.get() && !device.config.hidden && !_lastOnlineState) device.refreshConnection();
    });
  };

  const registerWSDevices = async () => {
    pymakr.log.trace("register WS devices");
    const deviceConfigs = pymakr.config.get().get("devices").configs;
    const deviceInputs = Object.keys(deviceConfigs)
      .filter(k => k.startsWith('ws://')) // register only ws protocol
      .map(k => wsConfigToDeviceInput(k, deviceConfigs[k]));
    upsert(deviceInputs);
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
    registerWSDevices,
    registerUSBDevices,
    watchUSBDevices,
    stopWatchingUSBDevices: () => clearInterval(watchIntervalHandle),
  };
};

module.exports = { createDevicesStore };
