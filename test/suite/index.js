async function run() {
  const { probs } = await import("probs");

  await probs([__dirname + "/integration"], { runner: "main" });
}

module.exports = {
  run,
};
