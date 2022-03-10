const vscode = require("vscode");

module.exports = {
  setupFile() {
    vscode.commands.executeCommand("pymakr.getPymakr", (pymakr) => {
      pymakr.log.level = 3;
      global.pymakr = pymakr;
    });
  },
};
