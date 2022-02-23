/**
 * @typedef {Object} DeviceConfig
 * @prop {'always'|'never'|'onLostConnection'} autoConnect
 */

const { writable } = require('../utils/store');

/**
 * Creates a config for a given device
 * Each config is automatically retrieved from and stored in the workspace state
 * @param {import('../Device').Device} device
 */
const createDeviceConfigStore = (device) => {
  const WSID = `pymakr.devices.${device.id}.config`;
  /** @type {DeviceConfig} */
  const defaults = {
    autoConnect: "onLostConnection",
  };

  /** @type {DeviceConfig} */
  const fromWorkspace = device.pymakr.context.workspaceState.get(WSID) || defaults;

  const { subscribe, set, get } = writable({ ...defaults, ...fromWorkspace });

  return {
    set: (key, value) => {
      const updatedCfg = { ...get(), [key]: value };
      set(updatedCfg);
      device.pymakr.context.workspaceState.update(WSID, updatedCfg);
    },
    get,
    subscribe,
  };
};

module.exports = { createDeviceConfigStore };
