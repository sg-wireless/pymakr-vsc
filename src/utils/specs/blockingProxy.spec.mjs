import { createBlockingProxy } from "../blockingProxy.js";

const createTestObj = () => {
  const obj = {
    events: [],
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
  proxied.__proxyMeta.run()  
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
  proxied.__proxyMeta.run()
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
