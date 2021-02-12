const app = require('electron').app

console.log( `electron: ${process.versions.electron}, ABI: ${process.versions.modules}, platform:${process.platform}, arch: ${process.arch}`)
console.log( `[node/electron]-v${process.versions.modules}-${process.platform}-${process.arch}`)

try {
    // will seek 'upwards' to find the the serialport configured in the project above.
    require('serialport')
    console.log(`loaded serialport OK`)
    app.exit(0)

} catch (e) {
    console.error('Error loading serialport')
    console.error(e)
    app.exit(-1)
}

app.quit()
