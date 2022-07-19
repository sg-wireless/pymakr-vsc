const { workspace } = require("vscode");
const { Project } = require("../Project");
const { writable } = require("../utils/store");

/**
 * @param {import('../PyMakr').PyMakr} pymakr
 * @returns {(configFile: import('vscode').Uri)=>Project}
 */
const convertToProject = (pymakr) => (configFile) => new Project(configFile, pymakr);

/** @param {Project[]} projects */
const isNotIn = (projects) => (configFile) => !projects.find((p) => p.configFile.path === configFile.path);

/**
 * @param {Project} p1
 * @param {Project} p2
 */
const byName = (p1, p2) => (p1.name < p2.name ? 1 : p1.name > p2.name ? -1 : 0);

/**
 * @param {import('vscode').Uri[]} configFiles
 * @returns {(project:Project) => Boolean}
 */
const hasConfigFile = (configFiles) => (project) => configFiles.map((cf) => cf.path).includes(project.configFile.path);

/**
 * @param {import('vscode').Uri[]} configFiles
 * @returns {(project:Project) => Boolean}
 */
const hasNoConfigFile = (configFiles) => (project) =>
  !configFiles.map((cfg) => cfg.path).includes(project.configFile.path);

/** @param {Project} project */
const destroy = (project) => project.destroy();

/**
 * @param {PyMakr} pymakr
 */
const createProjectsStore = (pymakr) => {
  /** @type {Writable<Project[]>} */
  const store = writable([]);
  /** Rescan for projects in workspace. */
  const refresh = async () => {
    pymakr.log.debug("Refreshing projects store...");
    const configFiles = await workspace.findFiles("**/pymakr.conf");
    store.get().filter(hasNoConfigFile(configFiles)).forEach(destroy);
    store.update((oldProjects) =>
      [
        ...oldProjects.filter(hasConfigFile(configFiles)),
        ...configFiles.filter(isNotIn(oldProjects)).map(convertToProject(pymakr)),
      ].sort(byName)
    );
    store.get().forEach((p) => p.refresh());
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
