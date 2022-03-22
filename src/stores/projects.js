const { workspace } = require("vscode");
const { Project } = require("../Project");
const { writable } = require("../utils/store");

/**
 * @param {PyMakr} pymakr
 */
const getProjects = async (pymakr) => {
  const configFiles = await workspace.findFiles("**/pymakr.conf");
  return configFiles.map((configFile) => new Project(configFile, pymakr));
};

/**
 * @param {PyMakr} pymakr
 */
const createProjectsStore = (pymakr) => {
  /** @type {Writable<Project[]>} */
  const store = writable([]);
  const refresh = async () => {
    pymakr.log.debug("Refreshing projects store...");
    store.set(await getProjects(pymakr));
    pymakr.log.debug("Refreshing projects store. Complete!");
  };

  const watcher = workspace.createFileSystemWatcher("**/pymakr.conf");
  // Vscode doesn't detect when nested a pymaker.conf is deleted,
  // so we trigger a refresh on every file/folder deletion
  // if ever needed, we can throttle the function
  const watchAll = workspace.createFileSystemWatcher("**");

  const disposables = [
    watcher.onDidChange(refresh),
    watcher.onDidCreate(refresh),
    watchAll.onDidDelete(refresh),
    workspace.onDidChangeWorkspaceFolders(refresh),
  ];

  pymakr.context.subscriptions.push(...disposables);

  return { ...store, refresh };
};

module.exports = { createProjectsStore };
