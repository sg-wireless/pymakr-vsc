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
      return this.PyMakr.projectsStore.get().map((project) => new ProjectTreeItem(project, this));
    }
    return element.children;
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  /**
   * @param {import('../Project').Project} project
   * @param {ProjectsProvider} tree
   */
  constructor(project, tree) {
    super(project.name, 2);
    this.project = project;
    const children = project.devices
      .filter((device) => !device.config.hidden)
      .map((device) => new ProjectDeviceTreeItem(device, project, tree));

    this.children = children.length ? children : [new ProjectEmptyTreeItem(project)];

    const hasOnlineChild = project.devices.find((device) => device.adapter.__proxyMeta.target.isConnected());
    const hasOfflineChild = project.devices.find((device) => !device.adapter.__proxyMeta.target.isConnected());
    const onlineStatus =
      hasOnlineChild && hasOfflineChild ? "mixed" : hasOnlineChild ? "online" : hasOfflineChild ? "offline" : "no";

    const hasBusyChild = project.devices.find((device) => device.busy.get());
    const hasIdleChild = project.devices.find((device) => !device.busy.get());
    const busyStatus = hasBusyChild && hasIdleChild ? "mixed" : hasBusyChild ? "busy" : hasIdleChild ? "idle" : "no";

    this.contextValue = `${busyStatus}#${onlineStatus}Children#project`;
  }
}

class ProjectEmptyTreeItem extends vscode.TreeItem {
  /**
   * @param {Project} project
   */
  constructor(project) {
    super("ADD DEVICES", vscode.TreeItemCollapsibleState.None);
    this.command = {
      title: 'Select Devices',
      tooltip: 'Add devices to your project',
      command: "pymakr.selectDevicesForProjectPrompt",
      arguments: [project],
    };
  }
}

class ProjectDeviceTreeItem extends vscode.TreeItem {
  /**
   *
   * @param {import('../Device').Device} device
   * @param {import('../Project').Project} project
   * @param {ProjectsProvider} tree
   */
  constructor(device, project, tree) {
    super(device.displayName, vscode.TreeItemCollapsibleState.None);
    this.project = project;
    this.device = device;
    const state = device.connected ? (device.busy.get() ? "busy" : "idle") : "offline";
    this.contextValue = `${state}#project#device`;
    const filename = device.connected ? "lightning.svg" : "lightning-muted.svg";
    this.tooltip = device.pymakr.vscodeHelpers.deviceSummary(device);
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

module.exports = { ProjectsProvider, ProjectTreeItem, ProjectDeviceTreeItem };
