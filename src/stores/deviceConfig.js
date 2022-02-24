/**
 * @typedef {Object} DeviceConfig
 * @prop {'always'|'never'|'onLostConnection'|'lastState'} autoConnect
 * @prop {string} username defaults to "micro"
 * @prop {string} password defaults to "python"
 * @prop {boolean} _lastState last connected state, true for connected
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
    autoConnect: device.pymakr.config.get().get('autoConnect'),
  };

  /** @type {DeviceConfig} */
  const fromWorkspace = device.pymakr.context.workspaceState.get(WSID) || defaults;

  const { subscribe, set, get } = writable({ ...defaults, ...fromWorkspace });

  return {
    /**
     * 
     * @param {string} key 
     * @param {string|number|object} value JSONable value
     */
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
