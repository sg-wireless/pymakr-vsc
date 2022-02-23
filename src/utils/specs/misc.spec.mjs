import { getDifference, once } from "../misc.js";

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
