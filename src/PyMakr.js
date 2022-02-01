const { createLogger } = require("consolite");
const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./views/devices/Explorer");
const { ProjectsProvider } = require("./views/projects/Explorer");
const serialport = require("serialport");

const rawSerialToDeviceInput = (raw) => ({ address: raw.path, name: raw.friendlyName, protocol: "serial", raw });

class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.context = context;
    this.log = createLogger("PyMakr");
    this.log.level = 5
    this.projectStore = createProjectsStore(this);
    this.devicesStore = createDevicesStore(this);
    this.terminalsStore = createTerminalsStore(this);
    this.commands = new Commands(this).commands;

    const projectsProvider = new ProjectsProvider(this);
    const devicesProvider = new DevicesProvider(this);

    vscode.window.registerTreeDataProvider("pymakr-projects-tree", projectsProvider);
    vscode.window.registerTreeDataProvider("pymakr-devices-tree", devicesProvider);

    this.registerUSBDevices();
  }

  async registerUSBDevices() {
    const rawSerials = await serialport.list();
    this.devicesStore.insert(rawSerials.map(rawSerialToDeviceInput));
  }
}

module.exports = { PyMakr };
