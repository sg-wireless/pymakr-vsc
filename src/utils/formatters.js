/**
 * @typedef {Object} TableOptions
 * @prop {(value: (string | number | boolean)) => (string | number | boolean)} tableWrap
 * @prop {(value: (string | number | boolean), row) => (string | number | boolean)} rowWrap
 * @prop {(value: (string | number | boolean), row, col) => (string | number | boolean)} colWrap
 * @prop {string} colDelim
 * @prop {string} rowDelim
 */

const { timestamp } = require("./createLogger");

const sanitize = (str) =>
  (typeof str === "string" ? str : JSON.stringify(str, null, 2))
    .replace(/\|/gm, "&#124;")
    .replace(/\r?\n/gm, "<br />")
    .replace(/"username": ".+?"/, '"username": "&#42;&#42;&#42;"')
    .replace(/"password": ".+?"/, '"password": "&#42;&#42;&#42;"');
const sanitizeTableValues = (table) => table.map((columns) => columns.map(sanitize));

const arraysToHTMLTable = (arrays, hasHeader) =>
  arraysToTable(arrays, {
    tableWrap: (value) => `<table>\n${value}\n</table>`,
    rowWrap: (value, row) => (hasHeader && !row ? `<th>${value}</th>` : `<tr>${value}</tr>`),
    colWrap: (value, row, col) => `<td>${value}</td>`,
    colDelim: " ",
    rowDelim: "\n",
  });

/** @param {(string | number | boolean)[][]} rows */
const arraysToMarkdownTable = ([...rows]) => {
  rows.splice(1, 0, Array(rows[0].length).fill("-"));

  return arraysToTable(rows, {
    tableWrap: (value) => value,
    rowWrap: (value, row) => `|${value}|`,
    colWrap: (value, row, col) => value,
    colDelim: "|",
    rowDelim: "\n",
  });
};

/** @param {(string | number | boolean)[][]} rows */
const arraysToTerminalTable = (rows) => {
  // determine max length of each column
  const colLenghts = Array(rows[0].length).fill(0);
  rows.forEach((row) =>
    row.forEach((col, index) => (colLenghts[index] = Math.max(col.toString().length, colLenghts[index])))
  );

  return arraysToTable(rows, {
    tableWrap: (value) => value,
    rowWrap: (value, row) => value,
    colWrap: (value, row, col) => value.toString().padEnd(colLenghts[col]),
    colDelim: "|",
    rowDelim: "\n",
  });
};

/**
 *
 * @param {(string | number | boolean)[][]} arrays
 * @param {TableOptions} options
 */
const arraysToTable = (arrays, options) => {
  arrays = sanitizeTableValues(arrays);
  const { tableWrap, rowWrap, colWrap, rowDelim, colDelim } = options;
  const formattedColumns = arrays.map((array, row) =>
    array.map((value, column) => colWrap(value, row, column)).join(colDelim)
  );
  const formattedRows = formattedColumns.map((columnStr, row) => rowWrap(columnStr, row)).join(rowDelim);

  return tableWrap(formattedRows);
};

const unBuffer = (str) =>
  str instanceof Buffer ? str.toString() : typeof str === "string" ? str : JSON.stringify(str, null, 2);

/**
 * @param {Device} device
 */
const adapterHistoryTable = (device) => {
  const fields = ["function", "args", "time", "result", "queued at", "finished at", "failed"];
  const rows = device.adapter.__proxyMeta.history.map((entry) => [
    entry.field.toString(),
    entry.args.length ? `<details> <pre>${unBuffer(entry.args)}</pre> </details>` : " ",
    entry.runDuration,
    `<details> <pre>${entry.error || unBuffer(entry.result)}</pre> </details>`,
    entry.queuedAt && timestamp(entry.queuedAt),
    entry.finishedAt && timestamp(entry.finishedAt),
    !!entry.error,
  ]);
  return [fields, ...rows.reverse()];
};

module.exports = { arraysToHTMLTable, arraysToMarkdownTable, arraysToTerminalTable, adapterHistoryTable };
