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
      return this.PyMakr.projectsStore.get().map((project) => new ProjectTreeItem(project));
    }
    return element.children;
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  /**
   * @param {import('../Project').Project} project
   */
  constructor(project) {
    super(project.name, 2);
    this.project = project;
    this.children = project.devices.map((device) => new ProjectDeviceTreeItem(device, project));
    this.contextValue = "project";
  }
}

class ProjectDeviceTreeItem extends vscode.TreeItem {
  /**
   *
   * @param {import('../Device').Device} device
   * @param {import('../Project').Project} project
   */
  constructor(device, project) {
    super(device.name, vscode.TreeItemCollapsibleState.None);
    this.project = project
    this.device = device
    this.contextValue = device.connected ? "connectedProjectDevice" : 'projectDevice';
    const filename = device.connected ? 'lightning.svg' : 'lightning-muted.svg'
    this.iconPath = {
      dark: path.join(__dirname + "..", "..", "..", "media", "dark", filename),
      light: path.join(__dirname + "..", "..", "..", "media", "light", filename),
    };
  }
}

module.exports = { ProjectsProvider, ProjectTreeItem, ProjectDeviceTreeItem };
