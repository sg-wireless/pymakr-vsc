const vscode = require("vscode");

class Terminal {
  /**
   *
   * @param {PyMakr} pyMakr
   * @param {import('./Device').Device} device
   */
  constructor(pyMakr, device) {
    this.pyMakr = pyMakr;
    this.device = device;
    this.log = this.pyMakr.log.createChild("Terminal");

    const args = device.protocol === "serial" ? ["--tty", device.address] : ["--host", device.address, device.password];

    this.term = vscode.window.createTerminal({
      name: device.id,
      shellPath: "npm",
      shellArgs: ["run", "mctl", "--", "repl", ...args],
      // todo fix for simultaneous connections
      // env: { WEBREPL_HOST: Math.floor(Math.random() * 1000).toString() },
    });
    this.term.show();
  }
}

module.exports = { Terminal };
