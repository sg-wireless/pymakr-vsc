const vscode = require("vscode");
const { resetFixture } = require("../../utils");

const workspaceDir = process.env.fixturePath;
const PROJECT_STORE_TIMEOUT = 10000;

/**
 * @param {Device} device
 */
const prepDevice = async (device) => {
  device.adapter.__proxyMeta.clearQueue();
  console.log("[PREP] Waiting for idle...");
  await device.adapter.__proxyMeta.idle;
  await device.connect();
  console.log("[PREP] Safebooting...");
  await pymakr.commands.safeBootDevice({ device });
  // TODO timeout here should not be required. High priority!
  console.log("[PREP] Safebooting complete!");
  // await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("[PREP] Erasing...");
  await pymakr.commands.eraseDevice({ device });
  console.log("[PREP] Erasing complete!");
  console.log("[PREP] Disconnecting...");
  await device.disconnect();
  console.log("[PREP] Disconnecting complete!");
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
