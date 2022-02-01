const { createLogger } = require("consolite");
const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore, createActiveProjectStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./views/devices/Explorer");
const { ProjectsProvider } = require("./views/projects/Explorer");
const serialport = require("serialport");

/**
 *
 * @param {serialport.PortInfo & {friendlyName: string}} raw
 * @returns {DeviceInput}
 */
const rawSerialToDeviceInput = (raw) => ({ address: raw.path, name: raw.friendlyName, protocol: "serial", raw });

class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.context = context;
    this.log = createLogger("PyMakr");
    this.log.level = 5;
    this.projectsStore = createProjectsStore(this);
    this.activeProjectStore = createActiveProjectStore(this);
    this.devicesStore = createDevicesStore(this);
    this.terminalsStore = createTerminalsStore(this);
    this.commands = new Commands(this).commands;

    const projectsProvider = new ProjectsProvider(this);
    const devicesProvider = new DevicesProvider(this);

    vscode.window.registerTreeDataProvider("pymakr-projects-tree", projectsProvider);
    vscode.window.registerTreeDataProvider("pymakr-devices-tree", devicesProvider);

    this.registerUSBDevices();
    this.registerProjects();
    this.decorateStatusBar();
  }
  
  decorateStatusBar() {    
    const projectSelect = vscode.window.createStatusBarItem("activeWorkspace", 1, 10);
    projectSelect.command = "pymakr.setActiveProject";
    projectSelect.show();
    
    const projectUpload = vscode.window.createStatusBarItem("projectUpload", 1, 9);
    projectUpload.text = "$(arrow-up)";
    projectUpload.command = "pymakr.uploadProject";
    projectUpload.show();
    
    const projectDownload = vscode.window.createStatusBarItem("projectDownload", 1, 8);
    projectDownload.text = "$(arrow-down)";
    projectDownload.command = "pymakr.downloadProject";
    projectDownload.show();
    
    this.activeProjectStore.subscribe((project) => (projectSelect.text = project.name));
  }

  async registerProjects() {
    await this.projectsStore.refresh();
    await this.activeProjectStore.setToLastUsedOrFirstFound();

    this.log.debug("active project", this.activeProjectStore.get().folder);
  }

  async registerUSBDevices() {
    const rawSerials = await serialport.list();
    this.devicesStore.insert(rawSerials.map(rawSerialToDeviceInput));
  }
}

module.exports = { PyMakr };
