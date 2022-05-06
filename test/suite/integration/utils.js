const disconnectAllDevices = () => Promise.all(pymakr.devicesStore.get().map((device) => device.disconnect()));
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

module.exports = { disconnectAllDevices, sleep };
