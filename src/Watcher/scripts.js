const rmDoubleSlash = (str) => str.replace(/\/+/, "/");

const scripts = {
  importFakeMachine: () =>
    [
      'print("[dev] Importing fake_machine")',
      "import sys",
      'sys.path.append("/flash/_pymakr_dev")',
      "import fake_machine",
    ].join("\r\n"),
  checkForSysPath: (rootPath) =>
    ["import sys", `  sys.path.index('${rmDoubleSlash(rootPath + "/_pymakr_dev")}')`].join("\r\n"),
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
      "except KeyboardInterrupt: pass",
      "except Exception as e:",
      "  if(str(e) == \"no module named 'boot'\"):",
      "    print('[dev] No boot.py found. Skipped.')",
      "  else:",
      "    print('[dev] Could not import boot.py.')",
      "    raise e",

      "try:",
      "  print('[dev] Import main.py')",
      "  import main",
      "except KeyboardInterrupt: pass",
      "except Exception as e:",
      "  if(str(e) == \"no module named 'main'\"):",
      "    print('[dev] No main.py found. Skipped.')",
      "  else:",
      "    print('[dev] Could not import main.py.')",
      "    raise e",
      "",
    ]
      .filter(Boolean)
      .join("\r\n"),
};

module.exports = { scripts };
