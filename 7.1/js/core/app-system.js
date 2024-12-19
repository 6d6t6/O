// OMEGA OS - App System
class AppSystem {
    constructor(system) {
        this.system = system;
        this.apps = new Map();
        this.runningApps = new Map();
        this.appClasses = new Map();
    }

    async registerApp(manifest) {
        this.apps.set(manifest.id, manifest);
        
        // Load the app's class if not already loaded
        if (!this.appClasses.has(manifest.id)) {
            try {
                // Generate the class name from the app ID
                const className = manifest.id.split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('') + 'App';
                
                // Get the class from the global scope
                const AppClass = window[className];
                
                if (!AppClass) {
                    throw new Error(`App class ${className} not found. Make sure the app script is loaded.`);
                }

                this.appClasses.set(manifest.id, AppClass);
            } catch (error) {
                console.error(`Failed to load app class for ${manifest.id}:`, error);
                throw error;
            }
        }
    }

    async launchApp(appId, options = {}) {
        const manifest = this.apps.get(appId);
        if (!manifest) {
            throw new Error(`App '${appId}' not found`);
        }

        try {
            // Get app class from our loaded classes
            const AppClass = this.appClasses.get(appId);
            if (!AppClass) {
                throw new Error(`App class for '${appId}' not found`);
            }

            // Check if app is already running
            let app = this.runningApps.get(appId);
            if (!app) {
                // Create new app instance
                app = new AppClass(this.system, manifest);
                
                // Register with process manager
                if (this.system.processManager) {
                    this.system.processManager.createProcess(app);
                }
                
                // Add to running apps
                this.runningApps.set(appId, app);
                
                // Update dock indicator
                if (this.system.dock) {
                    this.system.dock.setRunningIndicator(appId, true);
                }
            }

            // Create window for app unless noWindow option is set
            // For Finder, only create window if explicitly requested
            if (!options.noWindow && (appId !== 'finder' || options.createWindow)) {
                const window = this.system.windowManager.createWindow(app);
                await app.onInitialize(window);
            }

            return app;
        } catch (error) {
            console.error(`Failed to launch app '${appId}':`, error);
            throw error;
        }
    }

    async terminateApp(appId) {
        const app = this.runningApps.get(appId);
        if (!app || appId === 'finder') return; // Never terminate Finder

        try {
            if (this.system.processManager) {
                await this.system.processManager.terminateProcess(app.pid);
            } else {
                // Fallback if process manager is not available
                await app.onCleanup();
                this.runningApps.delete(appId);
            }

            // Update dock indicator
            if (this.system.dock) {
                this.system.dock.setRunningIndicator(appId, false);
            }
        } catch (error) {
            console.error(`Failed to terminate app '${appId}':`, error);
            throw error;
        }
    }

    async closeWindow(windowId) {
        const window = this.system.windowManager.windows.get(windowId);
        if (!window) return;

        const app = window.app;
        const appWindows = Array.from(this.system.windowManager.windows.values())
            .filter(w => w.app === app);

        // Close the specific window
        this.system.windowManager.closeWindow(windowId);

        // If this was the last window and it's not Finder, hide the app but keep it running
        if (appWindows.length === 1 && app.id !== 'finder') {
            // Switch to Finder in menu bar
            const finder = this.getRunningApp('finder');
            if (finder) {
                this.system.menuBar.setActiveApp(finder);
            }
        }
    }

    getRunningApp(appId) {
        return this.runningApps.get(appId);
    }

    isAppRunning(appId) {
        return this.runningApps.has(appId);
    }
}

window.AppSystem = AppSystem; 