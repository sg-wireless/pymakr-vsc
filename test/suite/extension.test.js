const assert = require("assert");
const { resolve } = require("path");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// const myExtension = require('../extension');

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
//   vscode.commands.executeCommand('vscode.openFolder', '/')
  
  vscode.workspace.updateWorkspaceFolders(0,0, {
    uri: vscode.Uri.file(resolve(__dirname,'/../../example/workspace/multi/multi1')),
    name: 'multi1'
  })
  // vscode.workspace.updateWorkspaceFolders(0,0, {uri: __dirname+'/../../example/workspace/multi/multi2'}

  setTimeout(() => {
    console.log("folder", vscode.workspace.workspaceFolders);
  }, 5000);
  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
  test("async test", () => new Promise(resolve => setTimeout(resolve, 500)));
});
