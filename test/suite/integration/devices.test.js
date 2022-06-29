const assert = require("assert");
const { readFileSync } = require("fs");
const vscode = require("vscode");
const { timer } = require("./utils");

test("Can find devices", async () => {
  assert(pymakr.devicesStore.get().length >= 2);

  test("device", async () => {
    const device = pymakr.devicesStore.get()[0];
    await device.connect();

    test("can connect", () => {
      assert(device.connected.get());
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
        assert.match(welcomeMsg, /\r\n>>>/, "No repl prompt. Received: " + welcomeMsg);
        // todo: low-prio - >>> test fails on esp8266 as the welcomesting is truncated
      });

      test("can use print command", async () => {
        if (device.busy.get()) await new Promise(device.busy.next);
        terminal.sendText('print("foo")\n');
        await new Promise((resolve) => device.readUntil(['print\\("foo"\\)', "foo", ">>> "].join("\r\n"), resolve));
      });

      test('can run large script', async ()=> {
        pymakr.commands.runScript(readFileSync(__dirname+'/file-management/_sample/folder/large-file.py', 'utf8'), device)
        await new Promise((resolve) => device.readUntil('number is\r\n1000', resolve));        
      })

      

      test('can configure chunking', async ()=>{
        const script = `print('Hello world. How are you today?')\n`

        const withoutChunk = await timer(()=>device.runScript(script))
        await device._config.set({...device.config, adapterOptions: {chunkSize: 8, chunkDelay: 15}})
        await device.disconnect()
        await device.connect()
        const withChunk = await timer(()=>device.runScript(script))
        await device._config.set({...device.config, adapterOptions: {chunkSize: null, chunkDelay: null}})
        await device.disconnect()
        await device.connect()

        assert.equal(withChunk.result, 'Hello world. How are you today?')
        assert.equal(withoutChunk.result, 'Hello world. How are you today?')
        assert(withChunk.time > (withoutChunk.time * 1.5), `Chunking should be slower ${withChunk.time} > (${withoutChunk.time} * 1.5)`)
      })

      test("can disconnect", async () => {
        await device.disconnect();
        assert(!device.connected.get());
      });
    });
  });
});
