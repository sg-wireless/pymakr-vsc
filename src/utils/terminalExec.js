#!/usr/bin/env node

const port = process.argv.length >= 3 ? Number(process.argv[2]) : 1337;
const ip = "127.0.0.1";

const net = require("net");
const clients = [];
const stdin = process.openStdin();
// todo not sure if this is correct
// @ts-ignore
stdin.setRawMode(true);
const debug = true;

log("Starting server...");
net
  .createServer(function (socket) {
    log("Client connected");
    clients.push(socket);

    socket.on("data", function (data) {
      boardInput(data);
    });

    socket.on("end", function () {
      log("Client disconnected");
      clients.splice(clients.indexOf(socket), 1);
    });
  })
  .listen(port, ip);

stdin.addListener("data", function (text) {
  userInput(text);
});

// Send a message to all clients
function userInput(message) {
  clients.forEach(function (client) {
    client.write(message);
  });
}

function boardInput(message) {
  process.stdout.write(message);
}

function log(...msg) {
  if (debug) {
    console.log(...msg);
  }
}
