const { disconnectAllDevices } = require("./utils");

test("busy devices", async () => {
  const device = pymakr.devicesStore.get()[0];
  await disconnectAllDevices();

  test("can disconnect a busy device", async () => {
    test("can connect the device", async () => {
      await device.connect();
      assert(device.connected);
    });
    test("can run a hanging script", async () => {
      await device.runScript("import time\r\nwhile True: time.sleep(1)");
      assert(device.connected);
    });
    test("can disconnect the device", async () => {
      await device.disconnect();
      assert(!device.connected);
    });
  });
});
