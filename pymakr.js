const vscode = require('vscode');
const { execSync } = require('child_process');
const destroyHandles = []

/**
 * same as vscode.commands.registerCommand but automatically pushes disposables to context subscriptions     
 * @param {vscode.ExtensionContext} context 
 * @param {Object.<string, (...args: any[]) => any>} commands
 */
const batchRegisterCommands = (context, commands) => {
    Object.entries(commands).forEach(([command, callback]) => {
        const disposable = vscode.commands.registerCommand(command, callback)
        context.subscriptions.push(disposable)
    })
}

/**
 * this method activates the extension
 * @param {vscode.ExtensionContext} context 
 */
async function activate(context) {

    /**
     * we have to import SettingsWrapper after prepareSerialPort
     * since SettingsWrapper imports serialport
     */
    const SettingsWrapper = require('./lib/main/settings-wrapper');

    const settingsWrapper = new SettingsWrapper(function () {
        const nodejs_installed = execSync('node -v', { encoding: 'utf8' }).substr(0, 1) === "v"

        if (!nodejs_installed) {
            vscode.window.showErrorMessage("NodeJS not detected on this machine, which is required for Pymakr to work. See the Pymakr readme for dependencies.")
        } else {
            const PanelView = require('./lib/main/panel-view');
            const Pymakr = require('./lib/pymakr');
            const Pyboard = require('./lib/board/pyboard');


            const pyboard = new Pyboard(settingsWrapper)
            const panelView = new PanelView(pyboard, settingsWrapper)
            const pymakr = new Pymakr({}, pyboard, panelView, settingsWrapper)
            const { terminal } = panelView

            destroyHandles.push(() => panelView.destroy())

            batchRegisterCommands(context, {
                'pymakr.help': () => {
                    terminal.show()
                    pymakr.writeHelpText()
                },
                'pymakr.listCommands': () => {
                    panelView.showQuickPick()
                },
                'pymakr.connect': () => {
                    terminal.show()
                    pymakr.connect()
                },
                'pymakr.run': () => {
                    terminal.show()
                    pymakr.run()
                },
                'pymakr.runselection': () => {
                    terminal.show()
                    pymakr.runselection()
                },
                'pymakr.upload': () => {
                    terminal.show()
                    pymakr.upload()
                },
                'pymakr.uploadFile': () => {
                    terminal.show()
                    pymakr.uploadFile()
                },
                'pymakr.download': () => {
                    terminal.show()
                    pymakr.download()
                },
                'pymakr.globalSettings': () => {
                    pymakr.openGlobalSettings()
                },
                'pymakr.projectSettings': () => {
                    pymakr.openProjectSettings()
                },
                'pymakr.disconnect': () => {
                    pymakr.disconnect()
                },
                'pymakr.toggleConnect': () => {
                    if (!pymakr.pyboard.connected)
                        terminal.show()
                    pymakr.toggleConnect()
                },
                'pymakr.extra.getVersion': () => {
                    terminal.show()
                    pymakr.getVersion()
                },
                'pymakr.extra.getWifiMac': () => {
                    terminal.show()
                    pymakr.getWifiMac()
                },
                'pymakr.extra.getSerial': () => {
                    terminal.show()
                    pymakr.getSerial()
                }
            })

        }

    })
}

module.exports = {
    activate,
    deactivate: () => destroyHandles.map(destroy => destroy())
}

