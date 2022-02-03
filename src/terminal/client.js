const net = require("net");
const readline = require("readline");
const host = "127.0.0.1";
const port = 5364;

const socket = new net.Socket();

const [_1, _2, protocol, address] = process.argv;

console.log("connecting to", protocol, address);

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on("keypress", async (str, key) => {
  socket.write(Buffer.from(key.sequence));
  if (key.name === "k" && key.ctrl) process.exit(0);
  if (key.name === "x" && key.ctrl) process.exit(0);
});

socket.connect(port, host, () => {
  socket.write(JSON.stringify({ address, protocol }));

  // send Ctrl+B for friendly REPL
  socket.write("\x02");

  socket.on("data", (data) => process.stdout.write(data));
});
