var vscode = require('vscode');
var path = require('path');
var os = require('os');
var homeDir = os.homedir();

export default class Utils{
        
    // runs a worker recursively untill a task is Done
    // worker should take 2 params: value and a continuation callback
        // continuation callback takes 2 params: error and the processed value
    // calls 'end' whenever the processed_value comes back empty/null or when an error is thrown
    doRecursively(value,worker,end){
        var _this = this
        worker(value,function(err,value_processed,done){

            if(err){
                end(err)
            }else if(done){
                end(value_processed)
            }else{
                _this.doRecursively(value_processed,worker,end)
            }
        })
    }

    parse_error(content){
        err_index = content.indexOf("OSError:")
        if(err_index > -1){
            return Error(content.slice(err_index,content.length-2))
        }else{
            return null
        }
    }

    _was_file_not_existing(exception){
        var error_list = ['ENOENT', 'ENODEV', 'EINVAL', 'OSError:']
        var stre = exception.message
        for(var i=0;i<error_list.length;i++){
            if(stre.indexOf(error_list[i]) > -1){
            return true
            }
        }
        return false
    }

    int_16(int){
        var b = new Buffer(2)
        b.writeUInt16BE(int)
        return b
    }

    int_32(int){
        var b = new Buffer(4)
        b.writeUInt32BE(int)
        return b
    }
    static getConfigPath(filename){
        var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? Utils.joinPath(homeDir, '.config') : '/var/local');
        if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
        return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
    }

    static joinPath(){        
        var p = "";
        for(var i=0; i<arguments.length; i++){
            p = path.join(p, arguments[i]);
        }
        return Utils.normalize(p);
    }

    static normalize(p){
        return path.normalize(p).replace(/\\/g, '/')
    }
}
