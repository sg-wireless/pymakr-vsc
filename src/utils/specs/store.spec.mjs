import { writable, derived, chainDerived } from "../store.js";

test("plain store", () => {
  let store;
  let unsub;
  let subValue = "untouched";
  test("can create store", () => {
    store = writable({ value: "initial" });
    assert.ok(store.get);
  });
  test("can get value", () => {
    assert.deepEqual(store.get(), { value: "initial" });
  });
  test("can update value", () => {
    store.set({ value: "new value" });
    assert.deepEqual(store.get(), { value: "new value" });
  });
  test("can subscribe", () => {
    unsub = store.subscribe((_value) => {
      subValue = _value;
    });
    store.set({ value: "subscribe" });
    assert.deepEqual(subValue, { value: "subscribe" });
  });
  test("can unsubscribe", () => {
    unsub();
    store.set({ value: "unsub" });
    assert.deepEqual(subValue, { value: "subscribe" });
  });
});

test("derived store", () => {
  let store;
  let unsub;
  let subValue = "untouched";
  const store1 = writable("store1");
  const store2 = writable("store2");
  const store3 = writable("store3");
  test("can create derived store", () => {
    store = derived([store1, store2, store3], ([store1, store2, store3]) => {
      return [store1, store2, store3].join("-");
    });
    assert(store.get);
  });
  test("can get value", () => {
    assert.equal(store.get(), "store1-store2-store3");
  });
  test("can set value", () => {
    store1.set("store1.updated");
    assert.equal(store.get(), "store1.updated-store2-store3");
  });
  test("can set multiple values", () => {
    store2.set("store2.updated");
    store3.set("store3.updated");
    assert.equal(store.get(), "store1.updated-store2.updated-store3.updated");
  });
  test("can subscribe", () => {
    unsub = store.subscribe((_value) => {
      subValue = _value;
    });
    store1.set("1");
    assert.equal(subValue, "1-store2.updated-store3.updated");
  });
  test("can unsub", () => {
    unsub();
    store2.set("2");
    assert.deepEqual(subValue, "1-store2.updated-store3.updated");
  });
});

test("deriveChained", () => {
  const storeStr = writable("store1");
  const storeFn = writable(str => 'derived-'+str)

  const chainedStore = chainDerived([storeStr], ([storeStr]) => {
    return derived([storeFn], ([storeFn]) => {      
      return storeFn(storeStr)
    })
  });

  test("can create chained store", () => {
    assert(chainedStore.get());
  });

  test("can get value", () => {
    assert.equal(chainedStore.get(), "derived-store1");
  });

  test("can set value", () => {
    storeStr.set("updated");
    assert.equal(chainedStore.get(), "derived-updated");
  });
  
  test('can set nested Value', ()=>{
    storeFn.set(str => 'newDerived-'+str)
    assert.equal(chainedStore.get(), "newDerived-updated");
  })
});

