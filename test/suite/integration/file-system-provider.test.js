const assert = require("assert");
const vscode = require("vscode");

const createUri = (device) => (path) =>
  vscode.Uri.from({ scheme: "serial", authority: device.address, path: `/flash${path}` });

test("file system provider", async () => {
  assert.equal(vscode.workspace.workspaceFolders.length, 1, "windows has one workspace folder before mount");
  const device = pymakr.devicesStore.get()[0];
  const uri = createUri(device);

  await device.connect();

  test("can mount device", async () => {
    await pymakr.commands.addDeviceToFileExplorer({ device });
    assert.equal(vscode.workspace.workspaceFolders.length, 2);
    assert.equal(vscode.workspace.workspaceFolders[1].uri.scheme, "serial");
  });

  test("can create dir", async () => {
    pymakr.fileSystemProvider.createDirectory(uri("/foo"));
    const file = await pymakr.fileSystemProvider.stat(uri("/foo"));
    assert.equal(file.type, vscode.FileType.Directory);
  });

  test("can create file", async () => {
    pymakr.fileSystemProvider.writeFile(uri("/foo/file.txt"), Buffer.from("hello world"));
    const content = await pymakr.fileSystemProvider.readFile(uri("/foo/file.txt"));
    assert.equal(content, "hello world");
  });

  test("can rename file", async () => {
    await pymakr.fileSystemProvider.rename(uri("/foo/file.txt"), uri("/foo/renamed.txt"));
    const filesAfterRename = await pymakr.fileSystemProvider.readDirectory(uri("/foo"));
    assert.equal(filesAfterRename.length, 1);
    const content = await pymakr.fileSystemProvider.readFile(uri("/foo/renamed.txt"));
    assert.equal(content, "hello world");
  });

  test("can delete file", async () => {
    const filesBeforeDelete = await pymakr.fileSystemProvider.readDirectory(uri("/foo"));
    assert.equal(filesBeforeDelete.length, 1);
    await pymakr.fileSystemProvider.delete(uri("/foo/renamed.txt"));
    const filesAfterDelete = await pymakr.fileSystemProvider.readDirectory(uri("/foo"));
    assert.equal(filesAfterDelete.length, 0);
  });

  test("can delete contentful folder", async () => {
    pymakr.fileSystemProvider.writeFile(uri("/foo/file.txt"), Buffer.from("hello world"));
    const files = await pymakr.fileSystemProvider.readDirectory(uri("/foo"));
    assert.equal(files.length, 1);
    const rootFilesBefore = await pymakr.fileSystemProvider.readDirectory(uri("/"));
    assert.deepEqual(rootFilesBefore, [["foo", 2]]);
    await pymakr.fileSystemProvider.delete(uri("/foo"));
    const rootFilesAfter = await pymakr.fileSystemProvider.readDirectory(uri("/"));
    assert.deepEqual(rootFilesAfter, []);
  });

  test("can dismount device", async () => {
    const didRemove = vscode.workspace.updateWorkspaceFolders(1, 1);
    assert(didRemove);
    await new Promise((resolve) => vscode.workspace.onDidChangeWorkspaceFolders(resolve));
    assert.equal(vscode.workspace.workspaceFolders.length, 1);
    assert.equal(vscode.workspace.workspaceFolders[0].uri.scheme, "file");
  });
});
