const { createServer } = require("net");
const PORT = 5364;

class Server {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("terminal server");
    this.server = createServer((socket) => {
      socket.once("data", (data) => {
        const { protocol, address } = JSON.parse(data.toString());
        const device = this.pymakr.devicesStore
          .get()
          .find((_device) => _device.protocol === protocol && _device.address === address);

        // listen to keystrokes
        socket.on("data", (data) => {
          device.adapter.sendData(data);
          device.adapter.onTerminalData = (data) => socket.write(data);
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
