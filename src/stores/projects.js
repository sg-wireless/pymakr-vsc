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
  const refresh = async () => store.set(await getProjects(pymakr));

  const watcher = workspace.createFileSystemWatcher("**/pymakr.conf");

  const disposables = [
    watcher.onDidChange(refresh),
    watcher.onDidCreate(refresh),
    watcher.onDidDelete(refresh),
    workspace.onDidChangeWorkspaceFolders(refresh),
  ];

  pymakr.context.subscriptions.push(...disposables);

  return { ...store, refresh };
};

/**
 * @param {PyMakr} pymakr
 */
const createActiveProjectStore = (pymakr) => {
  /** @type {Writable<Project>} */
  const store = writable(null);

  /** @param {Project} value */
  const set = (value) => {
    pymakr.context.workspaceState.update("activeProject", value.folder);
    store.set(value);
  };

  /**
   * Recovers the active project from the workspace state
   * If no project is found, the first available project is chosen
   */
  const setToLastUsedOrFirstFound = () => {
    const folder = pymakr.context.workspaceState.get("activeProject");
    const projects = pymakr.projectsStore.get();
    const project = projects.find((_project) => _project.folder === folder) || projects[0];
    set(project);
  };
  return {
    ...store,
    set,
    setToLastUsedOrFirstFound
  };
};

module.exports = { createProjectsStore, createActiveProjectStore };
