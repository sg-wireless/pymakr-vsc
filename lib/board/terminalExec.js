#!/usr/bin/env node

var readline = require('readline'),
    stdin = process.openStdin();


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


stdin.addListener("data", function(text) {
  rl.write(text)
})
// rl.write("Working! Please paste your input \r\n")
