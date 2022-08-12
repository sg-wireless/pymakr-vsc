const vscode = require("vscode");
const { DeviceManager } = require("./DeviceManager");

class Watcher {
  /**
   * @param {Project} project
   */
  constructor(project) {
    this.project = project;
    this.log = this.project.pymakr.log.createChild("watch-mode");
    /** @type {DeviceManager[]} */
    this.deviceManagers = [];
    /** @type {vscode.Disposable[]} */
    this.disposables = [];
    this.active = false;
    this.registerFileWatchers();
  }

  /**
   * @param {Device} device
   */
  addDevice(device) {
    if (!this.deviceManagers.map((dm) => dm.device).includes(device))
      this.deviceManagers.push(new DeviceManager(this, device));

    if (this.deviceManagers.length) this.active = true;
    this.deviceManagers.find((dm) => dm.device === device)?.uploadProjectIfNeeded();
  }

  removeDevice(device) {
    this.deviceManagers = [...this.deviceManagers.filter((dm) => dm.device !== device)];
    if (!this.deviceManagers.length) this.active = false;
  }

  registerFileWatchers() {
    // this.deviceManagers = this.devices.map((device) => new DeviceManager(this, device));
    this.watcher = vscode.workspace.createFileSystemWatcher(this.project.absoluteDistDir + "/**");
    this.disposables = [
      this.watcher,
      this.watcher.onDidChange(this.handleFileChange("change")),
      this.watcher.onDidCreate(this.handleFileChange("create")),
      this.watcher.onDidDelete(this.handleFileChange("delete")),
    ];
  }

  destroy() {
    this.disposables.forEach((d) => d.dispose());
  }

  /**
   * @param {'create'|'change'|'delete'} action
   * @returns {(file: vscode.Uri)=>void}
   */
  handleFileChange(action) {
    return (file) => {
      const timestamp = new Date();
      this.project.updatedAt.set(timestamp);
      if (this.active)
        this.deviceManagers
          .filter((dm) => dm.device.adapter.__proxyMeta.target.isConnected())
          .forEach(async (manager) => {
            await manager.push({ file: file.fsPath, action });
            manager.device.state.devUploadedAt.set(timestamp);
          });
    };
  }
}

module.exports = { Watcher };
