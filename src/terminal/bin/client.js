/**
 * This file is the CLI that connects to the terminal server
 * It is executed in the shell by Terminal.js
 */

const { appendFileSync } = require("fs");
const net = require("net");
const prompts = require("prompts");
const readline = require("readline");
const host = "127.0.0.1";
const port = 5364;
const logFile = __dirname + "/info.log";

createConnection();

function createConnection() {
  const socket = new net.Socket();

  let [_1, _2, protocol, address] = process.argv;

  socket.connect(port, host, async () => {
    // first message contains available devices
    socket.once("data", async (data) => {
      const availableDevices = JSON.parse(data.toString());
      // if no device is specified, prompt the user to select one and then connect
      if (!protocol || !address) ({ protocol, address } = await prompt(availableDevices));
      startClient(protocol, address);
    });
  });

  return socket;

  async function startClient(protocol, address) {
    // let the server know which device we want to listen to
    socket.write(JSON.stringify({ address, protocol }));
    process.stdin.setRawMode(true);
    process.stdin.resume(); // prompt stops input
    console.clear(); // clear prompt message

    // send stdin to keypress events
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on("keypress", async (str, key) => {
      socket.write(Buffer.from(key.sequence));
      if (key.name === "k" && key.ctrl) process.exit(0);
      if (key.name === "x" && key.ctrl) process.exit(0);
    });

    // send Ctrl+B for friendly REPL
    socket.write("\x02");

    // proxy data from the device to the terminal
    socket.on("data", (data) => process.stdout.write(data));

    // on errors, try to reconnect every second
    socket.on("error", (err) => {
      const reconnectInterval = setInterval(() => {
        try {
          const _socket = createConnection();
          _socket.once("data", async () => {
            clearInterval(reconnectInterval);
          });
        } catch (err) {
          console.log(err);
        }
      }, 1000);
      appendFileSync(logFile, "\r\n" + err.toString());
    });
  }

  /**
   * Prompts the user to select a device
   * @param {ProtocolAndAddress[]} availableDevices
   */
  async function prompt(availableDevices) {
    const { connection } = await prompts.prompt({
      type: "select",
      name: "connection",
      message: "pick a connection",
      choices: availableDevices.map((ad) => ({ title: `${ad.protocol}://${ad.address}`, value: ad })),
    });
    return connection;
  }
}
