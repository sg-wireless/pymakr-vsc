const disconnectAllDevices = () => Promise.all(pymakr.devicesStore.get().map((device) => device.disconnect()));

/**
 * @param {import("../../../src/Device").Device} device
 */
const nextTerminalData = (device) => {
  const oldHook = device.onTerminalData;
  return new Promise((resolve) => {
    device.onTerminalData = (data) => {
      resolve(data);
      return oldHook(data);
    };
  });
};

module.exports = { disconnectAllDevices, nextTerminalData };
