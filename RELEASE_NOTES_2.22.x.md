# Release notes for Pymakr v2.22.x

It's been a long time coming and we're delighted to finally announce the next release of our Pymakr 2. We've packed this release with tons of new features and bugfixes to make Pymakr 2 even faster, easier and more reliable than ever.

We aim to make your experience with Pymakr as pleasant as possible Should you have any problems with our new release, please [open an issue](https://github.com/pycom/pymakr-vsc/issues/new/choose) on Github so that we can help.

# <br>

## Feature Highlights

[Get Started Guide](#get-started-guide)

[Developer Mode](#developer-mode)

[Device Configuration](#device-configuration)

[Better Notifications](#better-notifications)

[Device Hover](#device-hover)

[Open File on Device](#open-file-on-device)

# <br>

## Get Started Guide

We've added a small walkthrough. To open it:

1. Click `ctrl/cmd + shift + p`
2. Type `walkthrough`
3. Select `Get Started: Open Walkthrough...` will show a list of walkthroughs.
4. Click `Pymakr 2 - Getting Started`.

# <br>

## Developer Mode

Dev mode keeps your connected devices running and synchronized to your project folder in realtime.

In dev mode, whenever a file in a project is saved, the changes are synced to the project's devices and the devices then restarted.

Clicking the upload button while in dev mode will stop the current running script and upload files that are different from those on the device. Kinda like patching. This is different from the regular upload functionality, which erases all content on the device before uploading the entire project.

_Note: Dev mode is limited to to the capabilities of the connected devices. Eg. it's not possible for Pymakr to communicate with a device in `machine.deepsleep` since the device's USB is disabled in this state. (A workaround for this may be possible - see `dev.simulateDeepSleep` in `pymakr.conf`)_

# <br>

## Device Configuration

It's now possible to configure individual devices in `settings->pymakr->devices->configs`. Here you can customize settings like `device.rootPath` and `device.adapterOptions` in case your device doesn't work with the defaults / auto detected values.

# <br>

## Better Notifications

We've added more notifications to help explain the different events and actions in Pymakr.
Power users who are ready to kick the support wheels can click `Don't show again` or save their choices when a popup is no longer wanted.

_Popup choices can be undone in `Settings->Pymakr->Misc->Notifications_

# <br>

## Device hover

Hovering over a device now shows information about the device.

# <br>

## Open File on Device

Right clicking a project file and selecting `Pymakr->Open file on device` will open the corresponding file on the device. Here you can verify the content and save changes as required.
