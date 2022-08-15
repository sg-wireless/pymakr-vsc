const vscode = require("vscode");

/** @implements {vscode.WebviewViewProvider} */
class HomeProvider {
  /** @param {PyMakr} pymakr */
  constructor(pymakr) {
    this.pymakr = pymakr;
  }

  toolkitUri(webviewView) {
    const toolkitPath = ["node_modules", "@vscode", "webview-ui-toolkit", "dist", "toolkit.js"];
    const localPath = vscode.Uri.joinPath(this.pymakr.context.extensionUri, ...toolkitPath);
    return webviewView.webview.asWebviewUri(localPath);
  }

  /**
   * @param {vscode.WebviewView} webviewView
   * @param {vscode.WebviewViewResolveContext} context
   * @param {vscode.CancellationToken} _token
   */
  resolveWebviewView(webviewView, context, _token) {
    const toolkitUri = this.toolkitUri(webviewView);
    const releaseNotes = ["RELEASE_NOTES_2.22.x.md", "RELEASE_NOTES_2.24.x.md"].map((path) => ({
      name: path,
      url: "command:pymakr.showMarkdownDocument?" + encodeURIComponent(JSON.stringify([path])),
    }));

    webviewView.webview.onDidReceiveMessage((message) => {
      vscode.commands.executeCommand(message.command, message.args);
    });

    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };
    webviewView.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <script>
            const vscode = acquireVsCodeApi()
            const openDoc = path => vscode.postMessage({ command: 'pymakr.showMarkdownDocument', args: path })
            const focusExplorer = () => vscode.postMessage({ command: 'pymakr-projects-tree.focus' })
            const openWalkthrough = () => vscode.postMessage({ command: 'pymakr.openWalkthrough' })
            const openSettings = () => vscode.postMessage({ command: 'workbench.action.openSettings', args: 'pymakr' });
        </script>
    </head>
    
    <body>
        <h1>Pymakr</h1>
        <h4>Interact with your Pycom devices. </h4>
        <p>
            For project management, please see
            <vscode-link onclick="focusExplorer()">
                <strong>PROJECTS</strong>
            </vscode-link>
            In the
            <strong>Explorer</strong>
            view.
        </p>
    
        <br />
    
        <h2>Quick Access</h2>
        <p>
            Shortcuts to the less obvious parts of Pymakr.
        </p>
    
        <p>
          <vscode-button onclick="openWalkthrough()">Interactive walkthrough</vscode-button>
          <vscode-button onclick="openSettings()">Settings</vscode-button>
        </p>
    
        <br />
    
        <h2>Docs</h2>
        <p>
        Documentation to get you started with Pymakr.
        </p>
        
        <p>
          <vscode-button onclick="openDoc('GET_STARTED.md')">Getting Started</vscode-button>
          <vscode-button onclick="openDoc('FAQ.md')">FAQ</vscode-button>
        </p>
    
        <br />
    
        <h2>Support</h2>
        <p>
            To get help, please refer to the FAQ or open an issue on
            <vscode-link a href="https://github.com/pycom/pymakr-vsc/issues">
                Github
            </vscode-link>.
            To get support for a specific device, please open the context menu (...) of the device. Then click
            <code>Debug</code> -> <code>Show device summary</code> -> <code>Create an issue on Github</code>.
        </p>
    
        <br />

        <h2>Release Notes</h2>
        <p>
            ${releaseNotes.map((link) => `<vscode-link href="${link.url}">${link.name}</vscode-link>`)}
        </p>
    
    </body>
    
    </html>
      `;
  }
}

module.exports = { HomeProvider };
