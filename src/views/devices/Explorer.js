const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

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

  /**
   * @param {Dependency} element
   * @returns { vscode.TreeItem }
   */
  getTreeItem(element) {
    // console.log({ element });
    // console.log(element.label.name);
    return element;
  }

  /**
   *
   * @param {Dependency} element
   * @returns  {Dependency[]}
   */
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
   * @param {import('../../Device').Device} device
   * @param {TreeItem[]=} children
   */
  constructor(device, children) {
    super(
      device.name,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.protocol = device.protocol;
    this.address = device.address;
    this.id = device.id
  }
}

module.exports = { DevicesProvider };
