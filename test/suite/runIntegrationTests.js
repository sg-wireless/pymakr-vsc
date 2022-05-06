async function run() {
  const { probs } = await import("probs");
  await probs([__dirname + "/integration"], {
    runner: "main",
    concurrency: 1,
    reporter: "consoleReporter",
    timeout: 5000,
    // watch: true,
    // pattern: ["busy-devices.test.js // some test // some nested test"],
  });
}

module.exports = {
  run,
};
