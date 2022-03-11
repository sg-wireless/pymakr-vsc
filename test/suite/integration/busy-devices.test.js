const { disconnectAllDevices } = require("./utils");

test("busy devices", async ({ test }) => {
  const device = pymakr.devicesStore.get()[0];
  await disconnectAllDevices();

  test("can disconnect a busy device", async () => {
    await device.connect();
    assert(device.connected)
    await device.runScript("import time\r\nwhile True: time.sleep(1)");    
    assert(device.connected)
    await device.disconnect()
    assert(!device.connected)
  });
});
