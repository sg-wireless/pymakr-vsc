/**
 * @typedef {Object} Listener
 * @prop {string|RegExp} match
 * @prop {(matches:RegExpMatchArray)=>void} cb
 * @prop {Object} options
 * @prop {Boolean=} options.callOnFalse
 * @prop {Number=} options.length
 */

/**
 * Creates a readUntil function that calls a provided callback whenever a provided string matches the current stream
 */
const createReadUntil = () => {
  /** @type {Listener[]} */
  const listeners = [];
  let concatenatedData = "";

  let wantedDataLength = 1;

  /** @param {Listener} listener */
  const getLengthFromListener = (listener) => listener.options.length || listener.match.toString().length;
  const getMaxWantedDataLength = (listeners) => Math.max(...listeners.map(getLengthFromListener));
  const getLastLineLength = (str) => str.length - Math.max(str.lastIndexOf("\n"), 0);

  /**
   * calls the callback whenever the match matches the end of the current stream
   * @param {Listener['match']} match
   * @param {Listener['cb']} cb
   * @param {Listener['options']} options
   */
  const readUntil = (match, cb, options = {}) => {
    const listener = { match, cb, options };
    listeners.push(listener);
    wantedDataLength = getMaxWantedDataLength(listeners);
    const unsub = () => {
      listeners.splice(listeners.indexOf(listener), 1);
      wantedDataLength = getMaxWantedDataLength(listeners);
    };
    return unsub;
  };
  
  /**
   * push data to the stream
   * @param {string} data 
   */
  readUntil.push = (data) => {
    concatenatedData += data;
    const chuckSize = Math.max(getLastLineLength(concatenatedData), wantedDataLength);
    concatenatedData = concatenatedData.slice(-chuckSize);
    listeners.forEach((listener) => {
      const result = concatenatedData.match(listener.match);
      if (result || listener.options.callOnFalse) listener.cb(result);
    });
  };

  Object.defineProperties(readUntil, {
    concatenatedData: { get: () => concatenatedData },
    wantedDataLength: { get: () => wantedDataLength },
    listeners: { value: listeners },
    getMaxWantedDataLength: { value: getMaxWantedDataLength },
  });

  return readUntil;
};

module.exports = { createReadUntil };
