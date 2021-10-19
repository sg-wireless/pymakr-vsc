const path = require("path");

const { runTests } = require("@vscode/test-electron");

const main = async () => {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../");

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite");

    // RunTests defaults to 'win32-archive' on Windows, which doesn't have any prebuild bindings.
    // For other platforms we let runTests decide the platform
    const platform = require('os').platform().match(/^win/) ? 'win32-x64-archive' : null

    // Download VS Code, unzip it and run the integration test
    await runTests({ extensionDevelopmentPath, extensionTestsPath, platform, launchArgs: ['--disable-extensions'] });
  } catch (err) {
    console.error(err);
    console.error("failed to run tests");
    process.exit(1);
  }
};

main()