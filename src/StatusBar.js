const vscode = require("vscode");
const { coerceDisposable } = require("./utils/misc");

class StatusBar {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;

    this.advancedMode = vscode.window.createStatusBarItem("advancedMode", 1, 7);
    this.projectDownload = vscode.window.createStatusBarItem("projectDownload", 1, 8);
    this.projectUpload = vscode.window.createStatusBarItem("projectUpload", 1, 9);
    this.deviceSelect = vscode.window.createStatusBarItem("activeWorkspace", 1, 10);
    this.projectSelect = vscode.window.createStatusBarItem("activeWorkspace", 1, 11);

    this.subscriptions = [
      pymakr.activeProjectStore.subscribe(() => this.refresh()),
      pymakr.activeDeviceStore.subscribe(() => this.refresh()),
      pymakr.config.subscribe(() => this.refresh()),
    ];

    this.registerDisposables();
  }

  registerDisposables() {
    this.pymakr.context.subscriptions.push(
      this.advancedMode,
      this.projectDownload,
      this.projectUpload,
      this.deviceSelect,
      this.projectSelect,
      ...this.subscriptions.map(coerceDisposable)
    );
  }

  refresh() {
    this.advancedMode.text = vscode.workspace.getConfiguration("pymakr").get("advancedMode") ? "advanced" : "basic";
    this.advancedMode.command = "pymakr.toggleAdvancedMode";
    this.advancedMode.show();

    this.projectSelect.text = this.pymakr.activeProjectStore.get()?.name || "[no project selected]";
    this.projectSelect.command = "pymakr.setActiveProject";
    this.projectSelect.show();

    this.deviceSelect.text = this.pymakr.activeDeviceStore.get()?.name || "[no device selected]";
    this.deviceSelect.command = "pymakr.setActiveDevice";
    this.deviceSelect.show();

    this.projectUpload.text = "$(cloud-upload)";
    this.projectUpload.command = "pymakr.uploadProject";
    this.projectUpload.show();

    this.projectDownload.text = "$(cloud-download)";
    this.projectDownload.command = "pymakr.downloadProject";
    this.projectDownload.show();
  }
}

module.exports = { StatusBar };
