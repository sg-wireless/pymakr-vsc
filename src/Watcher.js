const vscode = require("vscode");

class Watcher {
  /**
   *
   * @param {Project} project
   */
  constructor(project) {
    this.project = project;
    this.pymakr = project.pymakr;
    this.log = this.pymakr.log.createChild("watch-mode");
    /** @type {vscode.Disposable[]} */
    this.disposables = [];
    this.active = false;
    this.resetPromise = null;
    this.fileActionPromises = [];
  }

  start() {
    if (this.active) return;

    this.active = true;
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
      console.log("action", action, file.fsPath);
      await this.resetPromise;
      this.project.devices
        .filter((device) => device.adapter.__proxyMeta.target.isConnected())
        .forEach(async (device) => {
          if (action === "delete") {
            const target = require("path").relative(this.project.folder, file.fsPath).replace(/\\/g, "/");
            this.fileActionPromises.push(device.remove(target));
          } else this.fileActionPromises.push(this.pymakr.commands.upload(file, device, ""));
        });
      this.resetWhenIdle();
    };
  }


  resetWhenIdle() {
    if(this._resetPending) return
    this._resetPending = true

    
  }
}
