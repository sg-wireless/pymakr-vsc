#!/usr/bin/env node

// var vscode = require('vscode');
// var view = require('./lib/pymakr-view').default;
// var pyboard = require('./lib/board/pyboard').default;
// var SettingsWrapper = require('./lib/settings-wrapper').default;

// var terminalActive = true
// var window = null

// var sw = new SettingsWrapper()
// var pb = new pyboard(sw)
// var v = new view("",pb)
// v.addPanel()

console.log(">>> ")

var readline = require('readline'),
    stdin = process.openStdin();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

stdin.addListener("data", function(text) {
//   v.userInput(text)
  console.log(text.toString())
})



// // console.log('Congratulations, your extension "test" is now active!');
// // var sw = new SettingsWrapper()
// // var pb = new pyboard(sw)
// // var v = new view("",pb)
// // v.addPanel()

// var disposable = vscode.commands.registerCommand('pymakr.connect', function () {
//     v.connect()
// })

// var disposable = vscode.commands.registerCommand('pymakr.command', function () {
//     vscode.window.showInputBox({prompt: 'Type your command'})
//         .then(function(val){
//                 if(val){
//                     pb.send_user_input(val+"\r\n",function(err){
//                         if(err && err.message == 'timeout'){
//                             _this.disconnect()
//                         }
//                     })
//                     vscode.commands.executeCommand("pycom.command")
//                 }
//             }
//         );
// })


// var disposable = vscode.commands.registerCommand('pymakr.run', function () {
//     console.log("Running")
//     v.run()
// })

// var disposable = vscode.commands.registerCommand('pymakr.sync', function () {
//     console.log("Syncing")
//     v.sync()
// })

// var disposable = vscode.commands.registerCommand('pymakr.toggleREPL', function () {
//     // The code you place here will be executed every time your command is executed

//     // Display a message box to the user
//     if (terminalActive){
//         // window.hide()
//         v.hidePanel()
//         terminalActive = false
//     }else{
//         v.showPanel()
//         // outputChannel.append('Visual Studio Code is awesome!');
//         terminalActive = true;
//     }
// });

// context.subscriptions.push(disposable);

// exports.activate = activate;

// function deactivate() {
// }
// exports.deactivate = deactivate;