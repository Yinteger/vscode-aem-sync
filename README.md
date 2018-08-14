# aem-sync README

AEM-Sync is an extension for Visual Studio Code to automatically sync changes to files to a Adobe Experience Manager server.  It is intended to be used for local development.  It will watch for files changes, compile them into a package, and sync them to a single AEM server.

## This is ALPHA
Current issues include it not properly syncing deleted files or renamed files.

## Dependencies
This extension does NOT make use of Filevault.  It entirely relies on Restful API's that AEM provides.  Therefore, these API's must be enabled for this extension to work.  They should be enabled by default on local author development servers.

### Supported features
AEM-Sync will look for and detect jcr_root folders, and begin watching all the folders and files in them for changes.   When a change is detected, it will build an AEM Package and upload it to your AEM Server via a Restful API.  You will notice a sync.zip package in your Package Manager, which will always contain the latest sync changes.  There will only ever be one sync.zip file, and it's safe to delete.

As well, this extension will create a 'aemsync' log in your Output view in VSCode that gives you detailed info on what's being synced.  There is also some status messages at appear at the bottom of the VSCode window when it's syncing/when it's completed a sync. 

### Features coming soon
The ability to Sync To/From AEM on specific files/folders via a Context Menu in the Explorer View will be coming shortly for the 'full release' of this extension.

As well, I am hoping to include Maven support at some point so Java-related changes can be pushed to AEM automatically as well from VS Code.
