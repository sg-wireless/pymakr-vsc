const assert = require("assert");
const { existsSync, writeFileSync } = require("fs");
const { join } = require("path");
const vscode = require("vscode");

const projectPath1 = join(workspaceDir, "project-1");
/** @type {Project} */
let project;
/** @type {Device} */
let device;

beforeAll(async () => {
  // Create a project and add a device
  // todo should createProject resolve promise only once project is added to projectsStore?
  await pymakr.commands.createProject(vscode.Uri.parse(projectPath1), { name: "my project" });
  await new Promise((resolve) => pymakr.projectsStore.next(resolve));
  project = pymakr.projectsStore.get()[0];
  device = pymakr.devicesStore.get()[0];
  project.setDevices([device]);
  assert(existsSync(projectPath1));
  assert.equal(project.name, "my project");
  assert(device);
});

test("can use devmode", async () => {
  test("can put project in devmode", async () => {
    await pymakr.commands.startDevMode({ project });
    assert(project.watcher.active);
    assert.equal(project.watcher.deviceManagers.length, 1);
  });
  test("connected out of sync devices are updated when devmode is started", async () => {
    await pymakr.commands.stopDevMode({ project });
    await device.connect();
    writeFileSync(projectPath1 + "/main.py", 'print("hello world1")\n');
    pymakr.commands.startDevMode({ project });
    await new Promise((resolve) => device.readUntil("hello world1", resolve));
  });
  test("saving a file, uploads it and restarts device", async () => {
    writeFileSync(projectPath1 + "/main.py", 'print("hello world2")\n');
    await new Promise((resolve) => device.readUntil("hello world2", resolve));
  });
  test("devices without looping scripts show idle terminal", async () => {
    writeFileSync(projectPath1 + "/main.py", 'print("hello world3")\n');
    await new Promise((resolve) => device.readUntil("hello world3", resolve));
    if (device.busy.get()) await new Promise((resolve) => device.busy.subscribe((val) => !val && resolve()));
  });
  test("devices with looping scripts show as running user scripts", async () => {
    writeFileSync(projectPath1 + "/main.py", 'import time\nwhile True:\n  print("waiting...")\n  time.sleep(0.5)\n');
    await new Promise((resolve) => device.readUntil("waiting...", resolve));
    await new Promise((resolve) => device.readUntil("waiting...", resolve));
    assert.equal(device.state.main.get(), "script");
  });
  test("devices with looping scripts will be stopped and restarted on file changes", async () => {
    writeFileSync(projectPath1 + "/main.py", 'print("hello world again")');
    await new Promise((resolve) => device.readUntil("hello world again", resolve));
  });
  test("devices with looping scripts will be stopped and restarted on file changes repeatedly", async () => {
    writeFileSync(projectPath1 + "/main.py", 'print("hello world again again")');
    await new Promise((resolve) => device.readUntil("hello world again again", resolve));
  });
  test('bad code in main.py is printed correctly"', async () => {
    writeFileSync(projectPath1 + "/main.py", "bad code");
    await new Promise((resolve) => device.readUntil("SyntaxError: invalid syntax", resolve));
  });
  test("can stop devMode", async () => {
    await pymakr.commands.stopDevMode({ project });
    assert(!project.watcher.active);
    assert.equal(project.watcher.deviceManagers.length, 0);
  });
});
