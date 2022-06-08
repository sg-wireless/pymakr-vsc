const { writeFileSync, mkdirSync, rmdir, rmdirSync, rmSync } = require("fs");

const FILES = 75;
const CHARS_PER_FILE = 7500;

try {
  rmSync(`${__dirname}/files`, {recursive: true});
} catch (_err) {}
mkdirSync(`${__dirname}/files`, { recursive: true });

for (let i = 0; i < FILES; i++) {
  let str = "";
  for (let i = 0; i < CHARS_PER_FILE; i++) {
    // console.log(Math.random().toString())
    str += Math.random().toString()[2];
  }
  writeFileSync(`${__dirname}/files/${Math.floor(Math.random() * 10000)}`, str);
  // console.log(str)
}
