const rmDoubleSlash = (str) => str.replace(/\/+/, "/");

const scripts = {
  addPymakrToPath: (rootPath) =>
    [
      "import sys",
      "try:",
      `  sys.path.index('${rmDoubleSlash(rootPath + "/_pymakr_dev")}')`,
      "except Exception as e:",
      "  if(e.args[0] == 'object not in sequence'):",
      `    sys.path.append('${rmDoubleSlash(rootPath + "/_pymakr_dev")}')`,
      "  else:",
      "    raise",
    ].join("\r\n"),
  restart: (modulesToDelete) =>
    [
      "print('')",
      modulesToDelete[1] && `print("[dev] \'${modulesToDelete[1]}\' changed. Restarting... ")`,
      "for name in sys.modules:",
      '  if(hasattr(sys.modules[name], "__file__")):',
      `    if sys.modules[name].__file__ in ${JSON.stringify(modulesToDelete)}:`,
      '      print("[dev] Clear module: " + sys.modules[name].__file__)',
      "      del sys.modules[name]",
      "try:",
      "  print('[dev] Import boot.py')",
      "  import boot",
      "except ImportError:",
      "  print('[dev] No boot.py found. Skipped.')",
      "except Exception:",
      "  print('[dev] Exception in boot.py')",
      "  raise",
      "try:",
      "  print('[dev] Import main.py')",
      "  import main",
      "except KeyboardInterrupt: pass",
      "except ImportError:",
      "  print('[dev] No main.py found. Skipped.')",
      "except Exception as e: raise e;",
      "",
    ]
      .filter(Boolean)
      .join("\r\n"),
};

module.exports = { scripts };
