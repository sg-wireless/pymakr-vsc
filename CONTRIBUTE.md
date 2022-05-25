# Contributing to Pymakr VSC

Thank you for reading this document. We hope it will aid you in creating one or more PRs.

#### Requirements

- `VSCode`, 
- `NodeJS` - LTS version 16.14.2, 14.19.1 or later

_Hint: For `Node`, we recommend using a version manager like `volta` or `nvm`_
  - [volta](https://docs.volta.sh/guide/getting-started) 
  - [nvm for windows](https://github.com/coreybutler/nvm-windows#readme)
  - [nvm for linux](https://github.com/nvm-sh/nvm#readme)
  - [NodeJS.org](https://nodejs.org/en/download/)
## Language used in this project
The plugin is written in JavaScript with Type Hints via JSDoc.

Due to this it is not needed (or possible) to use a TypeScript compiler to transpile the code before running as it's already Javascript. 
Typescript is only used to validate the types an by typedoc when generating the API docs.
In this project `tsc` should vever be run , and the outDir in tsconfig.json is specified only to avoid distracting errors from the TypeScript compiler.

Refs: 
- https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html
- https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
## Setup

To work on Pymakr VSC, we first need to clone the repo and install its dependencies.

1. Clone project

   ```
   git clone https://github.com/pycom/pymakr-vsc --branch next
   ```

2. Install dependencies
   ```
   cd pymakr-vsc
   npm install
   ```

---

## Running the extension

To run the extension, we need to open the project in VSCode and run the source code in debug mode.

1. Open the repo in VSCode

   _Hint: We can do this directly from the terminal by typing `code .`_

2. Run/Debug the extension

   Click `Run and Debug` _(Ctrl+Shift+D)_ -> `Run Pymakr`

   <img src="./media/contribute/run-extension.gif">

   _Hint: We can also start the task with <kbd>F5</kbd>. This shortcut always starts the last run task._

---

## Testing the extension
Hardware requirements: 
- The integration tests expect two MicroPython devices to be connected to the computer using a USB cable / serial port connection.

Tests can be run directly from the terminal by typing 
- `npm run test:types`, to test type safety.
- `npm run test:unit`, to run the unit tests.
- `npm run test:integration`, to run the integration tests.
- `npm run test`, to run all tests.

To develop or debug tests use the same way to run/debug the extension. Instead of clicking Run PyMakr, we click the dropdown arrow and choose `Integration Tests` or `Unit Tests`.

_Hint: <kbd>F5</kbd> can be used to start the last executed task._

---

## File structure

| Path             | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **example**      | Example projects (may be deleted for a templating approach)                                           |
| **media**        | Media assets                                                                                          |
| **node_modules** | _Node dependencies. Fully managed by `npm`._                                                          |
| **src**          | _Source files. See [API.md](https://github.com/pycom/pymakr-vsc/blob/next/docs/index.html) for info._ |
| **templates**    | Templates used for erasing device / creating new projects                                             |
| **test**         | Integration tests                                                                                     |
| **types**        | Types used for auto completion                                                                        |

---

## Create a local package [Optional]

You may want to simply package the extension for testing on multiple systems without publishing them to the store. 
Extensions will always be packaged into a .vsix file. 
Here's how:
  `vsce package` 

This will package your extension into a .vsix file and place it in the current directory. It's possible to install .vsix files into Visual Studio Code. See [Installing Extensions](https://vscode-docs.readthedocs.io/docs/extensions/install-extension.md) for more details.

ref: https://vscode-docs.readthedocs.io/en/latest/tools/vscecli/

## Submitting a PR

Please submit PRs to the `next-staging` branch.

We encourage commit messages to follow [Angular's Commit Message Format](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format). Eg. `fix: some bug`, `feat: some new feature` etc.

## API

For API documentation, please see [Pymakr API](https://htmlpreview.github.io/?https://raw.githubusercontent.com/pycom/pymakr-vsc/next/docs/classes/PyMakr.html).

## Release flow
<img src="./media/contribute/release-flow.png">