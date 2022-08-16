## [2.22.4](https://github.com/pycom/pymakr-vsc/compare/v2.22.3...v2.22.4) (2022-08-02)


### Bug Fixes

* trigger release ([7ddc985](https://github.com/pycom/pymakr-vsc/commit/7ddc985bc9795a5460ca3d386be73dd0aefb480b))

## [2.22.2](https://github.com/pycom/pymakr-vsc/compare/v2.22.1...v2.22.2) (2022-08-01)


### Bug Fixes

* release new version ([4fc598d](https://github.com/pycom/pymakr-vsc/commit/4fc598d436c4678d5ef3497843ebfd7a21817cd3))

# [2.13.0](https://github.com/pycom/pymakr-vsc/compare/v2.12.3...v2.13.0) (2022-05-16)


### Bug Fixes

* flaky busy status ([5fb5411](https://github.com/pycom/pymakr-vsc/commit/5fb5411beaa9bc4b743b7b2bdb9c493af27aa9ad))


### Features

* make device properties customizable ([78dad4a](https://github.com/pycom/pymakr-vsc/commit/78dad4a4e9b2587f6ba545eb0c10f6afd4a648f9))

## [2.12.3](https://github.com/pycom/pymakr-vsc/compare/v2.12.2...v2.12.3) (2022-05-13)


### Bug Fixes

* preview channel was commited to package.json ([c611964](https://github.com/pycom/pymakr-vsc/commit/c611964637365c92a26b89e3f3e30081ef01ba9c))

## [2.12.3](https://github.com/pycom/pymakr-vsc/compare/v2.12.2...v2.12.3) (2022-05-13)


### Bug Fixes

* preview channel was commited to package.json ([c611964](https://github.com/pycom/pymakr-vsc/commit/c611964637365c92a26b89e3f3e30081ef01ba9c))

## [2.12.2](https://github.com/pycom/pymakr-vsc/compare/v2.12.1...v2.12.2) (2022-05-13)


### Bug Fixes

* busy icon was missing in projects view ([e3af48e](https://github.com/pycom/pymakr-vsc/commit/e3af48e95560958723846397efb380d62192ae6c))

## [2.12.1](https://github.com/pycom/pymakr-vsc/compare/v2.12.0...v2.12.1) (2022-05-12)


### Bug Fixes

* devices were sometimes wrongly shown as idle ([081bc83](https://github.com/pycom/pymakr-vsc/commit/081bc834401b07f209d5aee97e1ea4a1f4b5f5f8))
* replace [BUSY] text with a proper icon ([e820fa0](https://github.com/pycom/pymakr-vsc/commit/e820fa09900712231c441ff3bcde4b9fa6020d9e))

# [2.12.0](https://github.com/pycom/pymakr-vsc/compare/v2.11.0...v2.12.0) (2022-05-12)


### Bug Fixes

* better safe booting ([d4de628](https://github.com/pycom/pymakr-vsc/commit/d4de62878ec456fedd112abd4a69e1e07009f8f9))
* mounted devices were shown as busy ([90be9c9](https://github.com/pycom/pymakr-vsc/commit/90be9c94257e701c5f29ef5a04cb4ba423b30e69))


### Features

* disconnect button ([4f5a9aa](https://github.com/pycom/pymakr-vsc/commit/4f5a9aae068f6ca3f50b9e97bbafd9d893f8b650))
* sending commands to disconnected device will create temporary connection ([0478c5d](https://github.com/pycom/pymakr-vsc/commit/0478c5d8c19274677450580e62d5c207ea68f4d5))

# [2.11.0](https://github.com/pycom/pymakr-vsc/compare/v2.10.0...v2.11.0) (2022-05-06)


### Bug Fixes

* busy status and related bugs ([81664f4](https://github.com/pycom/pymakr-vsc/commit/81664f401163e98a5a03c131b59f59c50298aace))
* infinite loop in "next" subscription ([c520e3d](https://github.com/pycom/pymakr-vsc/commit/c520e3dcdb22983c2a488ba3c31f0a87638c9351))
* pymakr.conf without py_ignore would error ([6b655e2](https://github.com/pycom/pymakr-vsc/commit/6b655e2e859c058e9b82bdfe51adf77fcb52dcb1))


### Features

* custom device names ([8c5e3e7](https://github.com/pycom/pymakr-vsc/commit/8c5e3e7789a9b5c711132c6fee4b0c296f698768))

# [2.10.0](https://github.com/pycom/pymakr-vsc/compare/v2.9.0...v2.10.0) (2022-05-03)


### Bug Fixes

* hidden devices reappeared after vscode reload ([ebc3421](https://github.com/pycom/pymakr-vsc/commit/ebc3421f26e77af566146b8a756a0ea456d0c5ff))


### Features

* added walkthrough ([b2a38e2](https://github.com/pycom/pymakr-vsc/commit/b2a38e2dcbd9665293be3142227e310994b26e9c))
* project wizard includes templates & devices ([ba074ee](https://github.com/pycom/pymakr-vsc/commit/ba074ee1553dae7262ef3b6a66e14ffd1d65fa5c))
* welcome views to projects and devices views ([a89695b](https://github.com/pycom/pymakr-vsc/commit/a89695b671915e2defe67ccdd60900e593937236))

# [2.9.0](https://github.com/pycom/pymakr-vsc/compare/v2.8.7...v2.9.0) (2022-04-28)


### Bug Fixes

* close terminals when closing vscode ([fc23a1c](https://github.com/pycom/pymakr-vsc/commit/fc23a1c3962dfc323236db34f1bb9d4edef320cb))
* ctrl+e & ctrl+f keybindings ([b7cd367](https://github.com/pycom/pymakr-vsc/commit/b7cd36726d3e4ffe399a3b4f34f856085696eddf))
* listed devices didn't refresh after config update ([82da7c1](https://github.com/pycom/pymakr-vsc/commit/82da7c18ae314a9a8fde54fe84131af0fb8639e0)), closes [#221](https://github.com/pycom/pymakr-vsc/issues/221)
* pymakr.conf's ignore list could spill over ([6c974d1](https://github.com/pycom/pymakr-vsc/commit/6c974d19daad6567d15e8fec6ddedc5c537bf2f7))
* running script without a project could fail ([d9a054a](https://github.com/pycom/pymakr-vsc/commit/d9a054a96c3fb0cbf914cab81dea61b21531cb71))


### Features

* safe boot, busy tags, better connections ([22ea26e](https://github.com/pycom/pymakr-vsc/commit/22ea26e9b1877a1529ca2bc0a762c2990f8d8e12))

## [2.8.7](https://github.com/pycom/pymakr-vsc/compare/v2.8.6...v2.8.7) (2022-04-20)


### Bug Fixes

* hard reset should clear pending commands ([94940cb](https://github.com/pycom/pymakr-vsc/commit/94940cba2af5f9185d1e620129685d94bb91d0f4))
* info should log to the output tab ([4b4b8a1](https://github.com/pycom/pymakr-vsc/commit/4b4b8a1015234fe6509674193decdd7169d7d788))
* missing tab icon for orphaned views ([6d798c9](https://github.com/pycom/pymakr-vsc/commit/6d798c919771a8db9686adf04025566570d7b5b5))
* set default for supported manufacturers ([4dcaa19](https://github.com/pycom/pymakr-vsc/commit/4dcaa19ef146732211b7ebe5429e10d5bf93f4cc))
* should not be logging to src folder ([b1e031c](https://github.com/pycom/pymakr-vsc/commit/b1e031cdacfe494289bc0b9621f4b4b693c85722))
* upload didn't work without project ([493aaf8](https://github.com/pycom/pymakr-vsc/commit/493aaf87527b11e6d2eecc460dd5f65a1c2714bb))
* upload failed with empty nested folders ([82380a8](https://github.com/pycom/pymakr-vsc/commit/82380a8ebc82ab0fc17e3f9447dac8b36420ddcd))
* upload project should be sync project ([3207e12](https://github.com/pycom/pymakr-vsc/commit/3207e120159d15d461d63aa875e381738ff0dbff))

## [2.8.6](https://github.com/pycom/pymakr-vsc/compare/v2.8.5...v2.8.6) (2022-04-07)


### Bug Fixes

* "open-terminal-log" > "open terminal history" ([b962677](https://github.com/pycom/pymakr-vsc/commit/b962677343309e8d9fa9da1bda505a79439d5638))

## [2.8.5](https://github.com/pycom/pymakr-vsc/compare/v2.8.4...v2.8.5) (2022-04-04)


### Bug Fixes

* disable unused username/password config ([518c8f0](https://github.com/pycom/pymakr-vsc/commit/518c8f0109067fe2baa41e75ba3cad5348ebca36))

## [2.8.4](https://github.com/pycom/pymakr-vsc/compare/v2.8.3...v2.8.4) (2022-04-01)


### Bug Fixes

* README.md had broken link ([d6accad](https://github.com/pycom/pymakr-vsc/commit/d6accadb6735ff824c80a4cebdc775468bfd90c3))

## [2.8.3](https://github.com/pycom/pymakr-vsc/compare/v2.8.2...v2.8.3) (2022-03-31)


### Bug Fixes

* terminal didn't open ([bfc09f6](https://github.com/pycom/pymakr-vsc/commit/bfc09f626de2fd71e6dafb721e40be21108a2f1f))

## [2.8.2](https://github.com/pycom/pymakr-vsc/compare/v2.8.1...v2.8.2) (2022-03-31)


### Bug Fixes

* debug log filter ([82a8ed0](https://github.com/pycom/pymakr-vsc/commit/82a8ed0d5e53b066b1490dd426c5a708953dfbbc))
* logging errors ([28ec008](https://github.com/pycom/pymakr-vsc/commit/28ec0083f906504080a069c257bf943896035c4a))
* removed deprecated commands ([6dcec1f](https://github.com/pycom/pymakr-vsc/commit/6dcec1fadb5cd1a800a25d355ac017d18f6ebee2))
* Statemanager didn't work on Mac/Linux ([c2b69ec](https://github.com/pycom/pymakr-vsc/commit/c2b69ece4ab0eba9e151f4e9e41cad520c7c7dba))

## [2.8.1](https://github.com/pycom/pymakr-vsc/compare/v2.8.0...v2.8.1) (2022-03-28)


### Bug Fixes

* device autoConnect config ([19001de](https://github.com/pycom/pymakr-vsc/commit/19001de0abcaaa80cd33633e3d62fe5420adfe31))

# [2.8.0](https://github.com/pycom/pymakr-vsc/compare/v2.7.0...v2.8.0) (2022-03-24)


### Bug Fixes

* device file explorer required a workspace ([06c7ae7](https://github.com/pycom/pymakr-vsc/commit/06c7ae7ed8897e43fd608aa6b01402697975ef92))
* projects would linger after they were deleted ([392c7ed](https://github.com/pycom/pymakr-vsc/commit/392c7ed1e4fcad58474a85e62094f34f6cb003cf))
* reloading vscode broke filesystem providers ([566cf7f](https://github.com/pycom/pymakr-vsc/commit/566cf7f344848dc8fbf5201d86e0e3ff4ddbceda))
* set default auto connect to "lastState" ([e72b260](https://github.com/pycom/pymakr-vsc/commit/e72b260edbc51771c33fa1def73aae106ab0474f))
* titles for pymakr views when moved to new tab ([70a2c84](https://github.com/pycom/pymakr-vsc/commit/70a2c84b40b0d587a18c09a9b557cdbcad3a6427))


### Features

* create config sections ([451f2e3](https://github.com/pycom/pymakr-vsc/commit/451f2e345bc6eb82faaa8982b92185010b8808e3))
* progress bar when adding device to explorer ([19023ae](https://github.com/pycom/pymakr-vsc/commit/19023ae5090d9b153280e2e6a3c78987cce420bf))


### Performance Improvements

* better insights into blockingProxy ([2e1a781](https://github.com/pycom/pymakr-vsc/commit/2e1a7818b11094945612a0c10b82c971e902e462))

# [2.7.0](https://github.com/pycom/pymakr-vsc/compare/v2.6.0...v2.7.0) (2022-03-21)


### Bug Fixes

* create project fails if workspace is missing ([561bcb8](https://github.com/pycom/pymakr-vsc/commit/561bcb897c1cacf9749a6bc13ff232604472e6de))
* new project button showed on all explorers ([40945d4](https://github.com/pycom/pymakr-vsc/commit/40945d401701a2de6fbe3e80c1fce9efc6b3a253))


### Features

* include/exclude devices option ([3da449c](https://github.com/pycom/pymakr-vsc/commit/3da449c6cfebecfe27d047f37edcd8cffb1f0f2b))
* streamline device selection for projects ([d35f304](https://github.com/pycom/pymakr-vsc/commit/d35f3045fba876b34c90cfee7c8fddf9d6bfed7f))

# [2.6.0](https://github.com/pycom/pymakr-vsc/compare/v2.5.0...v2.6.0) (2022-03-18)


### Bug Fixes

* device autoconnect config broken ([1b6f265](https://github.com/pycom/pymakr-vsc/commit/1b6f2654b98f0572e8aff651aa4f79f2c14c5b5f))
* remove deprecated shortcut ([9a36525](https://github.com/pycom/pymakr-vsc/commit/9a36525a2e035d583dd6a5433bfe079e7b19650f))


### Features

* added prompt for shared terminals ([5a34115](https://github.com/pycom/pymakr-vsc/commit/5a34115d8febdb6901fbbaf56ec0f9afe8d9276d))

# [2.5.0](https://github.com/pycom/pymakr-vsc/compare/v2.4.0...v2.5.0) (2022-03-17)


### Features

* added ignore option for upload ([e61dd1b](https://github.com/pycom/pymakr-vsc/commit/e61dd1be30443dc4fd8fddb8a48e3c5be51362d7))

# [2.4.0](https://github.com/pycom/pymakr-vsc/compare/v2.3.0...v2.4.0) (2022-03-15)


### Bug Fixes

* disable statusBar ([3751311](https://github.com/pycom/pymakr-vsc/commit/3751311a5b3b40534fbeccb039a798f8b4157caa))


### Features

* better project wizard ([0c0cba2](https://github.com/pycom/pymakr-vsc/commit/0c0cba22485119d0ca1efa3b64099b250bc2b0e5))

# [2.3.0](https://github.com/pycom/pymakr-vsc/compare/v2.2.0...v2.3.0) (2022-03-14)


### Features

* device selector for run script ([ab89dcb](https://github.com/pycom/pymakr-vsc/commit/ab89dcba6ddc047d8e5e89303249321bdbc014f4))
* support upload to multiple devices ([84c9301](https://github.com/pycom/pymakr-vsc/commit/84c93018fbb704524fa739d9654b6fc29ba6be39))

# [2.2.0](https://github.com/pycom/pymakr-vsc/compare/v2.1.3...v2.2.0) (2022-03-11)


### Bug Fixes

* create project didn't always open explorer ([beddcd5](https://github.com/pycom/pymakr-vsc/commit/beddcd5744b1f77b45ac1f157ec2f4730756ed50))
* group device menu entries ([c03e010](https://github.com/pycom/pymakr-vsc/commit/c03e010315ef81afd4d98811c526592614b83f08))


### Features

* erase and provision device ([bace03d](https://github.com/pycom/pymakr-vsc/commit/bace03d754e015a5336da78458896a3e1d7da66b))
* soft and hard reset in device menu ([d400327](https://github.com/pycom/pymakr-vsc/commit/d4003274c7453ae92bdd4fb3b4a5d9d96c27e917))

## [2.1.3](https://github.com/pycom/pymakr-vsc/compare/v2.1.2...v2.1.3) (2022-03-10)


### Bug Fixes

* patch changelog with pre 2.1.2 entries ([07b1027](https://github.com/pycom/pymakr-vsc/commit/07b1027138a0f104faba9d27963048fa31ae2908))

## [2.1.2](https://github.com/pycom/pymakr-vsc/compare/v2.1.1...v2.1.2) (2022-03-10)

### Bug Fixes

- "git" was missing from release field ([e33d31d](https://github.com/pycom/pymakr-vsc/commit/e33d31db3f65186a40e71a215d076e45331db128))

## [2.1.1](https://github.com/pycom/pymakr-vsc/compare/v2.1.0...v2.1.1) (2022-03-10)

### Bug Fixes

- include changelogs ([976624f](https://github.com/pycom/pymakr-vsc/commit/976624ff6513f408e66841811fab5504c6408db8))

# [2.1.0](https://github.com/pycom/pymakr-vsc/compare/v2.0.3...v2.1.0) (2022-03-10)

### Bug Fixes

- connect should retry ([b8f62fa](https://github.com/pycom/pymakr-vsc/commit/b8f62fa691f29d4ad67eda606ad1158f72dca54e))
- could disconnect disconnected devices ([dba65f9](https://github.com/pycom/pymakr-vsc/commit/dba65f96144950b8770402a3669d08ae72a76141))
- couldn't disconnect device with active script ([ff4b958](https://github.com/pycom/pymakr-vsc/commit/ff4b958e4830170ae9fcf2debeee1e500d3426ca))
- new device menu was showing under projects ([f7342f4](https://github.com/pycom/pymakr-vsc/commit/f7342f4c4f0a0037cca478d26bef509c7c67dfb5))

### Features

- small project wizard ([c1d4f15](https://github.com/pycom/pymakr-vsc/commit/c1d4f15e26cdfdf33939ad456809b3755f30b564))

## [2.0.3](https://github.com/pycom/pymakr-vsc/compare/v2.0.2...v2.0.3) (2022-03-09)

### Bug Fixes

- plugin could crash without an active project ([2a05f3c](https://github.com/pycom/pymakr-vsc/commit/2a05f3c6b929e6d01c1f78d7d78db82497b9cf76))

## [2.0.2](https://github.com/pycom/pymakr-vsc/compare/v2.0.1...v2.0.2) (2022-03-08)


### Bug Fixes

* broken images ([1113fc8](https://github.com/pycom/pymakr-vsc/commit/1113fc863086d05f3beeb0153d8abda394cea308))



## [2.0.1](https://github.com/pycom/pymakr-vsc/compare/v2.0.0...v2.0.1) (2022-03-07)


### Bug Fixes

* readme disclaimer ([8dc41d1](https://github.com/pycom/pymakr-vsc/commit/8dc41d15f1287473665b131d15e0651c19f4efc6))

# [2.0.0](https://github.com/pycom/pymakr-vsc/releases/tag/v2.0.0)

### Initial release
