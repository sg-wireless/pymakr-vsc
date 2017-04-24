'use babel';

export default class Config {
  static constants(){
    return {
      logging_level: 4, // 4 = error. anything higher than 5 = off. see logger.js
      max_sync_size: 350000,
      error_messages: {
        "EHOSTDOWN": "Host down",
        "EHOSTUNREACH": "Host unreachable",
        "ECONNREFUSED": "Connection refused",
        "ECONNRESET":" Connection was reset",
        "EPIPE": "Broken pipe",
      }
    }
  }
}
