async function run() {
  const { probs } = await import("probs");
  await probs([__dirname + "/integration"], {
    runner: "main",
    concurrency: 1,
    reporter: "consoleReporter",
    timeout: 12000,
    // watch: true,
    // use npm run test:integration -- --pattern myfile.test.js for file patterns
    pattern: process.env.pattern ? [process.env.pattern] : [],
  });
}

module.exports = {
  run,
};
