import { createBlockingProxy } from "../blockingProxy.js";

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

const createTestObj = () => {
  const obj = {
    events: [],
    runCallback: (callback, delay) =>
      new Promise((resolve) =>
        setTimeout(() => {
          callback();
          resolve();
        }, delay)
      ),
    async20: () =>
      new Promise((resolve) =>
        setTimeout(() => {
          obj.events.push("async20");
          resolve();
        }, 20)
      ),
    async10: () =>
      new Promise((resolve) =>
        setTimeout(() => {
          obj.events.push("async10");
          resolve();
        }, 20)
      ),
  };
  return obj;
};

// this doesn't test blockingProxy, just the test object
test("unblocked object runs methods in parallel", async () => {
  const obj = createTestObj();
  const startStamp = Date.now();

  const promises = [obj.async20(), obj.async20(), obj.async20(), obj.async20(), obj.async20()];
  await Promise.all(promises);

  const duration = Date.now() - startStamp;

  assert(duration < 60);
});

test("blocked object runs methods in sequence", async () => {
  const obj = createTestObj();
  const startStamp = Date.now();
  let finishedLastTestStamp = 0;
  let isReadyTestStamp = 0;

  const proxied = createBlockingProxy(obj);
  const promises = [proxied.async20(), proxied.async20(), proxied.async20(), proxied.async20(), proxied.async20()];
  Promise.all(promises).then(() => (finishedLastTestStamp = Date.now()));

  // start proxy
  proxied.__proxyMeta.run();
  proxied.__proxyMeta.idle.then(() => (isReadyTestStamp = Date.now()));
  await Promise.all([...promises, proxied.__proxyMeta.idle]);

  assert.ok(finishedLastTestStamp && isReadyTestStamp, "timestamps should be updated");
  assert.ok(finishedLastTestStamp - startStamp > 100, "methods should take at least 100ms (5 x 20ms)");
  assert.ok(finishedLastTestStamp - isReadyTestStamp < 10, "methods should finish at the same time as ready");
});

test("blocked object can have beforeEachCall hook and exceptions", async () => {
  const obj = createTestObj();
  const startStamp = Date.now();
  let finishedLastTestStamp = 0;
  let isReadyTestStamp = 0;

  const proxied = createBlockingProxy(obj, {
    exceptions: ["async20"],
    beforeEachCall: async (target, field) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      target.events.push("before " + field.toString());
    },
  });
  const promises = [
    proxied.async20(),
    proxied.async10(), // run queued
    proxied.async20(),
    proxied.async10(), // and queued
    proxied.async20(),
  ];

  Promise.all(promises).then(() => (finishedLastTestStamp = Date.now()));

  // start proxy
  proxied.__proxyMeta.run();
  proxied.__proxyMeta.idle.then(() => (isReadyTestStamp = Date.now()));

  await Promise.all([...promises, proxied.__proxyMeta.idle]);

  assert.ok(finishedLastTestStamp && isReadyTestStamp, "timestamps should be updated");
  assert.ok(
    finishedLastTestStamp - startStamp < 200,
    "methods should take less than 200ms (30ms + 10 ms + 30ms + 10 ms)"
  );
  assert.ok(
    finishedLastTestStamp - startStamp > 80,
    "methods should take more than 80ms (30ms + 10 ms + 30ms + 10 ms)"
  );
  assert.ok(finishedLastTestStamp - isReadyTestStamp < 10, "methods should finish at the same time as ready");
  assert.deepEqual(obj.events, [
    "async20",
    "async20",
    "async20",
    "before async10",
    "async10",
    "before async10",
    "async10",
  ]);
});

test("can clear queue", async () => {
  const obj = createTestObj();
  const proxied = createBlockingProxy(obj);

  const messages = [];

  proxied.runCallback(() => messages.push("hello"), 20);
  proxied.runCallback(() => messages.push("world"), 20);
  proxied.runCallback(() => messages.push("how are you"), 20);

  proxied.__proxyMeta.run();

  // clear queue in the middle of the second call
  await wait(30);
  proxied.__proxyMeta.clearQueue();
  await proxied.__proxyMeta.idle;

  assert.deepEqual(messages, ["hello", "world"]);
});

test("can skip current call", async () => {
  const obj = createTestObj();
  const proxied = createBlockingProxy(obj);

  const messages = [];

  proxied.runCallback(() => messages.push("hello"), 60);
  proxied.runCallback(() => messages.push("world"), 20);
  proxied.runCallback(() => messages.push("how"), 20);
  proxied.runCallback(() => messages.push("are"), 20);
  proxied.runCallback(() => messages.push("you"), 20);

  proxied.__proxyMeta.run();
  proxied.__proxyMeta.skipCurrent();
  await proxied.__proxyMeta.idle;
  assert.deepEqual(messages, ["world", "how", "hello", "are", "you"]);
});

test("a skipped call doesnt keep the queue active", async () => {
  const obj = createTestObj();
  const proxied = createBlockingProxy(obj);

  const messages = [];

  proxied.runCallback(() => messages.push("hello"), 20);

  proxied.__proxyMeta.run();
  proxied.__proxyMeta.skipCurrent();
  await proxied.__proxyMeta.idle;
  assert.deepEqual(messages, []);

  await wait(20);
  assert.deepEqual(messages, ["hello"]);
});
