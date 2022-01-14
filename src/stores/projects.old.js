const { readdirSync } = require("fs");
const vscode = require("vscode");
const { writable, derived, chainDerived } = require("../utils/store");

// @ts-ignore we only have type definitions for default
const CheapWatch = /** @type {typeof import('cheap-watch').default}} */ (require("cheap-watch"));

/**
 *
 * @param {string} path
 */
const getProjects = (path) => {
  return readdirSync(path);
};

console.log("folder", vscode.workspace.workspaceFolders);




const createWorkspacesStore = () => {
  let handle;
  return writable(vscode.workspace.workspaceFolders || [], {
    onFirstSub: (_store) => {
      vscode.workspace.workspaceFolders || [];
      handle = vscode.workspace.onDidChangeWorkspaceFolders(() => _store.set(vscode.workspace.workspaceFolders || []));
    },
    onLastUnsub: () => handle.dispose(),
  });
};
const workspacesStore = createWorkspacesStore();
console.log("wss", workspacesStore.get());

const createProjectsStore = () => {
  const workspacesWithProjectStoresStore = derived([workspacesStore], ([workspaces]) =>
    workspaces.map((workspace) => {
      const dir = workspace.uri.fsPath;
      const cheapWatch = new CheapWatch({ dir });
      const { get, subscribe, set } = writable(getProjects(dir), {
        onFirstSub: () => cheapWatch.init(),
        onLastUnsub: () => cheapWatch.close(),
      });
      cheapWatch.on("+", () => set(getProjects(dir)));
      cheapWatch.on("-", () => set(getProjects(dir)));
      return { get, subscribe, cheapWatch, wtf: "wtf" };
    })
  );

  const projectsStore = chainDerived([workspacesWithProjectStoresStore], ([projectsPerWorkspaceStores]) => {
    const _projectsStores = derived(projectsPerWorkspaceStores, (projectsPerWorkspace) => {
      return projectsPerWorkspace.flat();
    });
    console.log("_projectsStores", _projectsStores.get());
    return _projectsStores;
  });
  
  console.log("123", projectsStore.get()[0]);
  return projectsStore;
};

const createWorkspaceProjectStore = (dirs) => {};

// const createProjectsStore = () => {
//     const fileWatchers = []

//     const workspacesStore = createWorkspacesStore()
//     const projectsStore = Store([], {
//         onFirstSub: (_store) => {
//             _store =
//         },
//         onLastUnsub: (_store) => {

//         }
//     })

//     const updateStore = (workspaceFolders) => {
//         fileWatchers.forEach(fw => fw.close())
//         const allWorkspaceProjects = []
//         workspaceFolders.map((workspaceFolder) => {
//             const dir = workspaceFolder.uri.fsPath
//             const cheapWatch = new CheapWatch({ dir })
//             cheapWatch.init()
//             fileWatchers.push(cheapWatch)

//             const workspaceProjects = []

//             function updateProjects() {
//                 console.log('update projects')
//                 const projects = findProjects(dir)
//                 workspaceProjects.splice(0, workspaceProjects.length, ...projects)
//                 projectsStore.set(allWorkspaceProjects)
//             }
//             console.log('oot')

//             // initial
//             setTimeout(updateProjects)

//             // watch
//             cheapWatch.on('+', updateProjects)
//             cheapWatch.on('-', updateProjects)

//             return workspaceProjects
//         })
//     }

//     // set store values
//     updateStore(workspacesStore.get())

//     // update store values when workspaces change
//     const workspacesUnsub = workspacesStore.subscribe(updateStore)

//     const { subscribe } = projectsStore
//     projectsStore.subscribe = (listener) => {
//         // proxy subscription
//         const unsub = subscribe(listener)
//         // return new unsubscription
//         return () => {
//             workspacesUnsub()
//             unsub()
//             fileWatchers.forEach(fw => fw.close())
//         }
//     }
//     return projectsStore
// }

module.exports = { createProjectsStore };
