const { readFileSync } = require("fs");
const { dirname, basename } = require("path");

class Project {
  /**
   * @param {import('vscode').Uri} configFile
   * @param {PyMakr} pymakr
   **/
  constructor(configFile, pymakr) {
    this.configFile = configFile;
    this.folder = dirname(configFile.fsPath);
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
    if (storedProject) {
      this.log.debug("recover", storedProject);
      this.devices = devices.filter((_device) => storedProject.devices.includes(_device.id));
    }
  }

  /**
   * @param {import('./Device').Device} device
   */
  addDevice(device) {
    this.devices.push(device);
    this.pymakr.projectsProvider.refresh();
    this.saveToWorkspaceState();
  }

  /**
   * @param {import('./Device').Device} device
   */
  removeDevice(device) {
    this.devices = this.devices.filter((_device) => _device !== device);
    this.pymakr.projectsProvider.refresh();
    this.saveToWorkspaceState();
  }

  saveToWorkspaceState() {
    const { workspaceState } = this.pymakr.context;
    const projects = workspaceState.get("pycom.projects") || {};
    projects[this.folder] = projects[this.folder] || {};
    projects[this.folder].devices = this.devices.map((d) => d.id);
    workspaceState.update("pycom.projects", projects);
  }
}

module.exports = { Project };
