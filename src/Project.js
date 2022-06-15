const { readFileSync } = require("fs");
const { dirname, basename } = require("path");
const vscode = require("vscode");
const { createStateObject } = require("./utils/storageObj");

class Project {
  /**
   * A project is any folder that contains a `pymakr.conf` file.
   * @param {import('vscode').Uri} configFile pymakr.conf location
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
    this.deviceIds = createStateObject(pymakr.context.globalState, `project.${this.folder}`, []);
    this.name = this.config.name || basename(this.folder);
    this.log = pymakr.log.createChild("project: " + this.name);
  }

  get devices() {
    return this.pymakr.devicesStore.getAllById(this.deviceIds.get());
  }

  /**
   * Attaches devices to project
   * @param {import('./Device').Device[]} devices
   */
  setDevices(devices) {
    const deviceIds = devices.map(({ id }) => id);
    this.deviceIds.set(deviceIds);
    this.pymakr.projectsProvider.refresh();
  }
}

module.exports = { Project };
