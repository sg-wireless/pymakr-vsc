/**
 * Remove redundant file operations. Eg. those that will be deleted or overwritten by later operations.
 * @param  {{action: 'change'|'create'|'delete', file: string}[]} fileInstructions
 */
const removeOverlappingInstructions = (fileInstructions) => {
  let pool = [...fileInstructions];
  const newInstructions = []

  while (pool.length) {
    const lastInstruction = pool.pop();
    const firstMatchingInstruction = pool.find(({ file }) => file === lastInstruction.file);
    const shouldRemoveSelf = lastInstruction.action === "delete" && firstMatchingInstruction?.action === "create";
    pool = pool.filter(({ file }) => !file.startsWith(lastInstruction.file));
    if (!shouldRemoveSelf) newInstructions.unshift(lastInstruction);
  }
  return newInstructions
};

module.exports = { removeOverlappingInstructions };
