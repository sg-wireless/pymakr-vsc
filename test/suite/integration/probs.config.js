const vscode = require("vscode");

module.exports = {
  setupFile() {
    vscode.commands.executeCommand("pymakr.getPymakr", (val) => (global.pymakr = val));
  },
};
