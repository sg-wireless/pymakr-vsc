const vscode = require("vscode");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore } = require("./stores/projects");
const { DevicesProvider } = require("./views/devices/Explorer");
const { ProjectsProvider } = require("./views/projects/Explorer");

class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.context = context;
    this.projectStore = createProjectsStore(this);
    this.devicesStore = createDevicesStore(this);

    const projectsProvider = new ProjectsProvider(this);
    const devicesProvider = new DevicesProvider(this);

    // vscode.window.registerTerminalLinkProvider()
    // vscode.window.registerTerminalProfileProvider()
    vscode.window.registerTreeDataProvider("pymakr-projects-tree", projectsProvider);
    vscode.window.registerTreeDataProvider("pymakr-devices-tree", devicesProvider);
  }
}

module.exports = { PyMakr };
