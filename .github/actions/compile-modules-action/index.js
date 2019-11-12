const core = require("@actions/core");
const github = require("@actions/github");
const atob = require("atob");
const { execSync } = require("child_process");

const gitToken = core.getInput("git-token");
const octokit = new github.GitHub(gitToken);

const repo = {
  owner: "microsoft",
  repo: "vscode"
};

/**
 * Resolves Electron runtime target for given
 * VSCode git tag
 *
 * @param {string} tag - VSCode Git Tag
 * @returns {*} Object with tag and runtime_version
 */
const resolveElectronVersion = async tag => {
  // Fetch .yarnrc file (contains electron target)
  const response = await octokit.repos.getContents({
    ...repo,
    path: ".yarnrc",
    ref: tag
  });
  // Parse from file
  let content = atob(response.data.content).split("\n");
  let version = content[1].split("target ")[1];
  version = version.substring(1, version.length - 1);
  core.info("Found electron tag: ", version);
  return {
    tag: tag,
    runtime_version: version
  };
};

/**
 * Fetches VSCode Git Tags
 * from repo
 *
 * @returns {string[]} Array containing master and 3 of the latest tags
 */
const getVSCodeTags = async () => {
  console.log("Fetching tags...");
  const repo_tags = await octokit.repos.listTags({
    ...repo,
    per_page: 50
  });

  const versReg = /^([0-9]|[1-9][0-9]*)\.([0-9]|[1-9][0-9]*)\.([0-9]|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/gm;

  // Filter valid tags
  let valid_tags = repo_tags.data.filter(i => {
    let vers = i.name;
    if (vers.includes("vsda") || vers.includes("translation")) {
      return false;
    }
    if (versReg.test(vers)) {
      return vers;
    }
  });
  // Take 3 most recent
  valid_tags = Array.from(valid_tags.slice(0, 3), i => i.name);
  core.debug("Valid tags:", valid_tags);

  // Prepend master tag
  const tags = ["master", ...valid_tags];
  return tags;
};

/**
 * Execute a command in shell
 *
 * @param {string} command - command to execute
 * @returns {*} - Command output
 */
const execute = async command => {
  const { stdout, stderr } = execSync(command, { encoding: "utf8" });
  if (stderr) {
    core.setFailed(stderr);
  }
  return stdout;
};

/**
 * Harvests bindings via mp-download
 *
 * @param {*} runtime_version - Electron runtime version to harvest bindings for
 */
const harvestModules = async runtime_version => {
  const cmd = `pwsh ./scripts/mp-download.ps1 -harvest -runtime_version ${runtime_version}`;
  await execute(cmd);
};

/**
 * Compile Native modules
 *
 * @param {*} [{ tag, runtime_version }={}] - Git Tag and Electron runtime version to compile for
 */
const compileModules = async ({ tag, runtime_version } = {}) => {
  console.info(
    `Compiling for VSCode Version: ${tag} - Electron: ${runtime_version}`
  );
  const cmd = `npx electron-rebuild --version ${runtime_version} --force`;
  await execute(cmd);
  await harvestModules(runtime_version);
};

const run = async () => {
  try {
    // Fetch git tags from VSCode Repo
    const tags = await getVSCodeTags();
    core.info("Found VSCode Tags:", tags);
    // Resolve Electron Versions
    const versions = await Promise.all(
      tags.map(i => resolveElectronVersion(i))
    );
    core.info("Resolved versions:", versions);
    // Compile Native Modules
    await execute("pwd");
    await Promise.all(versions.map(i => compileModules(i)));
    core.setOutput("compiled", versions);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
