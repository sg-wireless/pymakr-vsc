var vscode = require('vscode');
var view = require('./lib/pymakr-view').default;
var pyboard = require('./lib/board/pyboard').default;
var SettingsWrapper = require('./lib/settings-wrapper').default;

function activate(context) {

    var terminal = vscode.window.createTerminal({name: "Pycom Console", shellPath: "/Users/Ralph/github/test/test/terminalExec.js"} )
    terminal.show()


    var terminalActive = true

    var sw = new SettingsWrapper()
    var pb,v

    pb = new pyboard(sw)
    v = new view("",pb,sw)
    v.addPanel()
    

    var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
        v.connect()
    })
    context.subscriptions.push(disposable);

    var disposable = vscode.commands.registerCommand('pymakr.command', function () {
        vscode.window.showInputBox({prompt: 'Type your command'})
            .then(function(val){
                if(val){
                    pb.send_user_input(val+"\r\n",function(err){
                        if(err && err.message == 'timeout'){
                            _this.disconnect()
                        }
                    })
                    vscode.commands.executeCommand("pycom.command")
                }
            }
        );
    })
    context.subscriptions.push(disposable);

    var disposable = vscode.commands.registerCommand('pymakr.run', function () {
        console.log("Running")
        v.run()
    })
    context.subscriptions.push(disposable);

    var disposable = vscode.commands.registerCommand('pymakr.sync', function () {
        console.log("Syncing")
        v.sync()
    })
    context.subscriptions.push(disposable);

    var disposable = vscode.commands.registerCommand('pymakr.globalSettings', function () {
        console.log("Global settings")
        v.openGlobalSettings()
    })
    context.subscriptions.push(disposable);


    var disposable = vscode.commands.registerCommand('pymakr.projectSettings', function () {
        console.log("Settings")
        v.openProjectSettings()
    })
    context.subscriptions.push(disposable);


    var disposable = vscode.commands.registerCommand('pymakr.toggleREPL', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        if (terminalActive){
            terminalActive = false
            terminal.hide()
            v.disconnect()
        }else{
            terminalActive = true;
            terminal.show()
            v.connect()
            
        }
    });
    context.subscriptions.push(disposable);

    // var disposable = vscode.window.onDidClose(function(){
    //     terminalActive = false
    //     v.disconnect()
    // })
    // context.subscriptions.push(disposable);
}


exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate