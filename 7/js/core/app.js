class OmegaApp {
    constructor(system, manifest) {
        this.system = system;
        this.manifest = manifest;
        this.id = manifest.id;
        this.name = manifest.name;
        this.icon = manifest.icon;
        this.window = null;
        this.pid = null; // Process ID will be assigned by ProcessManager
        this.status = 'initialized'; // initialized, running, terminating, terminated
    }

    async onInitialize(window) {
        this.status = 'running';
        // Override in subclass for additional initialization
    }

    async onCleanup() {
        this.status = 'terminating';
        // Override in subclass for additional cleanup
    }

    getMenus() {
        const appMenu = {
            title: this.name,
            items: [
                { label: `About ${this.name}`, action: () => this.handleMenuAction('about') },
                { type: 'separator' },
                { label: 'Quit', shortcut: '⌘+Q', action: () => this.quitApp() }
            ]
        };

        const defaultMenus = {
            file: {
                title: 'File',
                items: [
                    { label: 'New', shortcut: '⌘+N', action: () => this.handleMenuAction('new') },
                    { label: 'Open...', shortcut: '⌘+O', action: () => this.handleMenuAction('open') },
                    { type: 'separator' },
                    { 
                        label: 'Close Window', 
                        shortcut: '⌘+W', 
                        action: () => this.handleMenuAction('close'),
                        enabled: () => {
                            const activeWindow = this.system.windowManager.activeWindow;
                            return activeWindow && activeWindow.app === this;
                        }
                    }
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
                    { 
                        label: 'Minimize', 
                        shortcut: '⌘+M', 
                        action: () => this.handleMenuAction('minimize'),
                        enabled: () => {
                            const activeWindow = this.system.windowManager.activeWindow;
                            return activeWindow && activeWindow.app === this;
                        }
                    },
                    { 
                        label: 'Zoom', 
                        action: () => this.handleMenuAction('zoom'),
                        enabled: () => {
                            const activeWindow = this.system.windowManager.activeWindow;
                            return activeWindow && activeWindow.app === this;
                        }
                    }
                ]
            },
            help: {
                title: 'Help',
                items: [
                    { label: `${this.name} Help`, action: () => this.handleMenuAction('help') }
                ]
            }
        };

        return { [this.name.toLowerCase()]: appMenu, ...defaultMenus };
    }

    handleMenuAction(action) {
        const activeWindow = this.system.windowManager.activeWindow;
        
        switch (action) {
            case 'close':
                if (activeWindow && activeWindow.app === this) {
                    this.system.windowManager.closeWindow(activeWindow.id);
                }
                break;
            case 'minimize':
                if (activeWindow && activeWindow.app === this) {
                    this.system.windowManager.minimizeWindow(activeWindow.id);
                }
                break;
            case 'zoom':
                if (activeWindow && activeWindow.app === this) {
                    this.system.windowManager.toggleMaximizeWindow(activeWindow.id);
                }
                break;
            case 'quit':
                this.quitApp();
                break;
            default:
                console.log(`Menu action '${action}' not implemented in ${this.name}`);
        }
    }

    quitApp() {
        if (this.status === 'terminating' || this.status === 'terminated') {
            return;
        }

        this.status = 'terminating';
        
        // Let the process manager handle the termination
        this.system.processManager.terminateProcess(this.pid);
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