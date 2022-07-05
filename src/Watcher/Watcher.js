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
  }

  /**
   * @param {Device} device
   */
  addDevice(device) {
    if (!this.deviceManagers.map((dm) => dm.device).includes(device))
      this.deviceManagers.push(new DeviceManager(this, device));

    if (this.deviceManagers.length) this.start();
  }

  removeDevice(device) {
    this.deviceManagers = [...this.deviceManagers.filter((dm) => dm.device !== device)];
    if (!this.deviceManagers.length) this.stop();
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.onStart();
  }

  onStart() {
    // this.deviceManagers = this.devices.map((device) => new DeviceManager(this, device));
    this.watcher = vscode.workspace.createFileSystemWatcher(this.project.folder + "/**");
    this.disposables = [
      this.watcher,
      this.watcher.onDidChange(this.handleFileChange("change")),
      this.watcher.onDidCreate(this.handleFileChange("create")),
      this.watcher.onDidDelete(this.handleFileChange("delete")),
    ];
  }

  stop() {
    this.disposables.forEach((d) => d.dispose());
    this.active = false;
  }

  /**
   * @param {'create'|'change'|'delete'} action
   * @returns {(file: vscode.Uri)=>void}
   */
  handleFileChange(action) {
    return async (file) => {
      this.deviceManagers
        .filter((dm) => dm.device.adapter.__proxyMeta.target.isConnected())
        .forEach((manager) => manager.push({ file: file.fsPath, action }));
    };
  }
}

module.exports = { Watcher };
