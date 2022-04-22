const { cpSync } = require("fs");
const { resolve } = require("path");


const createFixture = (name) => {
  const path = resolve(`test/temp/${name}.${Date.now()}`);
  cpSync(`test/fixtures/${name}`, path, {recursive: true});

  return path;
};

module.exports = { createFixture };
