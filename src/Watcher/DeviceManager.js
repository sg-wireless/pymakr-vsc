const { removeOverlappingInstructions } = require("./utils");

/**
 * @typedef {'change'|'create'|'delete'} FileAction
 * @typedef {{action: FileAction, file: string}} FileInstruction
 */

/**
 * Device Manager updates and restarts devices whenever the push method is called
 */
class DeviceManager {
  /**
   * @param {import('./Watcher').Watcher} watcher
   * @param {Device} device
   */
  constructor(watcher, device) {
    this.watcher = watcher;
    this.device = device;
    this.project = this.watcher.project;
    this.pymakr = this.project.pymakr;
    this.log = watcher.log.createChild(device.name);

    /** @type {FileInstruction[]} */
    this.fileInstructions = [];

    this.isRunning = false;
  }

  get outOfSync() {
    return this.device.state.devUploadedAt.get() !== this.project.updatedAt.get();
  }

  get shouldUploadOnDev() {
    const uploadWhen = this.project.config.dev?.uploadOnDevStart || "outOfSync";
    return uploadWhen === "always" || (uploadWhen === "outOfSync" && this.outOfSync);
  }

  async uploadProjectIfNeeded() {
    if (!this.device.adapter.__proxyMeta.target.isConnected()) return;

    const answer = await this.device.pymakr.notifier.notifications.deviceIsOutOfSync(this);

    if (this.shouldUploadOnDev || answer === "upload")
      await this.device.pymakr.commands.uploadProject({ device: this.device, project: this.project });
  }

  /**
   * Send a change/create/delete file instruction to the device
   * @param {FileInstruction} fileInstruction
   */
  push(fileInstruction) {
    this.fileInstructions.push(fileInstruction);
    return this.handleNewInstructions();
  }

  async handleNewInstructions() {
    if (this.isRunning) {
      this.log.debug("already updating and restarting");
      return;
    }
    this.isRunning = true;
    await this.updateAndRestart();
    this.isRunning = false;
    this.log.debug("device/script restart completed");

    // If new instructions were added while we restarted the device/script, let's rerun.
    if (this.fileInstructions.length) await this.handleNewInstructions();
  }

  /**
   * Stops the current running script, performs file changes and restarts the device or main script
   */
  async updateAndRestart() {
    const modulesToDelete = ["main.py"];

    this.log.debug("stop script");
    await this.device.pymakr.commands.stopScript({ device: this.device });

    this.log.debug("run instructions");
    // Loop to make sure we get all instructions before we reset.
    // New instructions could have been added while we executed previous ones
    while (this.fileInstructions.length) {
      const instructions = removeOverlappingInstructions([...this.fileInstructions]);
      this.fileInstructions.length = 0;
      for (const instruction of instructions) modulesToDelete.push(await this.runInstruction(instruction));
    }
    console.log("copying", __dirname + "/fakemachine.py");
    await this.pymakr.commands.upload({ fsPath: __dirname + "/fakemachine.py" }, this.device, "fakemachine.py");

    /** @type {'restartScript'|'softRestartDevice'|'hardRestartDevice'} */
    const onUpdate = this.project.config?.dev?.onUpdate || "restartScript";
    await this[onUpdate](modulesToDelete);

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async hardRestartDevice(modulesToDelete) {
    this.log.log("hard restart device");
    await this.device.runScript(`\rprint("[dev] \'${modulesToDelete[0]}\' changed. Restarting... ")\r`);
    this.device.reset();
  }

  async softRestartDevice(modulesToDelete) {
    this.log.log("soft restart device (ctrl+d)");
    await this.device.runScript(`\rprint("[dev] \'${modulesToDelete[0]}\' changed. Restarting... ")\r`);
    this.device.adapter.sendData("\x04");
  }

  restartScript(modulesToDelete) {
    this.log.log("restart script");
    this.device.runUserScript(scripts.restart(modulesToDelete), { resolveBeforeResult: false });
  }

  /**
   * @param {FileInstruction} fileInstruction
   */
  async runInstruction({ file, action }) {
    this.log.debug("run instruction", { file, action });
    const target = require("path").relative(this.watcher.project.folder, file).replace(/\\/g, "/");

    // // todo remove promise
    // await new Promise((resolve) => setTimeout(resolve, 100));
    if (action === "delete") {
      await this.device.remove(target);
    } else {
      await this.pymakr.commands.upload({ fsPath: file }, this.device, target);
    }
    return target;
  }
}

module.exports = { DeviceManager };
