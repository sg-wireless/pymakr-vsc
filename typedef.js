/**
 * @typedef { Object } PymakrConfig
 * @prop {string} address Either connect through USB serial using a comport, or an IP address for a telnet connection. Username and password are not needed for serial connections.
 * @prop {boolean} auto_connect: Ignores any \'device address\' setting and automatically connects to the top item in the serialport list
 * @prop {string} username
 * @prop {string} password
 * @prop {string} sync_folder This folder will be uploaded to the pyboard when using the sync button. Leave empty to sync the complete project. (only allows folders within the project). Use a path relative to the project you opened in atom, without leading or trailing slash
 * @prop {boolean} sync_all_file_types If enabled, all files will be uploaded no matter the file type. The list of file types below will be ignored
 * @prop {boolean} sync_file_types All types of files that will be uploaded to the board, seperated by comma. All other filetypes will be ignored during an upload (or download) action
 * @prop {boolean} ctrl_c_on_connect Stops all running programs when connecting to the board
 * @prop {boolean} open_on_start Automatically open the pymakr console and connect to the board after starting Atom
 * @prop {boolean} safe_boot_on_upload [Only works with firmware v1.16.0.b1 and up.] Safe boots the board before uploading to prevent running out of memory while uploading. Especially useful on older boards with less memory, but adds about 2 seconds to the upload procedure
 * @prop {boolean} reboot_after_upload Reboots your pycom board after any upload or download action
 * @prop {boolean} fast_upload Uses bigger batches and compresses larger (>4kb) files to make uploading faster. Only works on newer devices with 4mb of ram and firmware version >=1.19.x
 * @prop {string[]} py_ignore Comma separated list of files and folders to ignore when uploading (no wildcard or regular expressions supported)
 * @prop {string[]} autoconnect_comport_manufacturersComma separated list of all the comport manufacturers supported for the autoconnect feature. Defaults to all possible manufacturers that pycom boards can return
 */