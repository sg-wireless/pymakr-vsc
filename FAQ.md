# FAQ

### Pymakr says it can't access my device

Please make sure that your device is not open in another program. If you have multiple instances of VSCode open, make sure only one is accessing the device at a time.

### My device doesn't have enough memory

This can be solved by updating `chunkSize` and `chunkDelay` In settings under `pymakr > devices > configs`. `chunkSize: 256` has been reported to be a good starting point for some devices. In some cases you may also need to set `chunkDelay`.

### I accidentally saved a notification choice or clicked "Don't ask again"

You can undo past notification choices in settings under `pymakr > Misc > Notifications`.

### My device is unresponsive

There are a few ways to recover an unresponsive device.

- <kbd>Ctrl + c</kbd> in terminal. Breaks the current script.
- <kbd>Ctrl + f</kbd> in terminal. Hard resets device and enters safe boot.
- `Stop script` or `Safe boot device` from the device context menu
- Use the physical reset button on the device
- If all else fails, you can reset/erase your Pycom device with `Pycom Firmware Update`. If you have a faulty `boot.py` or `main.py` script, you can solve this by checking the box `Erase during update`.

### Do I need Node?

Node shouldn't be required, but there have been reports of issues being solved after installing Node.

### What is Pymakr - Preview

Pymakr Preview is the prerelease branch of Pymakr. Features and bugfixes that pass integration tests, but could require further feedback, are released to Pymakr Preview first. If there are no issues or proposals, Pymakr Preview will then be merged into Pymakr.

### Can I change my version of Pymakr

Yes, to install a specific version, go to the extensions tab, click the cogwheel next to `Pymakr` and select `Install Another Version`.

### I have an issue that's not described here

Please open an issue on our [Github repo](https://github.com/pycom/pymakr-vsc). We usually respond within 24 hours.

To get support for a specific device, please open the context menu (...) of the device. Then click `Debug` -> `Show device summary` -> `Create an issue on Github`.
