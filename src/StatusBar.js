const vscode = require("vscode");
const { coerceDisposable } = require("./utils/misc");

class StatusBar {
  /**
   * @param {PyMakr} pymakr
   */
  constructor(pymakr) {
    this.pymakr = pymakr;

    this.advancedMode = vscode.window.createStatusBarItem("advancedMode", 1, 7);

    this.subscriptions = [pymakr.config.subscribe(() => this.refresh())];

    this.registerDisposables();
  }

  registerDisposables() {
    this.pymakr.context.subscriptions.push(this.advancedMode, ...this.subscriptions.map(coerceDisposable));
  }

  refresh() {
    this.advancedMode.text = vscode.workspace.getConfiguration("pymakr").get("advancedMode") ? "advanced" : "basic";
    this.advancedMode.command = "pymakr.toggleAdvancedMode";
    this.advancedMode.show();
  }
}

module.exports = { StatusBar };
