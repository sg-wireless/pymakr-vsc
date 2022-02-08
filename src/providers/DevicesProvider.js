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
      return this.PyMakr.devicesStore.get().map((device) => new TreeItem(device));
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  /** @type {TreeItem[]|undefined} */
  children;

  /**
   * @param {import('../Device').Device} device
   * @param {TreeItem[]=} children
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

module.exports = { DevicesProvider };
