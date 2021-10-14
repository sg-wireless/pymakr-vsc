const { execSync } = require('child_process')
const { resolve } = require('path')
const cwd = resolve(__dirname, '../../..')

module.exports.build = () =>
    execSync(`npx electron-rebuild -v ${process.versions.electron}`, { cwd })
