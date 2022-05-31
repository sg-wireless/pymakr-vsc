const path = require("path");
const vscode = require("vscode");

/** @implements {vscode.TreeDataProvider<vscode.TreeItem>} */
class DevicesProvider {
  /**
   * @param {PyMakr} PyMakr
   */
  constructor(PyMakr) {
    PyMakr.devicesStore.subscribe(this.refresh.bind(this));
    this.PyMakr = PyMakr;
  }

  _onDidChangeTreeData = new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element === undefined) {
      return this.PyMakr.devicesStore
        .get()
        .filter((device) => !device.isHidden)
        .map((device) => new DeviceTreeItem(device, this));
    }
    return element.children;
  }
}

class DeviceTreeItem extends vscode.TreeItem {
  /** @type {DeviceTreeItem[]|undefined} */
  children;

  /**
   * @param {import('../Device').Device} device
   * @param {DevicesProvider} tree
   */
  constructor(device, tree) {
    super(device.displayName, vscode.TreeItemCollapsibleState.None);
    this.device = device;
    const state = device.connected ? (device.busy.get() ? "busy" : "idle") : "offline";
    this.contextValue = `${state}#none#device`;
    const filename = device.connected ? "lightning.svg" : "lightning-muted.svg";

    this.tooltip = state;

    this.iconPath = device.busy.get()
      ? new vscode.ThemeIcon("sync~spin")
      : {
          dark: path.join(__dirname + "..", "..", "..", "media", "dark", filename),
          light: path.join(__dirname + "..", "..", "..", "media", "light", filename),
        };
    device.busy.subscribe((isBusy) =>
      setTimeout(() => {
        if (device.busy.get() === isBusy) tree.refresh();
      }, 100)
    );
  }
}

module.exports = { DevicesProvider, DeviceTreeItem };
