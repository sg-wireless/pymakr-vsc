const device = pymakr.devicesStore.get()[0];

const busyChange = (device) => new Promise((resolve) => device.busy.next(resolve));

// tests pertaining to the capabilities of micropython-ctl-cont

test("micropython", async () => {
  await device.connect();
  test("x06 safeboots device", async () => {
    assert(!device.busy.get());
    device.adapter.sendData("\x06");
    await busyChange(device);
    assert(device.busy.get());
    await busyChange(device);
    assert(!device.busy.get());
  });
  test("can use rawRepl", async () => {
    console.log("[TEST] RUN SCRIPT");
    const rawReplPromise = device.runScript("import time\ntime.sleep(0.3)");
    await rawReplPromise;
  });
  test("rawrepl can handle safeboot (ctrl + f / 0x06)", async () => {
    assert(!device.busy.get());
    const rawReplPromise = device.runScript("import time\nprint('hello')\ntime.sleep(100)");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // process.env.debug = "silly";
    device.adapter.sendData("\x06");
    console.log("state", device.adapter.getState());
    assert.equal(device.adapter.getState().receivingResponseSubState, "SCRIPT_ABORTED");
    await rawReplPromise;
  });
  test("rawrepl can handle stopScript(3)", async () => {
    assert(!device.busy.get());
    const rawReplPromise = device.runScript("import time\nprint('hello')\ntime.sleep(100)");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // process.env.debug = "silly";
    await device.stopScript(3);
    console.log("state", device.adapter.getState());
    assert.equal(device.adapter.getState().receivingResponseSubState, "SCRIPT_ABORTED");
    await rawReplPromise;
  });
  test("rawrepl can handle stopScript(0)", async () => {
    assert(!device.busy.get());
    const rawReplPromise = device.runScript("import time\nprint('hello')\ntime.sleep(100)");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // process.env.debug = "silly";
    await device.stopScript(0);
    console.log("state", device.adapter.getState());
    assert.equal(device.adapter.getState().receivingResponseSubState, "SCRIPT_ABORTED");
    await rawReplPromise;
  });
});
