/**
 * @template T
 * @typedef {T  & {__isBusy: Boolean, __ready: ResolvablePromise<any>, __lastCall: QueueItem}} BlockingProxy
 */

/**
 * @typedef {Object} QueueItem
 * @prop {function} exec
 * @prop {string|symbol} field
 * @prop {any[]} args
 * @prop {function} resolve
 * @prop {function} reject
 **/

/**
 * @template T
 * @typedef {Promise<T> & {resolve: function, reject: function}} ResolvablePromise
 */

/**
 * @returns {ResolvablePromise<any>}
 */
const resolvablePromise = () => {
  let resolve, reject;
  const origPromise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return Object.assign(origPromise, { resolve, reject });
};

/**
 * returns a proxied _target object. Methods on the returned object
 * are queued, meaning that no method can run before the previously
 * called method has been resolved or rejected. In other words,
 * methods are forced to run in sequence, rather than in parallel.
 * @template T
 * @param {T} _target
 * @param {Object} _options
 * @param {(string|symbol)[]} _options.exceptions methods that should not be queued
 * @returns {BlockingProxy<T>}
 */
const createBlockingProxy = (_target, _options) => {
  /**@type {QueueItem[]} */
  const queue = [];

  const options = { exceptions: [], ..._options };

  const target = /** @type {BlockingProxy<T>} */ (_target);
  target.__lastCall = null;

  /**
   * runs queued methods in sequence
   */
  const processQueue = async () => {
    if (target.__isBusy) return;

    target.__ready = resolvablePromise();
    target.__isBusy = true;

    while (queue.length) {
      const queueItem = queue.shift();
      target.__lastCall = queueItem;
      try {
        const result = await queueItem.exec();
        queueItem.resolve(result);
      } catch (err) {
        queueItem.reject(err);
      }
    }

    target.__isBusy = false;
  };

  return new Proxy(target, {
    get(target, field) {
      // skip queue for any fields that are exempt
      if (options.exceptions.includes(field)) return target[field].bind(target);

      const method = target[field];
      if (field === "__ready") return target["__ready"] || new Promise((resolve) => resolve());
      else if (method instanceof Function) {
        const promise = (...args) => {
          return new Promise((resolve, reject) => {
            queue.push({
              exec: () => method.bind(target)(...args),
              field,
              args,
              resolve,
              reject,
            });
            processQueue();
          });
        };
        return promise;
      } else return method;
    },
  });
};

module.exports = { createBlockingProxy };
