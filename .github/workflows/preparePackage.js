const { writeFileSync } = require("fs");

const BRANCH = process.env.BRANCH_NAME;
const isMaster = BRANCH === "master" || BRANCH === "main";

const previewPkg = {
  name: "pymakr-preview",
  displayName: "Pymakr - Preview",
  preview: true,
};

const stablePkg = {
  name: "pymakr",
  displayName: "Pymakr",
  preview: false,
};

const pkgUpdate = isMaster ? stablePkg : previewPkg;

const updatedPkg = {
  ...require("../../package.json"),
  ...pkgUpdate,
};

writeFileSync("package.json", JSON.stringify(updatedPkg, null, 2) + "\r\n");
