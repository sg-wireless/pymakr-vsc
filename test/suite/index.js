const path = require("path");
const Mocha = require("mocha");
const glob = require("glob");
const vscode = require("vscode");

module.exports.run = function run() {
  vscode.window.showInformationMessage("Start all tests.");
  
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
  });
  
  mocha.color(true);

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
};
