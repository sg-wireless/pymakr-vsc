'use babel';

export default class Config {
  static constants(){
    return {
      logging_level: 6, // 4 = error. anything higher than 5 = off. see logger.js
      max_sync_size: 350000,
      error_messages: {
        "EHOSTDOWN": "Host down",
        "EHOSTUNREACH": "Host unreachable",
        "ECONNREFUSED": "Connection refused",
        "ECONNRESET":" Connection was reset",
        "EPIPE": "Broken pipe",
      },
      term_rows: {default: 11,max: 25, min: 1}
    }
  }
  static settings(){
    return {
      address: {
          type: 'string',
          default: '/dev/cu.usbserial-DQ0058DW',
          title: 'Device address',
          description: 'Either connect through USB serial using a comport (for example /dev/cu.usbserial-DQ00573Z) or an IP address for a telnet connection. Username and password are not needed for serial connections.',
          order: 1
      },
      username: {
          type: 'string',
          default: 'micro',
          title: 'User name',
          order: 2
      },
      password: {
          type: 'string',
          default: 'python',
          title: 'Password',
          order: 3
      },
      ctrl_c_on_connect: {
          type: 'boolean',
          default: false,
          title: 'Ctrl-c on connect',
          description: 'Stops all running programs when connecting to the board',
          order: 4
      },
      sync_folder: {
          type: 'string',
          default: "",
          title: 'Sync Folder',
          description: 'This folder will be uploaded to the pyboard when using the sync button. Leave empty to sync the complete project. (only allows folders within the project)',
          order: 5
      },
      sync_file_types: {
          type: 'string',
          default: "py,txt,log,json,xml",
          title: 'Sync file types',
          description: 'All types of files that will be synced to the board, seperated by comma. All other filetypes will be ignored during a sync action',
          order: 6
      },
    }
  }
}

// other error codes that possibly need intergration
// EINTR Interrupted system
// EIO I/O error
// EFAULT Bad address
// EBUSY Mount device busy
// ENODEV No such device
// ENOTTY Not a typewriter
// EPIPE Broken pipe
// EALREADY Operation already in progress
// ETIMEDOUT Connection timed out
// ECONNREFUSED Connection refused
// ECONNRESET Connection reset by peer
// EISCONN Socket is already connected
// ECOMM Communication error
// EIBMCONFLICT Conflicting call already outstanding on socket
