const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore, createActiveProjectStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./providers/DevicesProvider");
const { ProjectsProvider } = require("./providers/ProjectsProvider");
const { SerialPort } = require("serialport");
const { Server } = require("./terminal/Server");
const { resolve } = require("path");
const { FileSystemProvider } = require("./providers/filesystemProvider");
const { createLogger } = require("./utils/createLogger");

/**
 *
 * @param {import("@serialport/bindings-cpp").PortInfo & {friendlyName: string}} raw
 * @returns {DeviceInput}
 */
const rawSerialToDeviceInput = (raw) => ({ address: raw.path, name: raw.friendlyName, protocol: "serial", raw });

class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.log = createLogger("PyMakr");
    this.updateConfig("silent");
    this.context = context;

    this.projectsStore = createProjectsStore(this);
    this.activeProjectStore = createActiveProjectStore(this);
    this.devicesStore = createDevicesStore(this);
    this.terminalsStore = createTerminalsStore(this);
    this.commands = new Commands(this).commands;
    this.server = new Server(this);

    this.projectsProvider = new ProjectsProvider(this);
    this.devicesProvider = new DevicesProvider(this);
    this.fileSystem = new FileSystemProvider(this);
    vscode.workspace.registerFileSystemProvider("serial", this.fileSystem, { isCaseSensitive: true });
    vscode.workspace.registerFileSystemProvider("telnet", this.fileSystem, { isCaseSensitive: true });
    vscode.window.registerTreeDataProvider("pymakr-projects-tree", this.projectsProvider);
    vscode.window.registerTreeDataProvider("pymakr-devices-tree", this.devicesProvider);
    vscode.workspace.onDidChangeConfiguration(this.updateConfig.bind(this));

    this.setup();
  }

  updateConfig(mode) {
    const config = vscode.workspace.getConfiguration("pymakr");
    this.log.level = this.log.levels[config.logLevel];
    this.log.filter = config.logFilter !== "" ? new RegExp(config.logFilter) : '';
    if (mode !== "silent") this.log.info("updated config:", config);
  }

  async setup() {
    await Promise.all([this.registerUSBDevices(), this.registerProjects()]);
    await this.recoverProjects();
    this.projectsProvider.refresh();
    this.decorateStatusBar();
    this.createTerminalProvider();
  }

  async recoverProjects() {
    return Promise.all(this.projectsStore.get().map((project) => project.recoverProject()));
  }

  decorateStatusBar() {
    const projectSelect = vscode.window.createStatusBarItem("activeWorkspace", 1, 10);
    projectSelect.text = this.activeProjectStore.get()?.name;
    projectSelect.command = "pymakr.setActiveProject";
    projectSelect.show();

    const projectUpload = vscode.window.createStatusBarItem("projectUpload", 1, 9);
    projectUpload.text = "$(cloud-upload)";
    projectUpload.command = "pymakr.uploadProject";
    projectUpload.show();

    const projectDownload = vscode.window.createStatusBarItem("projectDownload", 1, 8);
    projectDownload.text = "$(cloud-download)";
    projectDownload.command = "pymakr.downloadProject";
    projectDownload.show();

    this.activeProjectStore.subscribe((project) => (projectSelect.text = project.name));
  }

  createTerminalProvider() {
    vscode.window.registerTerminalProfileProvider("pymakr.terminal-profile", {
      provideTerminalProfile: () => ({
        options: { shellPath: "node", shellArgs: [resolve(__dirname, "terminal/client.js")], name: "PyMakr" },
      }),
    });
  }

  async registerProjects() {
    await this.projectsStore.refresh();
    await this.activeProjectStore.setToLastUsedOrFirstFound();
    this.log.debug("active project", this.activeProjectStore.get().folder);
  }

  async registerUSBDevices() {
    const rawSerials = await SerialPort.list();
    this.devicesStore.upsert(rawSerials.map(rawSerialToDeviceInput));
  }
}

module.exports = { PyMakr };
