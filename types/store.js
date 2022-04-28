/**
 * @typedef {function():void} Unsubscribe
 */

/**
 * @template T
 * @namespace Store
 * @typedef {object} Writable
 * @prop {function():T} get Returns the current store value
 * @prop {function(T):void} set Set the store value
 * @prop {function(function(T):T):void} update Update the store value
 * @prop {function(function(T):void):Unsubscribe} subscribe Subscribe to the store value
 * @prop {function(function(T):void):void} next Subscribe to the store value for a single update
 */

/**
 * @template T
 * @typedef {object} Readable
 * @prop {function():T} get
 * @prop {function(function(T):void):Unsubscribe} subscribe Subscribe to the store value
 * @prop {function(function(T):void):void} next to the store value for a single update
 */

/**
 * @template T
 * @typedef {Object} storeOptions
 * @prop {boolean} lazy only call listeners if value has changed
 * @prop {function(Writable<T>):void} onSub called when a listener subscribes
 * @prop {function(Writable<T>):void} onUnsub called when a listener unsubscribes
 * @prop {function(Writable<T>):void} onFirstSub called when the first listener subscribes
 * @prop {function(Writable<T>):void} onLastUnsub Called when the last listener unsubscribes
 */

/**
 * @template T
 * @typedef { T extends Readable<infer U> ? U : never } StoreValue
 */

/**
 * @template T
 * @typedef {{ [K in keyof T]: T[K] extends Readable<infer U> ? U : never }} StoreValues
 */