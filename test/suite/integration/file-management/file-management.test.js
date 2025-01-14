const vscode = require("vscode");
const { posix, join } = require("path");

test("file management", async () => {
  // FIXME: dependency on other tests that are run before this one
  const device = pymakr.devicesStore.get()[0];
  // fixme: if (!device) return skip test ; // skip device tests if no device is connected

  test("can clear device", async () => {
    await device.connect();
    await device.adapter.remove(device.config.rootPath, true);
    const files = await device.adapter.listFiles(device.config.rootPath, { recursive: false });
    assert.deepEqual(files, []);
  });

  test("can upload a file", async () => {
    const uri = vscode.Uri.file(join(__dirname, "_sample/sample-file-1.md"));
    await pymakr.commands.upload(uri, device, "/sample-file-1.md");
    const files = await device.adapter.listFiles(device.config.rootPath, { recursive: false });
    assert.equal(files.length, 1);
    assert.equal(files[0].filename, posix.join(device.config.rootPath, "/sample-file-1.md"));
  });

  test("can upload a dir", async () => {
    const uri = vscode.Uri.file(__dirname + "/_sample");
    await pymakr.commands.upload(uri, device, "/");
    const files = await device.adapter.listFiles(device.config.rootPath, { recursive: true });
    assert.deepEqual(
      files.map((f) => f.filename),
      [
        posix.join(device.config.rootPath, ""),
        posix.join(device.config.rootPath, "folder"),
        posix.join(device.config.rootPath, "folder/large-file.py"),
        posix.join(device.config.rootPath, "includeme"),
        posix.join(device.config.rootPath, "includeme/includeme-file-1.md"),
        posix.join(device.config.rootPath, "includeme/includeme-file-2.md"),
        posix.join(device.config.rootPath, "main.py"),
        posix.join(device.config.rootPath, "pymakr.conf"),
        posix.join(device.config.rootPath, "sample-file-1.md"),
      ]
    );
  });

  test("can erase and provision a device", async () => {
    await pymakr.commands.eraseDevice({ device }, "empty");
    const files = await device.adapter.listFiles(device.config.rootPath, { recursive: false });
    assert.equal(files.length, 3);
    assert.deepEqual(
      files.map((f) => f.filename),
      [
        posix.join(device.config.rootPath, "boot.py"),
        posix.join(device.config.rootPath, "main.py"),
        posix.join(device.config.rootPath, "pymakr.conf"),
      ]
    );
  });
});
