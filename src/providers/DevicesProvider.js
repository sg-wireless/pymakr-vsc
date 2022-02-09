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
    // console.log({ element });
    // console.log(element.label.name);
    return element;
  }

  getChildren(element) {
    if (element === undefined) {
      return this.PyMakr.devicesStore.get().map((device) => new DeviceTreeItem(device));
    }
    return element.children;
  }
}

class DeviceTreeItem extends vscode.TreeItem {
  /** @type {DeviceTreeItem[]|undefined} */
  children;

  /**
   * @param {import('../Device').Device} device
   * @param {DeviceTreeItem[]=} children
   */
  constructor(device, children) {
    super(
      device.name,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.contextValue = "device";
    this.device = device
  }
}

module.exports = { DevicesProvider, DeviceTreeItem };
