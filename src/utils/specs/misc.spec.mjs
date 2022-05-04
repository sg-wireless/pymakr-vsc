import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  arrayToRegexStr,
  cherryPick,
  createIsIncluded,
  createThrottledFunction,
  getDifference,
  getNearestParent,
  getNearestPymakrConfig,
  getRelativeFromNearestParent,
  getRelativeFromNearestParentPosix,
  mapEnumsToQuickPick,
  objToSerializedEntries,
  once,
  serializedEntriesToObj,
  serializeKeyValuePairs,
} from "../misc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("once functions can only be called once", () => {
  let counter = 0;
  const callme = once(() => counter++);

  callme();
  assert.equal(counter, 1);
  callme();
  assert.equal(counter, 1);
});

test("once functions can use context", () => {
  const context = { counter: 0 };
  const callme = once(function () {
    this.counter++;
  }, context);

  callme();
  assert.equal(context.counter, 1);
  callme();
  assert.equal(context.counter, 1);
});

test("getDifference returns difference", () => {
  const result = getDifference([1, 2, 3, 4, 5], [4, 5, 6, 7, 8]);
  assert.deepEqual(result, [
    [1, 2, 3],
    [6, 7, 8],
  ]);
});

test("mapEnumsToQuickPick", () => {
  const enums = ["f", "b", "b"];
  const descriptions = ["foo", "bar", "baz"];
  const result = enums.map(mapEnumsToQuickPick(descriptions));
  assert.deepEqual(result, [
    { label: "f", description: "foo" },
    { label: "b", description: "bar" },
    { label: "b", description: "baz" },
  ]);
});

test("cherryPick", () => {
  const obj = { foo: "foo", bar: "bar", baz: "baz" };
  const cherryPicked = cherryPick(obj, ["foo", "bar"]);
  assert.deepEqual(cherryPicked, { foo: "foo", bar: "bar" });
});

test("getNearestParent + relative", () => {
  // use different test paths on windows / linux
  if (process.platform === "win32") {
    const parents = ["c:\\some\\folder\\path", "c:\\some\\folder", "c:\\some"];
    const child = "c:\\some\\folder\\child\\path";

    assert.equal(getNearestParent(parents)(child), "c:\\some\\folder");
    assert.equal(getRelativeFromNearestParent(parents)(child), "child\\path");
    assert.equal(getRelativeFromNearestParentPosix(parents)(child), "child/path");
  } else {
    const parents = ["/some/folder/path", "/some/folder", "/some"];
    const child = "/some/folder/child/path";

    assert.equal(getNearestParent(parents)(child), "/some/folder");
    assert.equal(getRelativeFromNearestParent(parents)(child), "child/path");
  }
});

test("getNearestPymakrConfig", () => {
  const path = `${__dirname}/_sampleProject/folder/subfolder/foo`;
  const result = getNearestPymakrConfig(path);
  assert.equal(result.name, "sample-project");
});

test("arrayToRegexStr", () => {
  assert.equal(arrayToRegexStr(["foo", "bar"]), "(foo)|(bar)");
});

test("serializeKeyValuePairs", () => {
  const obj = {
    foo: "foo",
    bar: "test",
    baz: 123,
  };

  const result = serializeKeyValuePairs(obj);
  assert.equal(result, "foo=foo\r\nbar=test\r\nbaz=123");
});

test("createIsIncluded", () => {
  const target1 = { name: "include-me" };
  const target2 = { name: "exclude-me sometimes" };
  const target3 = { name: "exclude-me everytime", someField: "exclude-me" };

  const items = [target1, target2, target3];

  test("no exclude includes everything", () => {
    const result = items.filter(createIsIncluded([".*"], [], serializeKeyValuePairs));
    assert.deepEqual(result, items);
  });

  test("vague excludes excludes all matches", () => {
    const result = items.filter(createIsIncluded([".*"], ["exclude-me"], serializeKeyValuePairs));
    assert.deepEqual(result, [items[0]]);
  });

  test("specific excludes excludes only specific matches", () => {
    const result = items.filter(createIsIncluded([".*"], ["someField=exclude-me"], serializeKeyValuePairs));
    assert.deepEqual(result, [items[0], items[1]]);
  });
});

test("createThrottledFunction", async () => {
  const getRandom = () => Math.random();
  const throttledRandom = createThrottledFunction(getRandom);
  const call1 = throttledRandom();
  const call2 = throttledRandom();
  const call3 = throttledRandom();
  const [r1, r2, r3] = await Promise.all([call1, call2, call3]);
  assert.equal(r1, r2);
  assert.equal(r2, r3);
});

test("serialized entries", () => {
  const obj = {foo: 'FOO', bar: 'BAR'}
  const entries = ['foo=FOO', 'bar=BAR']

  assert.deepEqual(objToSerializedEntries(obj), entries)
  assert.deepEqual(serializedEntriesToObj(entries), obj)
});
