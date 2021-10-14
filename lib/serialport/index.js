var vscode = require('vscode');
const { build } = require('./utils/build');
const { downloadPrebuild } = require('./utils/download-prebuild');
const { log } = require('./utils/log');
const { removeBindings } = require('./utils/remove');


/** 
 * Solutions to try for getting working bindings
 * @type {[string, function][]}
 **/
const solutions = [
    ['download bindings', downloadPrebuild],
    ['build bindings', build],
]

// import serialport, if it fails, try the next solution, rinse repeat.
async function prepareSerialPort() {
    while (true) {
        // check if we can import serialport
        try {
            log.log('import module...')
            delete require.cache[require.resolve('serialport')];
            require("serialport");
            log.log('import module... success')
            break;
        }
        // if not, try a solution
        catch (err) {
            log.log('import module... failed', err.message)

            if (!solutions.length) {
                vscode.window.showErrorMessage(
                    "There was an error with your serialport module, Pymakr will likely not work properly. Please try to install again or report an issue on our github (see developer console for details)"
                )
                throw new Error('All solutions failed for serialport')
            }

            log.log('remove old bindings...')
            const rmErr = await removeBindings()
            if (rmErr)
                log.log('remove old bindings... failed, reason:', rmErr)


            const [msg, callback] = solutions.shift()
            log.log(msg + '...')
            try {
                await callback()
                log.log(msg + '... success')
            } catch (err) {
                log.error(msg + ' failed', err)
            }
        }
    }
}

module.exports = { prepareSerialPort }