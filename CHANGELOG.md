# Change Log
All notable changes to the "aem-sync" extension will be documented in this file.

## [0.2.3]
- Fixed an issue with syncing .content.xml files and other similiar files like dialog.xml
- The only .content.xml file that should have issues syncing now are root level nodes (apps, home, bin, etc).  Don't know if these are typically even changed though. 
    Added a check to prevent syncing these nodes for now
- Added a warning to Sync From AEM for now telling the user it's not yet supported

## [0.2.2]
- Fixed an issue with syncing directories to AEM (It would sync the dir but remove all the files in AEM)
- Changed the output log to use the change log sent back from AEM for better accuracy (Over a custom built one)
- Got the Sync to AEM explorer context menu item working
- Changed the names of the Enable/Disable commands to better represent what they do

## [0.2.1]
- Unix support

## [0.1.3]
- Added new config property for the delay because a file change and a sync.  As well, added commands to start/stop the sync extension.

## [0.1.2]
- Added support for delete, add, rename, move file operations to be synced to AEM

## [0.1.1]
- Added config properties for username/password, and updated code to use config properties

## [Unreleased]
- Initial release containing prototype functionality for syncing to AEM on file change