const { readFileSync } = require("fs");
const { dirname, basename } = require("path");
const vscode = require("vscode");
const { StateManager } = require("./utils/stateManager");

class Project {
  /**
   * @param {import('vscode').Uri} configFile
   * @param {PyMakr} pymakr
   **/
  constructor(configFile, pymakr) {
    this.pymakr = pymakr;
    this.configFile = configFile;
    this.folder = dirname(configFile.fsPath);
    this.config = {};
    try {
      this.config = JSON.parse(readFileSync(configFile.fsPath, "utf-8"));
    } catch (err) {
      this.err = `Could not parse config: ${configFile.fsPath}`;
      this.pymakr.log.error("could not parse config:", configFile.fsPath);
      vscode.window.showErrorMessage(this.err);
    }

    this.state = this.createState();
    this.name = this.config.name || basename(this.folder);
    this.log = pymakr.log.createChild("project: " + this.name);

    /** @type {import('./Device').Device[]} */
    this.devices = [];
    this.recoverProject();
  }

  recoverProject() {
    const deviceIds = this.state.load().devices || [];
    this.devices = this.pymakr.devicesStore.getAllById(deviceIds);
  }

  createState() {
    const getState = () => ({ devices: this.devices.map((device) => device.id) });
    return new StateManager(this.pymakr, `projects.${this.folder}`, getState);
  }

  /**
   * @param {import('./Device').Device} device
   */
  addDevice(device) {
    this.devices.push(device);
    this.pymakr.projectsProvider.refresh();
    this.state.save();
  }

  /**
   * @param {import('./Device').Device} device
   */
  removeDevice(device) {
    this.devices = this.devices.filter((_device) => _device !== device);
    this.pymakr.projectsProvider.refresh();
    this.state.save();
  }
}

module.exports = { Project };
