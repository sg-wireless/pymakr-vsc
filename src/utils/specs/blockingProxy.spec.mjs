import { createBlockingProxy } from "../blockingProxy.js";

const obj = {
  async20: () => new Promise((resolve) => setTimeout(resolve, 20)),
};

test("unblocked object runs methods in parallel", async () => {
  const startStamp = Date.now();

  const promises = [obj.async20(), obj.async20(), obj.async20(), obj.async20(), obj.async20()];
  await Promise.all(promises);

  const duration = Date.now() - startStamp;

  assert(duration < 60);
});

test("blocked object runs methods in sequence", async () => {
  const startStamp = Date.now();
  let finishedLastTestStamp = 0;
  let isReadyTestStamp = 0;

  const proxied = createBlockingProxy(obj);
  const promises = [proxied.async20(), proxied.async20(), proxied.async20(), proxied.async20(), proxied.async20()];

  Promise.all(promises).then(() => (finishedLastTestStamp = Date.now()));
  proxied.__ready.then(() => (isReadyTestStamp = Date.now()));

  await Promise.all([...promises, proxied.__ready]);

  assert.ok(finishedLastTestStamp && isReadyTestStamp, 'timestamps should be updated')
  assert.ok(finishedLastTestStamp - startStamp > 100, 'methods should take at least 100ms (5 x 20ms)');
  assert.ok(finishedLastTestStamp - isReadyTestStamp < 10, 'methods should finish at the same time as ready')
});
