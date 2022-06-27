const { resolve } = require("path");
const vscode = require("vscode");

/**
 * Runs the client terminal, eg. `node client.js serial COM6`
 * Each new terminal is an instance of this class
 * We need this because VSCode terminals have to be external scripts
 */
class Terminal {
  /**
   * @param {PyMakr} pymakr
   * @param {import('../Device').Device} device
   */
  constructor(pymakr, device) {
    this.pymakr = pymakr;
    this.device = device;
    this.log = this.pymakr.log.createChild("Terminal");

    this.term = vscode.window.createTerminal(this.pymakr.getTerminalProfile(device.protocol, device.address));
    this.term.show();

    // dispose of the terminal when closing VSCode
    this.pymakr.context.subscriptions.push(this.term)
  }
}

module.exports = { Terminal };
