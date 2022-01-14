const { workspace } = require("vscode");
const { Project } = require("../Project");
const { writable } = require("../utils/store");

const getProjects = async () => {
  const configFiles = await workspace.findFiles("**/pymakr.conf");
  return configFiles.map((configFile) => new Project(configFile));
};

const createProjectsStore = () => {
  /** @type {Writable<Project[]>} */
  const store = writable([]);
  const refresh = async () => store.set(await getProjects());

  const watcher = workspace.createFileSystemWatcher("**/pymakr.conf");

  const disposables = [
    watcher.onDidChange(refresh),
    watcher.onDidCreate(refresh),
    watcher.onDidDelete(refresh),
    workspace.onDidChangeWorkspaceFolders(refresh),
  ];

  return { ...store, refresh };
};

module.exports = { createProjectsStore };
