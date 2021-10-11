const assert = require("assert");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  test("can run command", async () => {
    let error;
    try {
      // todo could be improved
      await vscode.commands.executeCommand("pymakr.extra.getVersion");
    } catch (e) {
      error = e;
    }
    assert.ifError(error);
  });
});
