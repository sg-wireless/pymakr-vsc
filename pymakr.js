var vscode = require('vscode');
var { execSync } = require('child_process');
const { prepareSerialPort } = require('./lib/serialport')
var PanelView, Pymakr, Pyboard, SettingsWrapper, pb, v, sw, pymakr

/**
 * same as vscode.commands.registerCommand but automatically pushes disposables to context subscriptions     
 * @param {vscode.ExtensionContext} context 
 * @param {Object.<string, (...args: any[]) => any>} commands
 */
const pushCommands = (context, commands) => {
    Object.entries(commands).forEach(([command, callback]) => {
        const disposable = vscode.commands.registerCommand(command, callback)
        context.subscriptions.push(disposable)
    })
}

async function activate(context) {
    await prepareSerialPort()
    SettingsWrapper = require('./lib/main/settings-wrapper');

    sw = new SettingsWrapper(function () {
        const nodejs_installed = execSync('node -v', { encoding: 'utf8' }).substr(0, 1) === "v"

        if (!nodejs_installed) {
            vscode.window.showErrorMessage("NodeJS not detected on this machine, which is required for Pymakr to work. See the Pymakr readme for dependencies.")
        } else {


            PanelView = require('./lib/main/panel-view');
            Pymakr = require('./lib/pymakr');
            Pyboard = require('./lib/board/pyboard');


            pushCommands(context, {
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



function deactivate() {
    v.destroy()
}


module.exports = {
    activate,
    deactivate
}

