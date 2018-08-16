# aem-sync README

AEM-Sync is an extension for Visual Studio Code to automatically sync changes to files to a Adobe Experience Manager server.  It is intended to be used for local development.  

## This is a preview extension
Currently only being tested by a dev team using Windows 10 + AEM 6.1.  If you use this, please let me know how it works with your set up, OS, and AEM version!

## Dependencies
This extension does NOT make use of Filevault.  It entirely relies on Restful API's that AEM provides.  Therefore, these API's must be enabled for this extension to work.  They should be enabled by default on local author development servers.

## Supported features

### File change syncing
AEM-Sync will look for and detect jcr_root folders, and begin watching all the folders and files in them for changes using fs.watch.   When a change is detected,  it will build an AEM Package and upload it to your AEM Server via a Restful API.  You will notice a sync.zip package in your Package Manager, which will always contain the latest sync changes.  There will only ever be one sync.zip file, and it's safe to delete.

### Sync output log

The extension will create a 'aemsync' log in your Output view in VSCode that gives you detailed info on what's being synced.  There is also some status messages at appear at the bottom of the VSCode window when it's syncing/when it's completed a sync. 

![alt text](https://github.com/Yinkai15/vscode-aem-sync/blob/master/outputexample.gif?raw=true "AEM Sync output example gif")

### Sync status
In the taskbar at the bottom of Visual Studio, you will see a status appear while it's syncing, and that gets replaced with a Sync success status for a few seconds after the sync is done.  If there is errors in the sync, you will get a pop up notification in Visual Studio with the error.

![alt text](https://github.com/Yinkai15/vscode-aem-sync/blob/master/statusexample.gif?raw=true "AEM Sync output example gif")

### Features coming soon
The ability to Sync To/From AEM on specific files/folders via a Context Menu in the Explorer View will be coming shortly for the 'full release' of this extension.

As well, I am hoping to include Maven support at some point so Java-related changes can be pushed to AEM automatically as well from VS Code.

## Configuration
This extension can be configured for your environment by using the Visual Studio Code Settings Editor.  Currently, you can configure these properties:
* Host
* Port
* Username
* Password
* Sync Delay
