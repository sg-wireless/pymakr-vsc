const assert = require('assert');
const vscode = require("vscode");

const { disconnectAllDevices, nextTerminalData } = require("./utils");

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
      const welcomeMsg = nextTerminalData(device);
      pymakr.terminalsStore.create(device);
      const terminal = [...vscode.window.terminals].pop();

      /**@type {vscode.TerminalOptions} */
      const creationOptions = terminal.creationOptions;

      test("created REPL is last terminal", () => assert(creationOptions.shellArgs.includes("serial")));

      test("created repl shows welcome msg", async () => {
        const msg = await welcomeMsg
        //   "\r\nPycom MicroPython 1.20.2.r6 [v1.11-c5a0a97] on 2021-10-28; WiPy with ESP32" +
        //     '\r\nType "help()" for more information.' +
        //     "\r\n>>> "
                // BUG: welcome message (nextTerminalData) does not contain the welcome message (win64)
                assert.match(msg, /MicroPython/, "Could not detect a MicroPython device")
        // todo: low-prio - >>> test fails on esp8266 as the welcomesting is truncated
                assert.match(msg, /\r\n>>>/, "No repl prompt")
      });

      test("can use print command", async () => {
        //BUG: nextTerminalData does not return the next terminal data (win64)
        const receivedFromTerminal = nextTerminalData(device);
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
