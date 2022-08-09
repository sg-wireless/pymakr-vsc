const { arraysToHTMLTable, arraysToMarkdownTable, arraysToTerminalTable } = require("../formatters");

test("can create tables from arrays", () => {
  const data = [
    ["header1", "header2", "header3"],
    ["cola1", "cola2", "cola3"],
    ["colb1", "colb2", "colb3"],
  ];

  test("can create HTML table", () => {
    const output = arraysToHTMLTable(data);
    assert.equal(
      output,
      `<table>
<tr><td>header1</td> <td>header2</td> <td>header3</td></tr>
<tr><td>cola1</td> <td>cola2</td> <td>cola3</td></tr>
<tr><td>colb1</td> <td>colb2</td> <td>colb3</td></tr>
</table>`
    );
  });
  test("can create HTML table with header", () => {
    const output = arraysToHTMLTable(data, true);
    assert.equal(
      output,
      `<table>
<th><td>header1</td> <td>header2</td> <td>header3</td></th>
<tr><td>cola1</td> <td>cola2</td> <td>cola3</td></tr>
<tr><td>colb1</td> <td>colb2</td> <td>colb3</td></tr>
</table>`
    );
  });
  test("can create markdown table", () => {
    const output = arraysToMarkdownTable(data);
    assert.equal(
      output,
      `|header1|header2|header3|
|-|-|-|
|cola1|cola2|cola3|
|colb1|colb2|colb3|`
    );
  });
  test("can create terminal table", () => {
    const output = arraysToTerminalTable(data);
    console.log(output);
    assert.equal(
      output,
      `header1|header2|header3
cola1  |cola2  |cola3  
colb1  |colb2  |colb3  `
    );
  });
});
