const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/** @implements {vscode.TreeDataProvider<vscode.TreeItem>} */
class ProjectsProvider {
  /**
   * @param {PyMakr} PyMakr
   */
  constructor(PyMakr) {
    PyMakr.projectStore.subscribe(this.refresh.bind(this));
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
      return this.PyMakr.projectStore.get().map((project) => new TreeItem(project.name));
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  /** @type {TreeItem[]|undefined} */
  children;

  /**
   * @param {string} label
   * @param {TreeItem[]=} children
   */
  constructor(label, children) {
    super(
      label,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.children = children;
  }
}

module.exports = { ProjectsProvider };
