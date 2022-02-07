
/**
 * @template T
 * @typedef {T  & {__isBusy: Boolean, __ready: ResolvablePromise<any>}} BlockingProxy
 */

/**
 * @typedef {Object} QueueItem
 * @prop {function} method
 * @prop {Object} target
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
 * @template T
 * @param {T} _target
 * @returns {BlockingProxy<T>}
 */
const createBlockingProxy = (_target) => {
  /**@type {QueueItem[]} */
  const queue = [];

  const target = /** @type {BlockingProxy<T>} */ (_target);

  const processQueue = async () => {
    if (target.__isBusy) return;

    target.__ready = resolvablePromise();
    target.__isBusy = true;

    while (queue.length) {
      const queueItem = queue.shift();
      try {
        const result = await queueItem.method.bind(queueItem.target)(...queueItem.args);
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
      const method = target[field];
      if (field === "__ready") return target["__ready"] || new Promise((resolve) => resolve());
      else if (method instanceof Function) {
        const promise = (...args) =>
          new Promise((resolve, reject) => queue.push({ method, target, args, resolve, reject }));
        processQueue();
        return promise;
      } else return method;
    },
  });
};

module.exports = { createBlockingProxy };
