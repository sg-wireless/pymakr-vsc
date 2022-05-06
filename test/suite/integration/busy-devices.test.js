const { disconnectAllDevices, sleep } = require("./utils");

test("busy devices", async () => {
  const device = pymakr.devicesStore.get()[0];
  await disconnectAllDevices();

  test("can disconnect a busy device", async () => {
    test("can connect the device", async () => {
      await device.connect();
      assert(device.connected);
      test("can safeboot device", async () => {
        await device.safeBoot();
        assert(device.connected);
      });
    });
    test("device is idle", async () => {
      if (device.busy.get()) await new Promise((resolve) => device.busy.next(resolve));
      assert(!device.busy.get());
    });
    test("can run a temporary hanging script", async () => {
      assert(!device.busy.get(), "device should be idle before the script");
      const promise = device.runScript("import time\r\ntime.sleep(1)");
      assert(device.busy.get(), "device should be busy immediately after running the script");
      await sleep(500);
      assert(device.busy.get(), "devise should be busy 500 ms into the 1s script");
      await promise;
      assert(!device.busy.get(), "device should not be busy after the script has finished (1s)");
    });
    test("can run a hanging script", async () => {
      await device.runScript("import time\r\nwhile True: time.sleep(1)", { resolveBeforeResult: true });
      await sleep(100);
      assert(device.connected);
      assert(device.busy.get());
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
      await device.safeBoot();
      assert(!device.busy.get());
    });
  });
});
