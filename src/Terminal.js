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

    const isTelnet = device.protocol === "telnet";

    const args = isTelnet ? ["--host", device.address, device.password] : ["--tty", device.address];
    const env = {}
    if(isTelnet){
      env.WEBREPL_PASSWORD = device.password
      device.password = 'REDACTED'
    }

    const shellArgs = ["run", "mctl", "--", "repl", ...args];
    this.log.debug("exec: npm", shellArgs.join(" "));
    this.term = vscode.window.createTerminal({
      name: device.id,
      shellPath: "npm",
      shellArgs,
      // todo fix for simultaneous connections
      env: { WEBREPL_HOST: Math.floor(Math.random() * 1000).toString() },
    });
    this.term.show();
    console.log(this.term.exitStatus);
  }
}

module.exports = { Terminal };
