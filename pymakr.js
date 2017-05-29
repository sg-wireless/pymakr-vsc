var vscode = require('vscode');
var view = require('./lib/pymakr-view').default;
var pyboard = require('./lib/board/pyboard').default;
var SettingsWrapper = require('./lib/settings-wrapper').default;

function activate(context) {

    var terminal = vscode.window.createTerminal({name: "Pycom Console", shellPath: "/Users/Ralph/github/test/test/terminalExec.js"} )
    terminal.show()

    var terminalActive = true

    var sw = new SettingsWrapper()

    setTimeout(function(){
        var pb = new pyboard(sw)
        var v = new view("",pb)
        v.addPanel()
    },500)
    

    var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
        v.connect()
    })

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


    var disposable = vscode.commands.registerCommand('pymakr.run', function () {
        console.log("Running")
        v.run()
    })

    var disposable = vscode.commands.registerCommand('pymakr.sync', function () {
        console.log("Syncing")
        v.sync()
    })

    var disposable = vscode.commands.registerCommand('pymakr.toggleREPL', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        if (terminalActive){
            // window.hide()
            v.hidePanel()
            terminalActive = false
        }else{
            v.showPanel()
            // outputChannel.append('Visual Studio Code is awesome!');
            terminalActive = true;
        }
    });
    context.subscriptions.push(disposable);
}


exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate