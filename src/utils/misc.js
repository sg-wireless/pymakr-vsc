const { existsSync, readFileSync } = require("fs");
const { relative, resolve, dirname } = require("path");

/**
 * creates a function that can only be called once
 * @param {function} fn
 * @param {object} context
 * @returns
 */
const once = (fn, context) => {
  let expired = false;
  let result;
  return (...args) => {
    if (!expired) result = context ? fn.apply(context, args) : fn(...args);
    expired = true;
    return result;
  };
};

/**
 * if the input isn't an array, an array will be returned containing the input
 * if the input is an array, the input will be returned
 * @template T
 * @param {T|T[]} input
 * @returns {T[]}
 */
const coerceArray = (input) => (Array.isArray(input) ? input : [input]);

/**
 * creates a promise that will return a rejection after <time> has expired
 * used in Promise.race()
 * @param {number} time
 * @param {string} msg
 * @returns
 */
const createTimeout = (time, msg = "operation timed out") =>
  new Promise((_res, rej) => setTimeout(() => rej(msg), time));

/**
 * promise wrapper that returns a rejection if the promise didn't resolve within <time>
 * @example
 * const body = await waitFor(fetchFile('hello.txt'), 3000, 'file failed to fetch in 3 seconds.')
 * @template T
 * @param {Promise<T>} promise
 * @param {number} time
 * @param {string} msg
 * @returns {Promise<T>}
 */
const waitFor = (promise, time, msg) => Promise.race([promise, createTimeout(time, msg)]);

/**
 * Coerce functions to {dispose: function}
 * Objects with a dispose property will be returned as is
 * @template {(()=>any)|{dispose: ()=>any}} T
 * @param {T} fn
 * @returns {{dispose: ()=>any}}
 */
const coerceDisposable = (fn) => {
  if (fn instanceof Function) return { dispose: fn };
  else if (fn.dispose) return fn;
  else throw new Error("fn must be a function or an object with a dispose property");
};

/**
 * gets symmetrical difference between two arrays
 * @param {any[]} arrA
 * @param {any[]} arrB
 * @returns {[any[],any[]]}
 */
const getDifference = (arrA, arrB) => [
  arrA.filter((val) => !arrB.includes(val)),
  arrB.filter((val) => !arrA.includes(val)),
];

const mapEnumsToQuickPick = (descriptions) => (_enum, index) => ({
  label: _enum,
  description: descriptions[index],
});

/**
 * Returns a cloned object with cherry picked props
 * @template T
 * @template {(keyof T)} K
 * @param {T} obj
 * @param {K[]} props
 * @returns {{[P in K]: T[P]}}
 */
const cherryPick = (obj, props) =>
  props.reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), /** @type {obj} */ ({}));

/**
 * Curried function.Returns the nearest parent from an array of folders
 * @param {string[]} parents
 * @returns {(child:string)=>string}
 */
const getNearestParent = (parents) => {
  const findLongest = (a, b) => (a.length > b.length ? a : b);
  const _parents = parents.map((p) => resolve(p));
  /**
   * @param {string} child
   */
  return (child) => {
    const _child = resolve(child);
    return _parents.filter((p) => _child.startsWith(p)).reduce(findLongest);
  };
};

/**
 * Curried function. Returns the relative path from the nearest provided parent
 * @param {string[]} parents array of file paths
 * @returns {(child:string)=>string}
 */
const getRelativeFromNearestParent = (parents) => (child) => {
  const nearestParent = getNearestParent(parents)(child);
  return relative(nearestParent, child);
};

/**
 * Curried function.Returns the relative posix path from the nearest provided parent
 * @param {string[]} parents
 * @returns {(child:string)=>string}
 */
const getRelativeFromNearestParentPosix = (parents) => (child) =>
  getRelativeFromNearestParent(parents)(child).replaceAll("\\", "/");

/**
 * reads a json file
 * @param {string} path
 * @returns {Object.<string|number, any>}
 */
const readJsonFile = (path) => JSON.parse(readFileSync(path, "utf8"));

/**
 * resolves the nearest pymakr.conf
 * @param {string} path
 * @returns {PymakrConfFile}
 */
const getNearestPymakrConfig = (path) => {
  const projectPath = getNearestPymakrProjectDir(path);
  if (projectPath) return readJsonFile(`${projectPath}/pymakr.conf`);
  else return null;
};

const getNearestPymakrProjectDir = (path) => {
  const configPath = `${path}/pymakr.conf`;
  if (existsSync(configPath)) return path;
  else {
    const parentDir = dirname(path);
    if (parentDir !== path) return getNearestPymakrProjectDir(parentDir);
    else return null;
  }
};

module.exports = {
  once,
  coerceArray,
  createTimeout,
  waitFor,
  coerceDisposable,
  getDifference,
  mapEnumsToQuickPick,
  cherryPick,
  getNearestParent,
  getRelativeFromNearestParent,
  getRelativeFromNearestParentPosix,
  getNearestPymakrConfig,
  getNearestPymakrProjectDir,
};
