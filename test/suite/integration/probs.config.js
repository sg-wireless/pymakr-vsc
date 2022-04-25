const vscode = require("vscode");
const { resetFixture } = require("../../utils");

const workspaceDir = process.env.fixturePath
const PROJECT_STORE_TIMEOUT = 3000;

module.exports = {
  async setupFile() {
    resetFixture(workspaceDir)
    await vscode.commands.executeCommand("pymakr.getPymakr", (pymakr) => {
      pymakr.log.level = 3;
      Object.assign(global, { pymakr, workspaceDir, PROJECT_STORE_TIMEOUT });
    });
  },
};
