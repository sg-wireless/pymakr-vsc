const { readFileSync } = require("fs");
const { dirname, basename } = require("path");

class Project {
  /** @param {import('vscode').Uri} configFile */
  constructor(configFile) {
    this.configFile = configFile;
    this.folder = dirname(configFile.path);
    this.config = JSON.parse(readFileSync(configFile.fsPath, "utf-8"));
    this.name = this.config.name || basename(this.folder);
  }
}

module.exports = { Project };
