const vscode = require("vscode");
const { Commands } = require("./commands");
const { createDevicesStore } = require("./stores/devices");
const { createProjectsStore } = require("./stores/projects");
const { createTerminalsStore } = require("./stores/terminals");
const { DevicesProvider } = require("./providers/DevicesProvider");
const { ProjectsProvider } = require("./providers/ProjectsProvider");
const { Server } = require("./terminal/Server");
const { resolve } = require("path");
const { FileSystemProvider } = require("./providers/FilesystemProvider");
const { createLogger } = require("./utils/createLogger");
const { writable } = require("./utils/store");
const { coerceDisposable, createThrottledFunction } = require("./utils/misc");
const manifest = require("../package.json");
const { createVSCodeHelpers } = require("./utils/vscodeHelpers");
const { TextDocumentProvider } = require("./providers/TextDocumentProvider");
const { createStateObject } = require("./utils/storageObj");

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
    /**
     * @example
     * this.pendingActions.set([...actions, { target: ["vscode", "window", "showInformationMessage"], args: ["message"] }]) 
     * @type {import("./utils/storageObj").GetterSetter<{target: string[], args: any[]}[]>}
     * */
    this.pendingActions = createStateObject(context.workspaceState, "pendingActions", []);

    this.refreshProvidersThrottled = createThrottledFunction(this.refreshProviders.bind(this));

    /** Reactive Pymakr user configuration */
    this.config = writable(vscode.workspace.getConfiguration("pymakr"));

    /** VSCode specific helpers */
    this.vscodeHelpers = createVSCodeHelpers(this);

    /** Extendable logger. */
    this.log = createLogger("PyMakr");
    this.log.info(`${manifest.name} v${manifest.version}`);

    // avoid port collisions between multiple vscode instances running on the same machine
    this.terminalPort = 5364 + ((Math.random() * 10240) | 0);

    this.onUpdatedConfig("silent");
    this.context = context;

    /** The package.json manifest */
    this.manifest = manifest;

    /** Reactive store of projects */
    this.projectsStore = createProjectsStore(this);
    /** Reactive store of devices */
    this.devicesStore = createDevicesStore(this);
    /** Reactive store of open terminals */
    this.terminalsStore = createTerminalsStore(this);
    /** All commands provided to VSCode */
    this.commands = new Commands(this).commands;
    /** Terminal server. Handles all client connections. */
    this.server = new Server(this);
    /** Provides projects for the projects view */
    this.projectsProvider = new ProjectsProvider(this);
    /** Provides devices for the devices view */
    this.devicesProvider = new DevicesProvider(this);
    /** Provides device access for the file explorer */
    this.fileSystemProvider = new FileSystemProvider(this);

    this.textDocumentProvider = new TextDocumentProvider(this);

    this.config.subscribe(() => this.refreshProvidersThrottled());

    this.registerWithIde();
    this.setup();
    this.handlePendingActions();
  }

  handlePendingActions() {
    const pendingActions = this.pendingActions.get();
    this.pendingActions.set([]);

    pendingActions.forEach((action) => {
      const target = action.target.reduce((obj, prop) => obj[prop], { ...this, vscode });
      this.log.debugShort("pending action", target, action.args);
      target.call(target, ...action.args);
    });
  }

  /**
   * Registers listeners and providers with VSCode
   */
  registerWithIde() {
    const disposables = [
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("pymakr")) this.config.set(vscode.workspace.getConfiguration("pymakr"));
      }),
      vscode.workspace.registerFileSystemProvider("serial", this.fileSystemProvider, { isCaseSensitive: true }),
      // vscode.workspace.registerFileSystemProvider("telnet", this.fileSystemProvider, { isCaseSensitive: true }),
      vscode.window.registerTreeDataProvider("pymakr-projects-tree", this.projectsProvider),
      vscode.window.registerTreeDataProvider("pymakr-devices-tree", this.devicesProvider),
      vscode.workspace.registerTextDocumentContentProvider("pymakrDocument", this.textDocumentProvider),
      vscode.workspace.onDidChangeConfiguration(this.onUpdatedConfig.bind(this)),
      vscode.window.registerTerminalProfileProvider("pymakr.terminal-profile", {
        provideTerminalProfile: () => ({
          options: { shellPath: "node", shellArgs: [resolve(__dirname, "terminal/bin/client.js")], name: "PyMakr" },
        }),
      }),
    ];

    this.context.subscriptions.push(...disposables);
  }

  /**
   * Run / runs when config has changed.
   * @param {'silent'=} mode
   */
  onUpdatedConfig(mode) {
    this.log.level = this.log.levels[this.config.get().debug.logLevel];
    this.log.filter = this.config.get().debug.logFilter !== "" ? new RegExp(this.config.get().debug.logFilter) : "";
    if (mode !== "silent") this.log.info("updated config:", this.config.get());
  }

  /**
   * Registers usb devices and scans for projects in workspace
   */
  async setup() {
    await Promise.all([this.devicesStore.registerUSBDevices(), this.registerProjects()]);
    this.projectsProvider.refresh(); // tell the provider that projects were updated
    this.context.subscriptions.push(coerceDisposable(this.devicesStore.watchUSBDevices()));
  }

  /**
   * Scans workspace for projects and adds them to the projects store.
   */
  async registerProjects() {
    await this.projectsStore.refresh();
  }

  refreshProviders() {
    this.devicesProvider.refresh();
    this.projectsProvider.refresh();
  }
}

module.exports = { PyMakr };
