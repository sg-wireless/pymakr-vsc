const { friendlyProxyQueueItem } = require("./blockingProxy");

const msgs = {
  download: (filesAndDirs) => ["download", filesAndDirs.map((f) => f.filename)],
  /** @param {import('./blockingProxy').BlockingProxy<import('micropython-ctl-cont').MicroPythonDevice>} adapter */
  boardInfoTimedOutErr: (adapter) =>
    `Timed out while getting board info. Call history \r\n${adapter.__proxyMeta.history
      .map(friendlyProxyQueueItem)
      .join("\r\n")}` +
    "\r\n Next item in queue: " +
    (adapter.__proxyMeta.queue[0] ? friendlyProxyQueueItem(adapter.__proxyMeta.queue[0]) : "none"),
};

module.exports = { msgs };
