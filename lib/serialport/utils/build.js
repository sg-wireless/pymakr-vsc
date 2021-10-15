const { execSync } = require('child_process')
const { resolve } = require('path')
const { rebuild } = require('electron-rebuild')
const cwd = resolve(__dirname, '../../..')

module.exports.buildFromNode = () => rebuild({
    buildPath: resolve(__dirname, '../../..'),
    electronVersion: process.versions.electron,    
})

module.exports.buildFromTerminal = () => 
    execSync(`npx electron-rebuild -v ${process.versions.electron}`, { cwd })
