const { mkdirSync, rmSync, existsSync } = require("fs");
const { resolve } = require("path");

const workspacePaths = {
  integration: resolve(__dirname, "../workspaces/integration"),
  e2e: resolve(__dirname, "../workspaces/e2e"),
};

const setup = () => {
  if (existsSync(workspacePaths.integration)) rmSync(workspacePaths.integration, { recursive: true, force: true });
  mkdirSync(workspacePaths.integration, { recursive: true });
  if (existsSync(workspacePaths.e2e)) rmSync(workspacePaths.e2e, { recursive: true, force: true });
  mkdirSync(workspacePaths.e2e, { recursive: true });
};

// allow setup to be executed from the command line with "node setup.js --run-setup"
if (process.argv.includes("--run-setup")) setup();

module.exports = { setup };
