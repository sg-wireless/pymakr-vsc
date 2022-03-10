const vscode = require("vscode");

const { disconnectAllDevices, nextTerminalData } = require("./utils");



test("Can find devices", async ({ test }) => {
  assert(pymakr.devicesStore.get().length >= 2);

  await disconnectAllDevices();

  test("device", async ({ test }) => {
    const device = pymakr.devicesStore.get()[0];
    await device.connect();

    test("can connect", () => {
      assert(device.connected);
    });

    test("can create REPL", async ({ test }) => {
      const welcomeMsg = nextTerminalData(device);
      pymakr.terminalsStore.create(device);
      const terminal = [...vscode.window.terminals].pop();

      test("created REPL is last terminal", () => assert(terminal.creationOptions.shellArgs.includes("serial")));

      test("created repl shows welcome msg", async() => {
        assert.equal(
          await welcomeMsg,
          "\r\nPycom MicroPython 1.20.2.r6 [v1.11-c5a0a97] on 2021-10-28; WiPy with ESP32" +
            '\r\nType "help()" for more information.' +
            "\r\n>>> "
        );
      });

      test("can use print command", async () => {
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
