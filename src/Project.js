const { readFileSync } = require("fs");
const { dirname, basename } = require("path");

class Project {
  /**
   * @param {import('vscode').Uri} configFile
   * @param {PyMakr} pymakr
   **/
  constructor(configFile, pymakr) {
    this.configFile = configFile;
    this.folder = dirname(configFile.path);
    this.config = JSON.parse(readFileSync(configFile.fsPath, "utf-8"));
    this.name = this.config.name || basename(this.folder);
    this.pymakr = pymakr;
    this.log = pymakr.log.createChild("project: " + this.name);

    /** @type {import('./Device').Device[]} */
    this.devices = [];
  }

  recoverProject() {
    const storedProjects = this.pymakr.context.workspaceState.get("pycom.projects") || {};
    const devices = this.pymakr.devicesStore.get();
    const storedProject = storedProjects[this.folder];
    this.log.debug("recover", storedProject);
    if (storedProject) this.devices = devices.filter((_device) => storedProject.devices.includes(_device.id));
  }

  /**
   * @param {import('./Device').Device} device
   */
  addDevice(device) {
    const { workspaceState } = this.pymakr.context;
    this.devices.push(device);
    const projects = workspaceState.get("pycom.projects") || {};
    projects[this.folder] = projects[this.folder] || {};
    projects[this.folder].devices = projects[this.folder].devices || [];
    projects[this.folder].devices.push(device.id);
    workspaceState.update("pycom.projects", projects);
    this.pymakr.projectsProvider.refresh();
  }
}

module.exports = { Project };
