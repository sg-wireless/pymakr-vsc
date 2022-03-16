const { mkdirSync, rmSync, existsSync } = require("fs");

const workspacePaths = {
  integration: __dirname + "/../workspaces/integration",
  e2e: __dirname + "/../workspaces/e2e",
};

const setup = () => {
  if (existsSync(workspacePaths.integration)) rmSync(workspacePaths.integration, { recursive: true });
  mkdirSync(workspacePaths.integration, { recursive: true });
  if (existsSync(workspacePaths.e2e)) rmSync(workspacePaths.e2e, { recursive: true });
  mkdirSync(workspacePaths.e2e, { recursive: true });
};

if (process.argv.includes("--run-setup")) setup();
