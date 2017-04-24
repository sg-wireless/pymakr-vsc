'use babel';

export default class Authorize {

  constructor(pyboard){
    this.pyboard = pyboard
    this.running = false
    this.received_login_as = false
  }

  run(cb){
    var pyboard = this.pyboard
    var _this = this
    this.running = true

    if(pyboard.connection.type == 'telnet') {
      pyboard.wait_for_blocking("Login as:",function(err){
        _this.received_login_as = true
        if(err && err.message == "timeout"){
          _this._stoppedRunning()
          cb("Login timed out")

        }else{
          pyboard.send_wait_for_blocking(pyboard.params.username,"Password:",function(err,mssg){
            if(err && err.message == "timeout"){
              _this._stoppedRunning()
              cb(new Error("Username timed out"))
            }else{
              pyboard.send_wait_for_blocking(pyboard.params.password,'Login succeeded!\r\nType "help()" for more information.\r\n',function(err,mssg){
                _this._stoppedRunning()
                if(err && err.message == "timeout"){
                  cb("Password timed out")
                }else{
                  cb(null)
                }

              },7000)
            }
          },7000)
        }
      })
    }else{
      cb('Telnet connection, no login needed')
      this.running = false
    }
  }

  _stoppedRunning(){
    this.running = false
    this.received_login_as = false
  }

}
