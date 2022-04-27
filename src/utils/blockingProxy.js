const { resolvablePromise } = require("./misc");

/**
 * helper function for printing the state of a proxied method
 * @param {BlockingProxyQueueItem} item
 */
const friendlyProxyQueueItem = (item) => {
  const strArgs = item.args.map((arg) => JSON.stringify(arg));
  const argsStr = strArgs.map((arg) => "  " + arg).join(",\r\n");
  const params = item.args.length > 1 ? `\r\n${argsStr}\r\n` : `${strArgs.join()}`;
  const action = `ACTION: adapter.${item.field.toString()}(${params})`;
  const waitDuration = `WAIT: ${item.waitDuration} ms`;
  const runDuration = `RUN: ${item.runDuration} ms`;
  const outcome = item.error ? `ERROR: ${item.error}` : item.result ? `RESULT: ${item.result}` : "";
  return [action, waitDuration, runDuration, outcome].join("\r\n");
};

/**
 * returns a proxied _target object. Methods on the returned object
 * are queued, meaning that no method can run before the previously
 * called method has been resolved or rejected. In other words,
 * methods are forced to run in sequence, rather than in parallel.
 * proxy helpers can be accessed at myObj.__proxyMeta
 * @template T
 * @param {T} _target
 * @param {Object} [_options]
 * @param {(string|symbol)[]=} _options.exceptions methods that should not be queued
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
      // if field is on the exception list, skip the queue and call it directly on the target
      if (options.exceptions.includes(field)) return target[field].bind(target);
      // else if the field is __proxyMeta return the proxy meta helper
      else if (field === "__proxyMeta") return proxyMeta;
      // else if field is a method, queue the call in the proxy helper queue
      else if (target[field] instanceof Function) {
        const promise = (...args) => {
          return new Promise((resolve, reject) => {
            proxyMeta.queue.push(new BlockingProxyQueueItem(target, field, args, options, resolve, reject));
            proxyMeta.processQueue();
          });
        };
        return promise;
      } else return target[field];
    },
  });
};

class BlockingProxyQueueItem {
  /**
   *
   * @param {any} target
   * @param {string | symbol} field
   * @param {any[]} args
   * @param {*} options
   * @param {function} resolve
   * @param {function} reject
   */
  constructor(target, field, args, options, resolve, reject) {
    this.target = target;
    this.field = field;
    this.args = args;
    this.options = options;
    this.resolve = resolve;
    this.reject = reject;
    this.result = null;
    this.error = null;
    this.queuedAt = new Date();
    this.startedAt = null;
    this.finishedAt = null;
  }

  async exec() {
    try {
      this.startedAt = new Date();
      const { target, field, args } = this;
      await this.options.beforeEachCall(target, field, args);
      const result = await target[field].bind(target)(...args);
      this.finishedAt = new Date();
      this.resolve(result);
    } catch (err) {
      this.reject(err);
    }
  }

  get waitDuration() {
    return !this.startedAt ? "never started" : this.startedAt.getTime() - this.queuedAt.getTime();
  }
  get runDuration() {
    return !this.finishedAt ? "never finished" : this.finishedAt.getTime() - this.startedAt.getTime();
  }
}

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

    /** @type {BlockingProxyQueueItem} */
    this.lastCall = null;

    this.idle = resolvablePromise();
    
    /** @private */
    this.skipQueue = resolvablePromise();
    
    // Proxy starts in idle mode. 
    // Calls to processQueue will replace the idle prop with a new promise.
    this.idle.resolve();

    /**@type {BlockingProxyQueueItem[]} */
    this.history = [];

    /**@type {BlockingProxyQueueItem[]} */
    this.queue = [];

    this.isBusy = false;

    this.isPaused = true;
  }

  run() {
    this.isPaused = false;
    this.processQueue();
  }

  /**
   * Moves a number of items from the end of the queue and to the front.
   * Their order will be preserved, so if queue equals [1,2,3,4,5], popToFront(3) would
   * result in [3,4,5,1,2]
   * @param {number} num
   */
  shiftLastToFront(num = 1) {
    const items = this.queue.splice(-num, 0);
    items.reverse().forEach((item) => this.queue.unshift(item));
    return this;
  }

  /**
   * runs queued methods in sequence
   */
  async processQueue() {
    if (this.isBusy || this.isPaused) return;

    this.idle = resolvablePromise();
    this.isBusy = true;

    while (this.queue.length) {
      this.skipQueue = resolvablePromise();
      const queueItem = this.queue.shift();
      this.history.push(queueItem);
      this.lastCall = queueItem;
      // continue once this call is resolved or proxy receives a skipQueue call
      await Promise.race([queueItem.exec(), this.skipQueue]);
    }

    this.idle.resolve();
    this.isBusy = false;
  }

  /** Clears the queue. */
  clearQueue() {
    this.queue.length = 0;
  }

  /**
   * Skips the current running call
   * The skipped call will continue as normal,
   * but will be removed from the queue.
   * Only unskipped calls affect the idle status of the proxy.
   */
  skipCurrent() {
    this.skipQueue.resolve();
  }
}

module.exports = { createBlockingProxy, friendlyProxyQueueItem };

/**
 * @template T
 * @typedef {T  & { __proxyMeta: ProxyMeta<T> }} BlockingProxy
 */

/**
 * @template T
 * @callback BeforeEachCall
 * @param {T} target
 * @param {string|symbol} field
 * @param {any[]} params
 */
