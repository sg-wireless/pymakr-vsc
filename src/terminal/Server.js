const { createServer } = require("net");
const vscode = require('vscode')
const PORT = 5364; // todo abstract

/**
 * This is the terminal server. It handles all client terminal connections.
 */
class Server {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("terminal server");
    // creates a new server for each new client
    this.server = createServer((socket) => {
      /** @type {ProtocolAndAddress[]} */
      const availableDevices = pymakr.devicesStore
        .get()
        .map((device) => ({ protocol: device.protocol, address: device.address }));

      //send available devices to client
      socket.write(JSON.stringify(availableDevices));

      //listen for client to return protocol and address
      socket.once("data", (data) => {
        const { protocol, address } = JSON.parse(data.toString());

        const device = this.pymakr.devicesStore
          .get()
          .find((_device) => _device.protocol === protocol && _device.address === address);

        vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', {name: `${protocol}://${address}`})

        // listen to keystrokes from client
        socket.on("data", (data) => {
          this.log.debug('received', data.toString())
          device.adapter.sendData(data);
          // make sure device data is sent to the last active terminal
          device.__onTerminalDataExclusive = (data) => socket.write(data);
        });
        
        socket.on("error", (err) => {
          if (err.code !== "ECONNRESET") throw err;
          else this.log.debug("client disconnected");
        });
      });
    }).listen(PORT);
    console.log("listening on", PORT);
  }
}

module.exports = { Server };
