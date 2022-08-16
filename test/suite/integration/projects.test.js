const { existsSync, readFileSync, writeFileSync, mkdirSync } = require("fs");
const vscode = require("vscode");
const { join } = require("path");

const projectPath1 = join(workspaceDir, "project-with-dist_dir");
const getProject = () => pymakr.projectsStore.get()[0];
const getDevice = () => pymakr.devicesStore.get()[0];

test("can find 0 projects and 1 workspace", () => {
  assert.equal(pymakr.projectsStore.get().length, 0);
  assert.equal(vscode.workspace.workspaceFolders.length, 1);
});

test("can create project", async () => {
  await pymakr.commands.createProject(vscode.Uri.parse(projectPath1), { name: "my project", dist_dir: "device" });
  assert(existsSync(projectPath1));
  mkdirSync(projectPath1 + "/device");
  test("new project has pymakr.conf", () => {
    const configFile = readFileSync(`${projectPath1}/pymakr.conf`, "utf8");
    const config = JSON.parse(configFile);
    assert.equal(config.name, "my project");
  });
  test("projects store updates on new project", () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject("project store timed out"), PROJECT_STORE_TIMEOUT);
      pymakr.projectsStore.next(resolve);
    });
  });
  test("new project shows up in vscode", async () => {
    assert.equal(pymakr.projectsStore.get().length, 1);
    assert.equal(getProject().name, "my project");
  });
});

test("can add device to project", async () => {
  const project = getProject();
  project.setDevices([getDevice()]);
});

test("can upload project", async () => {
  test("has correct absoluteDistDir", () => {
    const project = getProject();
    assert.match(project.absoluteDistDir, /project-with-dist_dir..?device/);
  });
  test("uploads from dist_dir", async () => {
    writeFileSync(projectPath1 + "/device/script.py", 'print("hello world")');
    const device = getDevice();
    const project = getProject();
    await device.connect();
    await pymakr.commands.uploadProject({ device, project });
  });
  test("can read uploaded file", async () => {
    const file = await getDevice().adapter.getFile("script.py");
    assert.equal(file.toString(), 'print("hello world")');
  });
});

test("can change dist_dir to root", () => {
  const configFile = readFileSync(`${projectPath1}/pymakr.conf`, "utf8");
  const config = JSON.parse(configFile);
  config.dist_dir = "";
  writeFileSync(`${projectPath1}/pymakr.conf`, JSON.stringify(config, null, 2));
  const device = getDevice();
  const project = getProject();
  test('"upload project" uploads the dist_dir', async () => {
    const root = device.config.rootPath;
    await pymakr.commands.uploadProject({ device, project });
    const files = await device.adapter.listFiles(root, { recursive: true });
    const filenames = files.map((file) => file.filename);
    assert.deepEqual(filenames, [`${root}`, `${root}/device`, `${root}/device/script.py`, `${root}/pymakr.conf`]);
  });
});
