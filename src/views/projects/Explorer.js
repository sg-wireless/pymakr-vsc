const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/** @implements {vscode.TreeDataProvider<vscode.TreeItem>} */
class ProjectsProvider {
  /**
   * @param {PyMakr} PyMakr
   */
  constructor(PyMakr) {
    PyMakr.projectsStore.subscribe(this.refresh.bind(this));
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
      return this.PyMakr.projectsStore.get().map((project) => new TreeItem(project.name));
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
