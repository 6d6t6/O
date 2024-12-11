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
                // Try to get existing class first
                const className = manifest.id.charAt(0).toUpperCase() + manifest.id.slice(1) + 'App';
                let AppClass = window[className];

                if (!AppClass) {
                    // If not found, try to load it from the apps directory
                    const script = document.createElement('script');
                    script.src = `js/apps/${manifest.id}.js`;
                    script.async = false;
                    
                    await new Promise((resolve, reject) => {
                        script.onload = () => {
                            AppClass = window[className];
                            if (AppClass) {
                                resolve();
                            } else {
                                reject(new Error(`App class ${className} not found after loading`));
                            }
                        };
                        script.onerror = () => reject(new Error(`Failed to load app script for ${manifest.id}`));
                        document.body.appendChild(script);
                    });
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

        // Check if app is already running
        let app = this.runningApps.get(appId);
        
        // If app is running and forceNew is not true, focus existing window
        if (app && !options.forceNew) {
            const windows = Array.from(this.system.windowManager.windows.values());
            const window = windows.find(w => w.app === app);
            if (window) {
                this.system.windowManager.activateWindow(window.id);
                return app;
            }
        }

        try {
            // Get app class from our loaded classes
            const AppClass = this.appClasses.get(appId);
            if (!AppClass) {
                throw new Error(`App class for '${appId}' not found`);
            }

            // Create new app instance if:
            // 1. No app is running, or
            // 2. forceNew is true (we want a new instance)
            if (!app || options.forceNew) {
                app = new AppClass(this.system, manifest);
                
                // Only set as running app if it's the first instance
                if (!this.runningApps.has(appId)) {
                    this.runningApps.set(appId, app);
                }
            }

            // Create window for app
            const window = this.system.windowManager.createWindow(app);
            await app.onInitialize(window);

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
            // Call cleanup
            await app.onCleanup();

            // Close all windows
            const windows = Array.from(this.system.windowManager.windows.values());
            windows.forEach(window => {
                if (window.app === app) {
                    this.system.windowManager.closeWindow(window.id);
                }
            });

            // Remove from running apps
            this.runningApps.delete(appId);

            // Switch back to Finder in menu bar
            const finder = this.getRunningApp('finder');
            if (finder) {
                this.system.menuBar.setActiveApp(finder);
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