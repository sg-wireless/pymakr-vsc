## Settings
The majority of the sessing can be specified in both the global config file as wel as the per project file.

| Setting          | Project | Global | Default               | Purpose
|------------------|---------|--------|-----------------------| -----------------------------------------------------------
| open_on_start    | yes     | yes    | true                  | Weather to open the terminal and connect to the board when starting Code
| address          | yes     | yes    | /something            | IP address or comport for your device
| username         | yes     | yes    | micro                 | Board username, only for telnet
| password         | yes     | yes    | python                | Board password, only for telnet
| ctrl_c_on_connect| yes     | yes    | false                 | If true, executes a ctrl-c on connect to stop running programs
||||
| auto_connect     | no       | yes    | true | Autoconnect on USB. Ignores any \'address\' setting and automatically connects to the top item in the serialport list
| autoconnect_comport_manufacturers| no | yes | 'Pycom','Pycom Ltd.','FTDI', 'Microsoft','Microchip Technology, Inc.'| Comma separated list of all the  comport manufacturers supported for the autoconnect feature. Defaults to all possible manufacturers that pycom boards can return.
||||
| sync_folder      | yes     | yes    | ""                    | Folder to synchronize. Empty to sync projects main folder
| sync_file_types  | yes     | yes    | "py,txt,log,json,xml,html,js, css,mpy" | Types of files to be synchronized
| sync_all_file_types | yes  | yes    | false | 'If enabled, all files will be uploaded no matter the file type. The list of file types below will be ignored
| py_ignore        | yes     | yes    | []                    | Comma separated list of files and folders to ignore when uploading (no wildcard or regular expressions supported)
||||
| safe_boot_on_upload | yes | yes | false | Safe-boot before upload, Only works with firmware v1.16.0.b1 and up. Safe boots the board before uploading to prevent running out of memory while uploading. Especially useful on older boards with less memory, but adds about 2 seconds to the upload procedure'
| reboot_after_upload| yes | yes | true | Reboots your pycom board after any upload or download action
||||
| fast_upload | yes  | yes | false| Fast upload (experimental), Uses bigger batches and compresses larger (>4kb) files to make uploading faster. Only works on newer devices with 4mb of ram and firmware version >=1.19.x
||||
| statusbar_buttons| yes     | yes     |['status', 'run', 'upload', 'download', 'disconnect', 'listserial', 'settings', 'projectsettings', 'getversion', 'getssid'] | Which quick-access buttons to show in the statusbar.
