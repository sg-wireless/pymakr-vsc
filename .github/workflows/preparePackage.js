const { writeFileSync } = require("fs");

const BRANCH = process.env.BRANCH_NAME;
const isMaster = BRANCH === "master" || BRANCH === "main";

if (!isMaster) convertToPreview();

function convertToPreview() {
  const pkg = require("../../package.json");
  const updatedPkg = {
    ...pkg,
    name: "pymakr-preview",
    displayName: "Pymakr - Preview",
    publisher: "Pycom",
    preview: true,
  };
  writeFileSync('package.json', JSON.stringify(updatedPkg, null, 2))
}
