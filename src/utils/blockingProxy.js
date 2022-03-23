const { resolvablePromise } = require("./misc");

/**
 * returns a proxied _target object. Methods on the returned object
 * are queued, meaning that no method can run before the previously
 * called method has been resolved or rejected. In other words,
 * methods are forced to run in sequence, rather than in parallel.
 * proxy helpers can be accessed at myObj.__proxyMeta
 * @template T
 * @param {T} _target
 * @param {Object} [_options]
 * @param {(string|symbol)[]} _options.exceptions methods that should not be queued
 * @param {BeforeEachCall<T>} _options.beforeEachCall
 * @returns {BlockingProxy<T>}
 */
const createBlockingProxy = (_target, _options) => {
  const options = { exceptions: [], beforeEachCall: () => {}, ..._options };

  const proxyMeta = new ProxyMeta(_target);

  const typedTarget = /** @type {BlockingProxy<_target>} */ (_target);

  return new Proxy(typedTarget, {
    ownKeys: (target) => Reflect.ownKeys(target),

    get(target, field) {
      const prop = target[field];

      // if field is on the exception list, skip the queue and call it directly on the target
      if (options.exceptions.includes(field)) return target[field].bind(target);
      // else if the field is __proxyMeta return the proxy meta helper
      else if (field === "__proxyMeta") return proxyMeta;
      // else if field is a method, queue the call in the proxy helper queue
      else if (prop instanceof Function) {
        const promise = (...args) => {
          return new Promise((resolve, reject) => {
            proxyMeta.queue.push({
              exec: async () => {
                await options.beforeEachCall(target, field, args);
                return await prop.bind(target)(...args);
              },
              field,
              args,
              resolve,
              reject,
            });
            proxyMeta.processQueue();
          });
        };
        return promise;
      } else return prop;
    },
  });
};

/**
 * @template T
 * Helper prop that sits at myProxiedObj.__proxyMeta
 */
class ProxyMeta {
  /**
   * @param {T} target
   */
  constructor(target) {
    this.target = target;

    /** @type {QueueItem} */
    this.lastCall = null;

    this.ready = resolvablePromise();

    /**@type {QueueItem[]} */
    this.history = [];

    /**@type {QueueItem[]} */
    this.queue = [];

    this.isBusy = false;
  }

  /**
   * runs queued methods in sequence
   */
  async processQueue() {
    if (this.isBusy) return;

    this.ready = resolvablePromise();
    this.isBusy = true;

    while (this.queue.length) {
      const queueItem = this.queue.shift();
      this.history.push(queueItem);
      this.lastCall = queueItem;
      try {
        const result = await queueItem.exec();
        queueItem.resolve(result);
      } catch (err) {
        queueItem.reject(err);
      }
    }

    this.ready.resolve();
    this.isBusy = false;
  }
}

module.exports = { createBlockingProxy };

/**
 * @template T
 * @typedef {T  & { __proxyMeta: ProxyMeta<T> }} BlockingProxy
 */

/**
 * @typedef {Object} QueueItem
 * @prop {function} exec
 * @prop {string|symbol} field
 * @prop {any[]} args
 * @prop {function} resolve
 * @prop {function} reject
 * @prop {any=} result
 * @prop {any=} error
 **/

/**
 * @template T
 * @callback BeforeEachCall
 * @param {T} target
 * @param {string|symbol} field
 * @param {any[]} params
 */
