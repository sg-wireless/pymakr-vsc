var vscode = require('vscode');
var path = require('path');
var os = require('os');
var homeDir = os.homedir();

export default class Utils{
    
    static getConfigPath(filename){
        console.log("Getting config path")
        var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? joinPath(homeDir, '.config') : '/var/local');
        console.log(folder)
        if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
        console.log(folder)
        return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
    }

    static joinPath(){        
        var p = "";
        for(var i=0; i<arguments.length; i++){
            p = path.join(p, arguments[i]);
        }
        console.log(p)
        return Utils.normalize(p);
    }

    static normalize(p){
        console.log(path)
        console.log(path.normalize(p).replace(/\\/g, '/'))
        return path.normalize(p)
    }
}
