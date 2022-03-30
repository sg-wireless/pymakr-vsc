# Contributing to Pymakr VSC

Thank you for reading this document. We hope it will aid you in creating one or more PRs.

#### Requirements

- `VSCode`
- `Node`

_Hint: For `Node`, we recommend using a version manager like `volta` or `nvm`_

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

2. Run the extension

   Click `Run and Debug` _(Ctrl+Shift+D)_ -> `Run Pymakr`

   <img src="./media/contribute/run-extension.gif">

   _Hint: We can also start the task with <kbd>F5</kbd>. This shortcut always starts the last run task._

---

## Testing the extension

Testing is done in the same way we run the extension. Instead of clicking Run PyMakr, we click the dropdown arrow and choose `Integration Tests` or `Unit Tests`.

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

## API

For API documentation, please see [Pymakr API](https://htmlpreview.github.io/?https://raw.githubusercontent.com/pycom/pymakr-vsc/next/docs/classes/PyMakr.html).
