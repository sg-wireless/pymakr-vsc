import { cherryPick, getDifference, mapEnumsToQuickPick, once } from "../misc.js";

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
