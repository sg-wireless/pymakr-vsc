const { removeOverlappingInstructions } = require("../utils");

test("removeOverlappingInstructions", () => {
  /** @type {{action: 'change'|'create'|'delete', file: string}[]} fileInstructions */
  const instructions = [
    { file: "src", action: "create" },
    { file: "src/main.js", action: "create" },
    { file: "src/main.js", action: "change" },
    { file: "src/utils.js", action: "create" },
    { file: "src/test", action: "create" },
    { file: "src/test/test.js", action: "create" },
    { file: "src/test/test.js", action: "change" },
    { file: "src/main.js", action: "change" },
    { file: "src/test", action: "delete" },
    { file: "src/utils.js", action: "change" },
  ];
  const newInstructions = removeOverlappingInstructions(instructions);
  assert.deepEqual(newInstructions, [
    {
      action: "create",
      file: "src",
    },
    {
      action: "change",
      file: "src/main.js",
    },
    {
      action: "change",
      file: "src/utils.js",
    },
  ]);
});
