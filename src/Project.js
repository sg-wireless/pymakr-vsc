const { readFileSync } = require("fs");
const { dirname, basename } = require("path");
const vscode = require("vscode");
const { createStateObject } = require("./utils/storageObj");
const { Watcher } = require("./Watcher/Watcher");

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
    this.watcher = new Watcher(this);

    this.deviceIds = createStateObject(pymakr.context.globalState, `project.${this.folder}`, []);
    this.name = this.config.name || basename(this.folder);
    this.log = pymakr.log.createChild("project: " + this.name);
  }

  get config() {
    try {
      return JSON.parse(readFileSync(this.configFile.fsPath, "utf-8"));
    } catch (err) {
      this.err = `Could not parse config: ${this.configFile.fsPath}`;
      this.pymakr.log.error("could not parse config:", this.configFile.fsPath);
      this.pymakr.notifier.notifications.couldNotParsePymakrConfig(this);
    }
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
