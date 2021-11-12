var vscode = require('vscode');
var { execSync } = require('child_process');
const { prepareSerialPort } = require('./lib/serialport')
var PanelView, Pymakr, Pyboard, SettingsWrapper, pb, v, sw, pymakr


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


            pb = new Pyboard(sw)
            v = new PanelView(pb, sw)
            pymakr = new Pymakr({}, pb, v, sw)


            var terminal = v.terminal

            var disposable = vscode.commands.registerCommand('pymakr.help', function () {
                terminal.show()
                pymakr.writeHelpText()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.listCommands', function () {
                v.showQuickPick()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
                terminal.show()
                pymakr.connect()
            })

            var disposable = vscode.commands.registerCommand('pymakr.run', function () {
                terminal.show()
                pymakr.run()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.runselection', function () {
                terminal.show()
                pymakr.runselection()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.upload', function () {
                terminal.show()
                pymakr.upload()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.uploadFile', function () {
                terminal.show()
                pymakr.uploadFile()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.download', function () {
                terminal.show()
                pymakr.download()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.globalSettings', function () {
                pymakr.openGlobalSettings()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.projectSettings', function () {
                pymakr.openProjectSettings()
            })
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.disconnect', function () {
                pymakr.disconnect()
            });
            context.subscriptions.push(disposable);

            // // not used. open/close terminal command is already available. 
            // // not used. open/close terminal command is already available. 
            // // not used. open/close terminal command is already available. 
            // // Terminal opens automatically when doing a connect, run or sync action.
            // var disposable = vscode.commands.registerCommand('pymakr.toggleREPL', function () {
            //     pymakr.toggleVisibility()
            // });
            // context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.toggleConnect', function () {
                if (!pymakr.pyboard.connected) {
                    terminal.show()
                }
                pymakr.toggleConnect()
            });
            context.subscriptions.push(disposable);


            var disposable = vscode.commands.registerCommand('pymakr.extra.getVersion', function () {
                terminal.show()
                pymakr.getVersion()
            });
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.extra.getWifiMac', function () {
                terminal.show()
                pymakr.getWifiMac()
            });
            context.subscriptions.push(disposable);

            var disposable = vscode.commands.registerCommand('pymakr.extra.getSerial', function () {
                terminal.show()
                pymakr.getSerial()
            });
            context.subscriptions.push(disposable);

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

