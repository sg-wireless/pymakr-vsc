var vscode = require('vscode');

function activate(context) {

    var terminal = vscode.window.createTerminal({name: "Pycom Console", shellPath: "/Users/Ralph/github/test/test/terminalExec.js"} )
    terminal.show()
}

exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;