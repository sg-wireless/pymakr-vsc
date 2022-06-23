const disconnectAllDevices = () => Promise.all(pymakr.devicesStore.get().map((device) => device.disconnect()));
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const timer = async (callback) => {
  const start = Date.now();
  const result = await callback();
  const time = Date.now() - start;
  return { time, result };
};

module.exports = { disconnectAllDevices, sleep, timer };
