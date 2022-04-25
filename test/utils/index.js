const { cpSync, rmSync, readdirSync, writeFileSync, readFileSync } = require("fs");
const { resolve } = require("path");

const createFixture = (name) => {
  const path = resolve(`test/temp/${name}.${Date.now()}`);
  cpSync(`test/fixtures/${name}`, path, { recursive: true });
  writeFileSync(path + "/_FIXTURE_ORIGIN", resolve(`test/fixtures/${name}`));
  return path;
};

const resetFixture = (path) => {
  const fixtureOrigin = readFileSync(path + "/_FIXTURE_ORIGIN", "utf-8");
  readdirSync(path).forEach((file) => rmSync(`${path}/${file}`, {recursive: true}));
  cpSync(fixtureOrigin, path, { recursive: true });
  writeFileSync(path + "/_FIXTURE_ORIGIN", fixtureOrigin);
};

module.exports = { createFixture, resetFixture };
