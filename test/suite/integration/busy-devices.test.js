const { disconnectAllDevices } = require("./utils");

test("busy devices", async () => {
  const device = pymakr.devicesStore.get()[0];
  await disconnectAllDevices();

  test("can disconnect a busy device", async () => {
    test("can connect the device and safeboot it", async () => {
      await device.connect();
      await device.safeBoot();
      assert(device.connected);
    });    
    test("device is idle", () => {
      console.log('test is idle')
      assert(!device.busy.get());
    });
    test("can run a hanging script", async () => {
      await device.runScript("import time\r\nwhile True: time.sleep(1)", {resolveBeforeResult: true});
      assert(device.connected);
    });
    test("can disconnect the device", async () => {
      await device.disconnect();
      assert(!device.connected);
    });
    test("can connect to a device with a running script", async () => {
      await device.connect();
      assert(device.connected);
    });
    test("running script continues to run after connection", async () => {
      assert(device.busy.get());
    });
    test("can kill running script", async () => {
      await device.safeBoot()
      assert(!device.busy.get());
    });
  });
});
