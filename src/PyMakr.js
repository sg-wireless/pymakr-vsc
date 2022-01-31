const { createLogger } = require("consolite");
const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./views/devices/Explorer");
const { ProjectsProvider } = require("./views/projects/Explorer");

class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.context = context;
    this.log = createLogger("PyMakr");
    this.projectStore = createProjectsStore(this);
    this.devicesStore = createDevicesStore(this);
    this.terminalsStore = createTerminalsStore(this);
    this.commands = new Commands(this).commands;

    const projectsProvider = new ProjectsProvider(this);
    const devicesProvider = new DevicesProvider(this);

    // vscode.window.registerTerminalLinkProvider()
    // vscode.window.registerTerminalProfileProvider()
    vscode.window.registerTreeDataProvider("pymakr-projects-tree", projectsProvider);
    vscode.window.registerTreeDataProvider("pymakr-devices-tree", devicesProvider);
  }
}

module.exports = { PyMakr };
