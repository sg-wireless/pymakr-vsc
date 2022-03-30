const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./providers/DevicesProvider");
const { ProjectsProvider } = require("./providers/ProjectsProvider");
const { Server } = require("./terminal/Server");
const { resolve } = require("path");
const { FileSystemProvider } = require("./providers/filesystemProvider");
const { createLogger } = require("./utils/createLogger");
const { StatusBar } = require("./StatusBar");
const { writable } = require("./utils/store");
const { coerceDisposable } = require("./utils/misc");
const manifest = require("../package.json");
const { createVSCodeHelpers } = require("./utils/vscodeHelpers");

/**
 * Pymakr is the root class and scope of the extension.
 * All classes can access each other through this class.
 * @example to access a vscodeHelper from providers/DevicesProvider.js
 * ```javascript
 * this.pymakr.vscodeHelpers.someHelper()
 * ```
 */
class PyMakr {
  /**
   * @param {vscode.ExtensionContext} context
   */
  constructor(context) {
    this.config = writable(vscode.workspace.getConfiguration("pymakr"));
    this.vscodeHelpers = createVSCodeHelpers(this);

    this.log = createLogger("PyMakr");
    this.updateConfig("silent");
    this.context = context;
    this.manifest = manifest;

    this.projectsStore = createProjectsStore(this);
    this.devicesStore = createDevicesStore(this);
    this.terminalsStore = createTerminalsStore(this);
    this.commands = new Commands(this).commands;
    this.server = new Server(this);

    this.projectsProvider = new ProjectsProvider(this);
    this.devicesProvider = new DevicesProvider(this);
    this.fileSystemProvider = new FileSystemProvider(this);

    this.registerWithIde();
    this.setup();
  }

  registerWithIde() {
    const disposables = [
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("pymakr")) this.config.set(vscode.workspace.getConfiguration("pymakr"));
      }),
      vscode.workspace.registerFileSystemProvider("serial", this.fileSystemProvider, { isCaseSensitive: true }),
      vscode.workspace.registerFileSystemProvider("telnet", this.fileSystemProvider, { isCaseSensitive: true }),
      vscode.window.registerTreeDataProvider("pymakr-projects-tree", this.projectsProvider),
      vscode.window.registerTreeDataProvider("pymakr-devices-tree", this.devicesProvider),
      vscode.workspace.onDidChangeConfiguration(this.updateConfig.bind(this)),
      vscode.window.registerTerminalProfileProvider("pymakr.terminal-profile", {
        provideTerminalProfile: () => ({
          options: { shellPath: "node", shellArgs: [resolve(__dirname, "terminal/client.js")], name: "PyMakr" },
        }),
      }),
    ];

    this.context.subscriptions.push(...disposables);
  }

  updateConfig(mode) {
    this.log.level = this.log.levels[this.config.get().debug.logLevel];
    this.log.filter = this.config.get().logFilter !== "" ? new RegExp(this.config.get().debug.logFilter) : "";
    if (mode !== "silent") this.log.info("updated config:", this.config.get());
  }

  async setup() {
    await Promise.all([this.devicesStore.registerUSBDevices(), this.registerProjects()]);
    await this.recoverProjects();
    this.projectsProvider.refresh();
    this.context.subscriptions.push(coerceDisposable(this.devicesStore.watchUSBDevices()));
  }

  async recoverProjects() {
    return Promise.all(this.projectsStore.get().map((project) => project.recoverProject()));
  }

  async registerProjects() {
    await this.projectsStore.refresh();
  }
}

module.exports = { PyMakr };
