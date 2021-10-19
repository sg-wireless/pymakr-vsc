const { rm, rmdir } = require('fs')
const { resolve } = require('path')
const bindingsPath = resolve(__dirname, '../../../node_modules/@serialport/bindings/build')

const removeBindings = () => new Promise((res) =>
    rmdir(bindingsPath, { force: true, recursive: true }, res)
)

module.exports = { removeBindings }