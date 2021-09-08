const { execSync } = require("child_process");
const _module = require("module");
const { resolve } = require("path");

const RE = /module version mismatch|try re-compiling|was compiled against a different Node.js version using/;

const  electronModulePatcher = () => {
  console.log('[pymakr] patching module._load')
  const load = _module._load.bind(_module);
  _module._load = function (request, parent) {
    try {      
      return load(request, parent);
    } catch (err) {
      if (!err.message.match(RE))       
          throw err
      
      console.log('[pymakr] building binaries for' + request)
      execSync(`npx electron-rebuild -v ${process.versions.electron}`, {cwd: resolve(__dirname, '../..')})
      return load(request, parent);
    }
  };
}

module.exports = { electronModulePatcher };
