const { resolve } = require("path");
const { download } = require("prebuild-install");
const util = require("prebuild-install/util");
const pkg = require("../../../node_modules/@serialport/bindings/package.json");


const downloadPrebuild = async () =>
  new Promise(async (_resolve, reject) => {
    try {
      const _pathBak = resolve();

      // rc has self executing scripts that use the CWD, so we need to change dir first
      process.chdir(resolve(__dirname, "../../../node_modules/@serialport/bindings"));

      const rc = require("prebuild-install/rc");

      const opts = rc({ config: { runtime: "electron" } });

      opts.pkg = pkg;
      opts.nolocal = true;

      const url = util.getDownloadUrl(opts);

      download(url, opts, (err) => {
        if (err) {
          console.error(err);
          throw err;
        }
        process.chdir(_pathBak); // restore initial CWD
        _resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

module.exports = { downloadPrebuild };
