async function run() {
  const { probs } = await import("probs");
  await probs([__dirname + "/integration"], {
    runner: "main",
    concurrency: 1,
    reporter: "consoleReporter",
    timeout: 7500,
    // watch: true,
    // pattern: ["file-management.test.js"],
  });
}

module.exports = {
  run,
};
