const { workspace } = require("vscode");
const { Project } = require("../Project");
const { writable } = require("../utils/store");

/**
 * @param {PyMakr} pyMakr 
 */
const getProjects = async (pyMakr) => {
  const configFiles = await workspace.findFiles("**/pymakr.conf");
  return configFiles.map((configFile) => new Project(configFile, pyMakr));
};

/**
 * @param {PyMakr} pyMakr
 */
const createProjectsStore = (pyMakr) => {
  /** @type {Writable<Project[]>} */
  const store = writable([]);
  const refresh = async () => store.set(await getProjects(pyMakr));

  const watcher = workspace.createFileSystemWatcher("**/pymakr.conf");

  const disposables = [
    watcher.onDidChange(refresh),
    watcher.onDidCreate(refresh),
    watcher.onDidDelete(refresh),
    workspace.onDidChangeWorkspaceFolders(refresh),
  ];

  pyMakr.context.subscriptions.push(...disposables)

  refresh()
  return { ...store, refresh };
};

module.exports = { createProjectsStore };
