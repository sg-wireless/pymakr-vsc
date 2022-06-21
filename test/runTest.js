const path = require("path");

const { runTests } = require("@vscode/test-electron");
const { createFixture, getArg } = require("./utils");

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../");

    {
      const fixtureName = "empty";
      const extensionTestsPath = path.resolve(__dirname, "./suite/runIntegrationTests.js");
      const fixturePath = createFixture(fixtureName);
      await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: [`${fixturePath}/workspace.code-workspace`],
        extensionTestsEnv: { fixturePath, fixtureName, pattern: getArg('--pattern') },
      });
    }

    // /**
    //  * Another test
    //  */
    // {
    //   // The test script to run
    //   const extensionTestsPath = path.resolve(__dirname, "./suite/runIntegrationTests");
    //   // The fixture to be used for the tests
    //   const fixturePath = createFixture("empty");
    //   await runTests({
    //     extensionDevelopmentPath,
    //     extensionTestsPath,
    //     launchArgs: [fixturePath],
    //     extensionTestsEnv: { fixturePath },
    //   });
    // }
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exit(1);
  }
}

main();
