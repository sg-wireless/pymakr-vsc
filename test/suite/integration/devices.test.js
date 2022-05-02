const assert = require("assert");
const vscode = require("vscode");

const { disconnectAllDevices } = require("./utils");

test("Can find devices", async () => {
  assert(pymakr.devicesStore.get().length >= 2);

  await disconnectAllDevices();

  test("device", async () => {
    const device = pymakr.devicesStore.get()[0];
    await device.connect();

    test("can connect", () => {
      assert(device.connected);
    });

    test("can create REPL", async () => {
      const welcomeMsgPromise = new Promise((resolve) =>
        device.onTerminalData((data) => {
          if (data.match(/MicroPython/)) resolve(data);
        })
      );

      pymakr.terminalsStore.create(device);
      const terminal = [...vscode.window.terminals].pop();

      const welcomeMsg = await welcomeMsgPromise;

      /**@type {vscode.TerminalOptions} */
      const creationOptions = terminal.creationOptions;

      test("created REPL is last terminal", () => assert(creationOptions.shellArgs.includes("serial")));

      test("created repl shows welcome msg", async () => {
        assert.match(welcomeMsg, /MicroPython/, "Could not detect a MicroPython device: " + welcomeMsg);
        assert.match(welcomeMsg, /\r\n>>>/, "No repl prompt");
        // todo: low-prio - >>> test fails on esp8266 as the welcomesting is truncated
      });

      test("can use print command", async () => {
        //BUG: nextTerminalData does not return the next terminal data (win64)
        const receivedFromTerminal = new Promise((resolve) => device.onTerminalData(resolve));
        terminal.sendText('print("foo")\n');
        assert.equal(await receivedFromTerminal, 'print("foo")' + "\r\nfoo" + "\r\n>>> ");
      });

      test("can disconnect", async () => {
        await device.disconnect();
        assert(!device.connected);
      });
    });
  });
});
