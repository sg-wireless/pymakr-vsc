/**
 * @template T
 * @typedef {T  & {__isBusy: Boolean, __ready: ResolvablePromise<any>}} BlockingProxy
 */

/**
 * @typedef {Object} QueueItem
 * @prop {function} exec
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
 * queues methods so no method can run before the previously
 * called method has been resolved or rejected
 * @template T
 * @param {T} _target
 * @param {Object} _options
 * @param {string[]} _options.exceptions
 * @returns {BlockingProxy<T>}
 */
const createBlockingProxy = (_target, _options) => {
  /**@type {QueueItem[]} */
  const queue = [];

  const options = { exceptions: [], ..._options };

  const target = /** @type {BlockingProxy<T>} */ (_target);

  /**
   * runs queued methods in sequence
   */
  const processQueue = async () => {
    if (target.__isBusy) return;

    target.__ready = resolvablePromise();
    target.__isBusy = true;

    while (queue.length) {
      const queueItem = queue.shift();
      try {
        const result = await queueItem.exec();
        queueItem.resolve(result);
      } catch (err) {
        queueItem.reject(err);
      }
    }

    target.__isBusy = false;
    console.log(target.__ready);
  };

  return new Proxy(target, {
    get(target, field) {
      // skip queue for any fields that are exempt
      if (options.exceptions.includes(field)) return target[field].bind(target);

      const method = target[field];

      if (field === "__ready") return target["__ready"] || new Promise((resolve) => resolve());
      else if (method instanceof Function) {
        const promise = (...args) =>
          new Promise((resolve, reject) =>
            queue.push({
              exec: () => method.bind(target)(...args),
              resolve,
              reject,
            })
          );

        processQueue();
        return promise;
      } else return method;
    },
  });
};

module.exports = { createBlockingProxy };
