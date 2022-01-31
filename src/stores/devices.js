const serialport = require("serialport");
const { Device } = require("../Device");
const { writable } = require("../utils/store");

/**
 * @param {PyMakr} pyMakr
 */
const getDevices = async (pyMakr) => {
  const devices = await serialport.list();
  return devices.map((device) => new Device(pyMakr, device.friendlyName, 'serial', device.path, null, device));
};

/**
 * @param {PyMakr} pyMakr
 */
const createDevicesStore = (pyMakr) => {
  /** @type {Writable<Device[]>} */
  const store = writable([]);

  const refresh = async () => store.set(await getDevices(pyMakr));
  refresh();

  return { ...store, refresh };
};

module.exports = { createDevicesStore };
