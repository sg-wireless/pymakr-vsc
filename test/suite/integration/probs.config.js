const vscode = require("vscode");
const { resetFixture } = require("../../utils");

const workspaceDir = process.env.fixturePath;
const PROJECT_STORE_TIMEOUT = 3000;

/**
 * @param {Device} device
 */
const prepDevice = async (device) => {
  await device.connect();
  await pymakr.commands.eraseDevice({ device });
  await device.disconnect();
};

module.exports = {
  async setupFile() {
    resetFixture(workspaceDir);
    /** @type {PyMakr} */
    let pymakr;
    await vscode.commands.executeCommand("pymakr.getPymakr", (_pymakr) => (pymakr = _pymakr));
    pymakr.log.level = 3;
    Object.assign(global, { pymakr, workspaceDir, PROJECT_STORE_TIMEOUT });

    await Promise.all(pymakr.devicesStore.get().map(prepDevice));
  },
};
