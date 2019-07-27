var nodeabi = require('node-abi')
const https = require('https');

// get cmdline 
var myArgs = process.argv.slice(2);
var abiVersion
if (myArgs.length > 0 ){
    abiVersion = nodeabi.getAbi(myArgs[0],'electron')
} else {
    //just use a somewhat sensible default
    abiVersion = nodeabi.getAbi('4.2.5','electron')
} 
 
//supported - electron only 
var relevant
relevant = nodeabi.supportedTargets.filter(function(e, i) {
    return e.runtime == "electron"
})
// sort on abi 
relevant = relevant.sort(function(a,b){
    return a.abi - b.abi
})
// find the current ABI 
var index
index = relevant.findIndex(function(e) {
    return e.abi == abiVersion && e.runtime == "electron"
})

// previous 
//if(index >= 1 && index < relevant.length )
//   console.log( relevant[index - 1])

   // current 
// if(index != -1  )
//    console.log( relevant[index])

// next likely 
if(index >= 0 && index < relevant.length - 1)
   console.log( relevant[index + 1].abi)


