const { cpSync, rmSync, readdirSync, writeFileSync, readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const createFixture = (name, path) => {
  path = path || resolve(`test/temp/${name}.${Date.now()}`);
  if (existsSync(path)) rmSync(path, { recursive: true });
  cpSync(`test/fixtures/${name}`, path, { recursive: true });
  writeFileSync(path + "/_FIXTURE_ORIGIN", resolve(`test/fixtures/${name}`));
  return path;
};

const resetFixture = (path) => {
  const fixtureOrigin = readFileSync(path + "/_FIXTURE_ORIGIN", "utf-8");
  readdirSync(path).forEach((file) => rmSync(`${path}/${file}`, { recursive: true }));
  cpSync(fixtureOrigin, path, { recursive: true });
  writeFileSync(path + "/_FIXTURE_ORIGIN", fixtureOrigin);
};

/** returns value of process arguments, like "--pattern some-file.js" */
const getArg = (name) => {
  const index = process.argv.indexOf(name) + 1;
  if (index) return process.argv[index];
};

module.exports = { createFixture, resetFixture, getArg };

// executes scripts from command line
// eg.: utils/index.js createFixture led-example temp/test/integration-test
(function execFromArg() {
  const [_bin, _script, fn, ...params] = process.argv;
  if (fn && module.exports[fn]) module.exports[fn](...params);
})();
