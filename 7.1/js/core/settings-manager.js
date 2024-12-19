class SettingsManager {
    constructor(system) {
        this.system = system;
        this.settingsPath = '/System/Preferences/settings.json';
        // Default settings
        this.defaultSettings = {
            appearance: {
                theme: 'dark',
                accentColor: '#007AFF',
                fontSize: '14px',
                wallpaper: '/System/Wallpapers/milad-fakurian-iLHDO19h0ng-unsplash.jpg'
            },
            system: {
                notifications: true,
                animations: true,
                soundEffects: true,
                region: 'US',
                language: 'en-US'
            },
            notifications: {
                order: 'newest-first'
            }
        };
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings)); // Deep clone defaults
    }

    async initialize() {
        try {
            // Try to load settings from file first
            const settings = await this.loadSettingsFromFile();
            
            if (settings) {
                // Deep merge with defaults to ensure all properties exist
                this.settings = {
                    appearance: {
                        ...this.defaultSettings.appearance,
                        ...settings.appearance
                    },
                    system: {
                        ...this.defaultSettings.system,
                        ...settings.system
                    },
                    notifications: {
                        ...this.defaultSettings.notifications,
                        ...settings.notifications
                    }
                };
                console.log('Loaded and merged settings:', this.settings);
            } else {
                // If no settings file exists or it's invalid, create one with defaults
                console.log('No valid settings file found, creating with defaults');
                await this.saveSettingsToFile();
            }
        } catch (error) {
            console.error('Error during settings initialization:', error);
            // Keep using default settings
            console.log('Using default settings due to error');
            await this.saveSettingsToFile();
        }
    }

    async loadSettingsFromFile() {
        try {
            // First check if the settings directory and file exist
            try {
                await this.system.filesystem.getDirectoryHandle('/System/Preferences');
                await this.system.filesystem.getFile(this.settingsPath);
            } catch {
                console.log('Settings file not found - this is normal for first-time setup');
                return null;
            }

            // If we get here, the file exists, so try to read it
            const content = await this.system.filesystem.readFile(this.settingsPath);
            if (!content) {
                console.log('Settings file is empty');
                return null;
            }

            let text;
            // Handle different types of content (Blob or string)
            if (content instanceof Blob) {
                text = await content.text();
            } else if (typeof content === 'string') {
                text = content;
            } else {
                console.log('Unexpected content type:', typeof content);
                return null;
            }

            if (!text.trim()) {
                console.log('Settings file is empty');
                return null;
            }

            try {
                const settings = JSON.parse(text);
                if (!settings || typeof settings !== 'object') {
                    console.log('Settings file contains invalid JSON');
                    return null;
                }
                console.log('Successfully loaded settings from file:', settings);
                return settings;
            } catch (parseError) {
                console.error('Failed to parse settings JSON:', parseError);
                return null;
            }
        } catch (error) {
            console.error('Error reading settings file:', error);
            return null;
        }
    }

    async saveSettingsToFile() {
        try {
            // Create the Preferences directory if it doesn't exist
            try {
                await this.system.filesystem.createDirectory('/System/Preferences');
            } catch (error) {
                // Ignore error if directory already exists
            }

            const content = JSON.stringify(this.settings, null, 2);
            await this.system.filesystem.writeFile(this.settingsPath, new Blob([content], { type: 'application/json' }));
            console.log('Successfully saved settings to file:', this.settings);
            
            // Notify system of settings change
            window.dispatchEvent(new CustomEvent('settingsChanged', { 
                detail: this.settings 
            }));

            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    getSettings() {
        return this.settings;
    }

    async updateSettings(newSettings) {
        // Deep merge settings
        this.settings = {
            appearance: {
                ...this.settings.appearance,
                ...(newSettings.appearance || {})
            },
            system: {
                ...this.settings.system,
                ...(newSettings.system || {})
            },
            notifications: {
                ...this.settings.notifications,
                ...(newSettings.notifications || {})
            }
        };
        
        const saved = await this.saveSettingsToFile();
        if (!saved) {
            console.error('Failed to persist settings update');
        }
        return saved;
    }

    async updateAppearance(appearanceSettings) {
        this.settings.appearance = {
            ...this.settings.appearance,
            ...appearanceSettings
        };
        return await this.saveSettingsToFile();
    }

    async updateSystem(systemSettings) {
        this.settings.system = {
            ...this.settings.system,
            ...systemSettings
        };
        return await this.saveSettingsToFile();
    }

    async updateNotifications(notificationSettings) {
        this.settings.notifications = {
            ...this.settings.notifications,
            ...notificationSettings
        };
        return await this.saveSettingsToFile();
    }
}

window.SettingsManager = SettingsManager; 