const { createReadUntil } = require("../readUntil");

test("readUntil", () => {
  const readUntil = createReadUntil();
  test("can match an exact string", () => {
    const results = [];
    readUntil("foo", () => results.push("foo"));
    readUntil.push("foo");
    assert.deepEqual(results, ["foo"]);
  });

  test("can match end of string", () => {
    const results = [];
    readUntil("bar", () => results.push("bar"));
    readUntil.push("bar");
    assert.deepEqual(results, ["bar"]);
  });

  test("can match concatenated characters", () => {
    let isMatch;
    readUntil(/\n>>> [^\n]*$/, (_isMatch) => (isMatch = _isMatch), { callOnFalse: true });

    readUntil.push("\n");
    assert(!isMatch);
    readUntil.push(">>> ");
    assert(isMatch);
    readUntil.push("foo");
    assert(isMatch);
    readUntil.push("\nbar"); // linebreak breaks the match
    assert(!isMatch);
  });

  test("can match concatenated characters", () => {
    let isMatch;
    readUntil(/\n>>> [^\n]*$/, (_isMatch) => (isMatch = _isMatch), { callOnFalse: true });

    readUntil.push("\n");
    assert(!isMatch);
    readUntil.push(">");
    assert(!isMatch);
    readUntil.push(">");
    assert(!isMatch);
    readUntil.push(">");
    assert(!isMatch);
    readUntil.push(" ");
    assert(isMatch);
    readUntil.push("foo");
    assert(isMatch);
    readUntil.push("\nbar"); // linebreak breaks the match
    assert(!isMatch);
  });

  test("can unsub", () => {
    let counter = 0;
    const unsub = readUntil("foo", () => {
      counter++;
      if (counter >= 2) unsub();
    });
    readUntil.push("foo");
    readUntil.push("foo");
    readUntil.push("foo");
    readUntil.push("foo");
    assert.equal(counter, 2);
  });
});
