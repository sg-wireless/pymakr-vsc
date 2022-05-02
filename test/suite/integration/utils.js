const disconnectAllDevices = () => Promise.all(pymakr.devicesStore.get().map((device) => device.disconnect()));

module.exports = { disconnectAllDevices };
