/**
 * Remove redundant file operations. Eg. those that will be deleted or overwritten by later operations.
 * @param  {{action: 'change'|'create'|'delete', file: string}[]} fileInstructions
 */
const removeOverlappingInstructions = (fileInstructions) => {
  let pool = [...fileInstructions];
  const newInstructions = [];

  while (pool.length) {
    const lastInstruction = pool.pop();
    const firstMatchingInstruction = pool.find(({ file }) => file === lastInstruction.file);
    const shouldRemoveSelf = lastInstruction.action === "delete" && firstMatchingInstruction?.action === "create";
    pool = pool.filter(({ file }) => !file.startsWith(lastInstruction.file));
    if (!shouldRemoveSelf) newInstructions.unshift(lastInstruction);
  }
  return newInstructions;
};

const fakeDeepSleep = (id, str) =>
  str
    .replace(/machine\.sleep/gm, "fake_machine.sleep")
    .replace(/machine\.deepSleep/gm, "fake_machine.sleep")
    .replace(/import machine/gm, "import fake_machine")
    .replace(/from machine import sleep/gm, "from fake_machine import sleep")
    .replace(/from machine import deepSleep/gm, "from fake_machine import deepSleep");

module.exports = { removeOverlappingInstructions, fakeDeepSleep };
