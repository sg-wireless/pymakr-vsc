const path = require('path');

const { runTests } = require('@vscode/test-electron');

async function main() {
	try {
		// clear the workspaces folders for lingering files
		require('./utils/setup').setup()		

		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [`${__dirname}/workspaces/integration`] });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
