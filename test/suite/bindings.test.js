const assert = require("assert");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// import * as myExtension from '../../extension';

suite("Setup Test Suite", () => {

  test("bindings are available", () => {
    let error;
    try {
      serialport = require("serialport");
    } catch (e) {
      error = e;
    }
    assert.ifError(error);
  });
});
