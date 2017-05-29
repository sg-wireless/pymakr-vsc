'use babel';

var fs = require('fs');

var SerialPort = null
// try {
// SerialPort = require("serialport");
// } catch (e) {
//   // include the precompiled version of serialport
//   var precompiles = {'win32': 'win', 'darwin': 'osx', 'linux': 'linux', 'aix': 'linux'}
//   if(process.platform in precompiles) { // always returns win32 on windows, even on 64bit
//     SerialPort = require("../../precompiles/serialport-" + precompiles[process.platform] + "/lib/serialport");
//   }else{ // when platform returns sunos, openbsd or freebsd (or 'android' in some experimental software)
//     throw e;
//   }
// }

export default class PySerial {

  constructor(params){
    this.type = "serial"
    this.params = params
    this.stream = new SerialPort(this.params.host, {
      baudRate: 115200,
      autoOpen: false
    },function(err){
      // not implemented
    });
  }

  list(cb){
    this.stream.list(function(ports){
      // TODO: implement returning list of comport names
    })
  }

  connect(onconnect,onerror,ontimeout){

    var _this = this
    var error_thrown = false

    // open errors will be emitted as an error event
    this.stream.on('error', function(err) {

      if(!error_thrown){
        error_thrown = true
        onerror(new Error(err))
      }

    })
    var timeout = null
    this.stream.open(function(){
      _this.send('\r\n',function(){
          clearTimeout(timeout)
          onconnect()
      })
      timeout = setTimeout(function(){
        ontimeout(new Error("Timeout while connecting"))
        _this.disconnect()
      },_this.params.timeout)
    })
  }

  disconnect(){
    this.stream.close()
  }

  registerListener(cb){
    var _this = this
    this.onmessage = cb
    this.stream.on('data',function(data){
      data = data.toString()
      _this.onmessage(data)
    })
  }

  send(mssg,cb){
    var data = new Buffer(mssg,"binary")
    this.send_raw(data,cb)
  }

  send_raw(data,cb){
    var _this = this
    this.stream.write(data,function(){
      if(cb){
        _this.stream.drain(cb)
      }
    })
  }

  send_cmd(cmd,cb){
    var mssg = '\x1b\x1b' + cmd
    data = new Buffer(mssg,"binary")
    this.send_raw(data,function(){
      // setTimeout(cb,400)
      cb()
    })
  }

  static isSerialPort(name,cb){
    if(name && (name.substr(0,3) == 'COM' || name.indexOf('tty') > -1 || name.indexOf('/dev') > -1)){
      cb(true);
    }else{
      fs.access(name,fs.constants.F_OK,function(err){
        if(err == true){
          cb(true)
        }else{
          cb(false)
        }
      })
    }
  }

  sendPing(){

  }

  flush(cb){
    this.stream.flush(cb)
  }
}
