const { Socket } = require("net");
const { resolve } = require("path");
const vscode = require("vscode");
const { once } = require("./utils/misc");

// reference: https://github.com/pycom/pymakr-vsc/blob/680770c502f5042526d3b1cb85706fb19c0951d2/lib/main/terminal.js

class Terminal {
  /**
   *
   * @param {PyMakr} pyMakr
   * @param {string} address
   */
  constructor(pyMakr, address) {
    // /** @type {'connecting'|'connected'|'closed'|'failed'} */
    // this.status = "connecting";
    this.address = address
    this.pyMakr = pyMakr;
    this.log = this.pyMakr.log.createChild("Terminal");
    this.term = vscode.window.createTerminal("my new terminal", "npm", ["run", "mctl", "--", "repl"]);
    this.term.show();
  }
}

module.exports = { Terminal };
