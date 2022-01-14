const vscode = require('vscode');
const { createProjectsStore } = require('./stores/projects');
const { ProjectsProvider } = require('./views/projects/Explorer');



class PyMakr {
    constructor() {
        this.projectStore = createProjectsStore()
        this.projectStore.refresh()

        console.log('get', this.projectStore.get())
        this.projectStore.subscribe(value => {
            console.log('value', value)
        })

        const projectsProvider = new ProjectsProvider(this)
        // vscode.window.registerTerminalLinkProvider()
        // vscode.window.registerTerminalProfileProvider()
        vscode.window.registerTreeDataProvider('pymakr-explorer', projectsProvider)
    }
}

module.exports = { PyMakr }