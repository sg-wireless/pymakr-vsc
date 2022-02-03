const { resolve } = require("path");
const vscode = require("vscode");

class Terminal {
  /**
   * @param {PyMakr} pyMakr
   * @param {import('../Device').Device} device
   */
  constructor(pyMakr, device) {
    this.pyMakr = pyMakr;
    this.device = device;
    this.log = this.pyMakr.log.createChild("Terminal");
    const clientFile = resolve(__dirname, "client.js");

    const shellArgs = [clientFile, device.protocol, device.address];
    const shellPath = "node";
    const name = device.id;

    this.log.debug("exec: node", shellArgs.join(" "));

    this.term = vscode.window.createTerminal({ name, shellPath, shellArgs });
    this.term.show();
    
    console.log(this.term.exitStatus);
  }
}

module.exports = { Terminal };
