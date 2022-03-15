async function run() {
  const { probs } = await import("probs");

  await probs([__dirname + "/integration"], { runner: "main", concurrency: 1, reporter: 'consoleReporter' });
}

module.exports = {
  run,
};
