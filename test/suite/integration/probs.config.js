const vscode = require("vscode");
const { join } = require("path");

const workspaceDir = join( __dirname , "/../../workspaces/integration");
const PROJECT_STORE_TIMEOUT = 3000;

module.exports = {
  async setupFile() {
    await vscode.commands.executeCommand("pymakr.getPymakr", (pymakr) => {
      pymakr.log.level = 3;
      Object.assign(global, { pymakr, workspaceDir, PROJECT_STORE_TIMEOUT });
    });
  },
};
