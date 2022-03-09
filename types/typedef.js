/**
 * @typedef {import('../src/PyMakr').PyMakr} PyMakr
 * @typedef {import('vscode')} vscode
 */

/**
 * @typedef {Object} Config
 */

/**
 * @typedef {Object} DeviceInput
 * @prop {string} name
 * @prop {'serial'|'telnet'} protocol
 * @prop {string} address
 * @prop {string=} username
 * @prop {string=} password
 * @prop {string=} id if not specified, "<protocol>://<address>" will be used
 * @prop {any=} raw
 */

/**
 * @typedef {Object} ProtocolAndAddress
 * @prop {string} protocol
 * @prop {string} address
 */
