const { existsSync, readFileSync } = require("fs");
const vscode = require("vscode");

const projectPath1 = workspaceDir + "/project-1";

test("can find 0 projects and 1 workspace", () => {
  assert.equal(pymakr.projectsStore.get().length, 0);
  assert.equal(vscode.workspace.workspaceFolders.length, 1);
});

test("can create project", async ({ test }) => {
  await pymakr.commands.createProject(vscode.Uri.parse(projectPath1), { name: "my project" });
  assert(existsSync(projectPath1));

  test("new project has pymakr.conf", () => {
    const configFile = readFileSync(`${projectPath1}/pymakr.conf`, "utf8");
    const config = JSON.parse(configFile);
    assert.equal(config.name, "my project");
  });

  test("projects store updates on new project", () => {
    return new Promise((resolve, reject) => {
      setTimeout(reject, PROJECT_STORE_TIMEOUT);
      pymakr.projectsStore.next(resolve);
    });
  });

  test("new project shows up in vscode", async () => {
    assert.equal(pymakr.projectsStore.get().length, 1);
    assert.equal(pymakr.projectsStore.get()[0].name, 'my project')
  });
});
