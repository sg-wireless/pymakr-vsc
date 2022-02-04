const msgs = {
  download: (filesAndDirs) => ["download", filesAndDirs.map((f) => f.filename)],
};

module.exports = { msgs };
