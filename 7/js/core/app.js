class OmegaApp {
    constructor(system, manifest) {
        this.system = system;
        this.manifest = manifest;
        this.id = manifest.id;
        this.name = manifest.name;
        this.icon = manifest.icon;
        this.window = null;
    }

    async onInitialize(window) {
        // Override in subclass
    }

    async onCleanup() {
        // Override in subclass
    }

    getMenus() {
        // Default app menus - override in subclass to customize
        return {
            file: {
                title: 'File',
                items: [
                    { label: 'New', shortcut: '⌘+N', action: () => this.handleMenuAction('new') },
                    { label: 'Open...', shortcut: '⌘+O', action: () => this.handleMenuAction('open') },
                    { type: 'separator' },
                    { label: 'Close Window', shortcut: '⌘+W', action: () => this.handleMenuAction('close'), enabled: () => {
                        // Only enable if there is an active window
                        const activeWindow = this.system.windowManager.activeWindow;
                        if (!activeWindow) return false;
                        
                        // For Finder, enable if there's an active Finder window
                        if (this.id === 'finder') {
                            return activeWindow.app.id === 'finder';
                        }
                        
                        // For other apps, enable if the active window belongs to this app
                        return activeWindow.app === this;
                    } }
                ]
            },
            edit: {
                title: 'Edit',
                items: [
                    { label: 'Undo', shortcut: '⌘+Z', action: () => this.handleMenuAction('undo') },
                    { label: 'Redo', shortcut: '⌘+Shift+Z', action: () => this.handleMenuAction('redo') },
                    { type: 'separator' },
                    { label: 'Cut', shortcut: '⌘+X', action: () => this.handleMenuAction('cut') },
                    { label: 'Copy', shortcut: '⌘+C', action: () => this.handleMenuAction('copy') },
                    { label: 'Paste', shortcut: '⌘+V', action: () => this.handleMenuAction('paste') },
                    { type: 'separator' },
                    { label: 'Select All', shortcut: '⌘+A', action: () => this.handleMenuAction('selectAll') }
                ]
            },
            view: {
                title: 'View',
                items: [
                    { label: 'Reload', shortcut: '⌘+R', action: () => this.handleMenuAction('reload') }
                ]
            },
            window: {
                title: 'Window',
                items: [
                    { label: 'Minimize', shortcut: '⌘+M', action: () => this.handleMenuAction('minimize') },
                    { label: 'Zoom', action: () => this.handleMenuAction('zoom') }
                ]
            },
            help: {
                title: 'Help',
                items: [
                    { label: `${this.name} Help`, action: () => this.handleMenuAction('help') }
                ]
            }
        };
    }

    handleMenuAction(action) {
        switch (action) {
            case 'close':
                const activeWindow = this.system.windowManager.activeWindow;
                if (activeWindow && activeWindow.app === this) {
                    // Close the active window
                    this.system.windowManager.closeWindow(activeWindow.id);
                }
                break;
            case 'quit':
                this.system.appSystem.terminateApp(this.id);
                break;
            default:
                console.log(`Menu action '${action}' not implemented in ${this.name}`);
        }
    }

    async requestFileSystem() {
        return this.system.filesystem;
    }

    setContent(content) {
        if (this.window) {
            this.window.setContent(content);
        }
    }

    setTitle(title) {
        if (this.window) {
            this.window.setTitle(title);
        }
    }

    showError(title, message) {
        if (this.window) {
            this.window.showError(title, message);
        }
    }

    async showPrompt(title, message) {
        if (this.window) {
            return await this.window.showPrompt(title, message);
        }
        return null;
    }
}

window.OmegaApp = OmegaApp; 