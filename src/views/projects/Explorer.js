const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/** @implements {vscode.TreeDataProvider<vscode.TreeItem>} */
class ProjectsProvider {
  /**
   * @param {PyMakr} PyMakr
   */
  constructor(PyMakr) {
    this.PyMakr = PyMakr;

    this.PyMakr.projectStore.subscribe(this.refresh.bind(this));

    setTimeout(() => {
      console.log("timeout", PyMakr.projectStore.get());
    }, 5000);
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
    console.log({ element });
    return element;
  }

  /**
   *
   * @param {Dependency} element
   * @returns  {Dependency[]}
   */
  getChildren(element) {
    console.log("getting children");
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
