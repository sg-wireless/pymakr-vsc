const vscode = require("vscode");
const { join } = require("path");

test("file management", async ({ test }) => {
  const device = pymakr.devicesStore.get()[0];
  test("can clear device", async () => {
    await device.connect();
    await device.adapter.remove("/flash", true);
    const files = await device.adapter.listFiles("/flash", { recursive: false });
    assert.deepEqual(files, []);
  });
  test("can upload a file", async () => {
    const uri = vscode.Uri.file( join(__dirname, "_sample/sample-file-1.md"));
    await pymakr.commands.upload(uri, device, "/sample-file-1.md");
    const files = await device.adapter.listFiles("/flash", { recursive: false });
    assert.equal(files.length, 1);
    assert.equal(files[0].filename, "/flash/sample-file-1.md");
  });
  test("can upload a dir", async () => {
    const uri = vscode.Uri.file(__dirname + "/_sample");
    await pymakr.commands.upload(uri, device, "/");
    const files = await device.adapter.listFiles("/flash", { recursive: false });
    assert.deepEqual(
      files.map((f) => f.filename),
      ["/flash/includeme", "/flash/main.py", "/flash/pymakr.conf", "/flash/sample-file-1.md", "/flash/sample-file-2.md"]
    );
  });
  test("can erase and provision a device", async () => {
    await pymakr.commands.eraseDevice({ device }, "empty");
    const files = await device.adapter.listFiles("/flash", { recursive: false });
    assert.equal(files.length, 2);
    assert.deepEqual(
      files.map((f) => f.filename),
      ["/flash/boot.py", "/flash/main.py"]
    );
  });
});
