const { resolve } = require("path");
const vscode = require("vscode");

/**
 * Runs the client terminal, eg. `node client.js serial COM6`
 * Each new terminal is an instance of this class
 * We need this because VSCode terminals have to be external scripts
 */
class Terminal {
  /**
   * @param {PyMakr} pyMakr
   * @param {import('../Device').Device} device
   */
  constructor(pyMakr, device) {
    this.pyMakr = pyMakr;
    this.device = device;
    this.log = this.pyMakr.log.createChild("Terminal");
    const clientFile = resolve(__dirname, "bin/client.js");

    const shellArgs = [clientFile, device.protocol, device.address];
    const shellPath = "node";
    const name = device.id;

    this.log.debug("exec: node", shellArgs.join(" "));

    this.term = vscode.window.createTerminal({ name, shellPath, shellArgs });
    this.term.show();
  }
}

module.exports = { Terminal };
