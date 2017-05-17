// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var view = require('./lib/view').default;
var pyboard = require('./lib/board/pyboard').default;

var terminalActive = true
var window = null

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    window = vscode.window.createTerminal({name: "Pycom Console"} )
    console.log('Congratulations, your extension "test" is now active!');
    var pb = new pyboard(15000)
    var v = new view("",pb)
    v.addPanel()

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.toggleREPL', function () {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        if (terminalActive){
            window.hide()
            terminalActive = false
        }else{
            // window.show()
            // window.sendText("Test!")
            
            // outputChannel.append('Visual Studio Code is awesome!');
            terminalActive = true;
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;