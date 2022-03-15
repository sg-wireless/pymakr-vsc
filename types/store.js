/**
 * @typedef {function():void} Unsubscribe
 */

/**
 * @template T
 * @namespace Store
 * @typedef {object} Writable
 * @prop {function():T} get
 * @prop {function(T):void} set
 * @prop {function(function(T):T):void} update
 * @prop {function(function(T):void):Unsubscribe} subscribe
 * @prop {function(function(T):void):void} next
 */

/**
 * @template T
 * @typedef {object} Readable
 * @prop {function():T} get
 * @prop {function(function(T):void):Unsubscribe} subscribe
 * @prop {function(function(T):void):void} next
 */

/**
 * @template T
 * @typedef {Object} storeOptions
 * @prop {function(Writable<T>):void} onSub
 * @prop {function(Writable<T>):void} onUnsub
 * @prop {function(Writable<T>):void} onFirstSub
 * @prop {function(Writable<T>):void} onLastUnsub
 */

/**
 * @template T
 * @typedef { T extends Readable<infer U> ? U : never } StoreValue
 */

/**
 * @template T
 * @typedef {{ [K in keyof T]: T[K] extends Readable<infer U> ? U : never }} StoreValues
 */