class Desktop {
    constructor(system) {
        this.system = system;
        this.element = document.getElementById('desktop');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle right-click context menu
        this.element.addEventListener('contextmenu', (e) => {
            // If right-clicking on a desktop icon, show icon-specific menu
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                e.preventDefault();
                this.showIconContextMenu(e, icon);
                return;
            }

            // Otherwise show desktop context menu
            e.preventDefault();
            this.showDesktopContextMenu(e);
        });

        // Handle icon double-click
        this.element.addEventListener('dblclick', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.openDesktopItem(icon);
            }
        });
    }

    showDesktopContextMenu(e) {
        const items = [
            {
                label: 'New',
                items: [
                    { 
                        label: 'Folder', 
                        action: () => this.createNewFolder() 
                    },
                    { 
                        label: 'Text Document', 
                        action: () => this.createNewFile('text') 
                    }
                ]
            },
            {
                label: 'Test 1',
                items: [
                    {
                        label: 'Test 2',
                        items: [
                            {
                                label: 'Test 3',
                                items: [
                                    {
                                        label: 'Test 4',
                                        items: [
                                            {
                                                label: 'Test 5',
                                                items: [
                                                    {
                                                        label: 'Test 6',
                                                        enabled: () => false
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            { type: 'separator' },
            { 
                label: 'Get Info', 
                action: () => this.showDesktopInfo() 
            },
            { type: 'separator' },
            {
                label: 'Change Wallpaper',
                action: () => this.system.appSystem.launchApp('settings', { section: 'wallpaper' })
            },
            { type: 'separator' },
            {
                label: 'Clean Up',
                items: [
                    { 
                        label: 'By Name', 
                        action: () => this.cleanUpIcons('name') 
                    },
                    { 
                        label: 'By Type', 
                        action: () => this.cleanUpIcons('type') 
                    },
                    { 
                        label: 'By Date', 
                        action: () => this.cleanUpIcons('date') 
                    }
                ]
            },
            { 
                label: 'Sort By',
                items: [
                    { 
                        label: 'Name', 
                        action: () => this.sortIcons('name') 
                    },
                    { 
                        label: 'Type', 
                        action: () => this.sortIcons('type') 
                    },
                    { 
                        label: 'Date', 
                        action: () => this.sortIcons('date') 
                    }
                ]
            }
        ];

        this.system.contextMenuManager.showContextMenu(e, items);
    }

    showIconContextMenu(e, icon) {
        const items = [
            { 
                label: 'Open', 
                action: () => this.openDesktopItem(icon) 
            },
            { type: 'separator' },
            { 
                label: 'Get Info', 
                action: () => this.showItemInfo(icon) 
            },
            { 
                label: 'Rename', 
                action: () => this.renameItem(icon) 
            },
            { type: 'separator' },
            { 
                label: 'Move to Trash', 
                action: () => this.moveToTrash(icon) 
            }
        ];

        this.system.contextMenuManager.showContextMenu(e, items);
    }

    async createNewFolder() {
        try {
            const name = 'New Folder';
            await this.system.filesystem.createDirectory(`/Desktop/${name}`);
            await this.refreshDesktop();
        } catch (error) {
            console.error('Failed to create new folder:', error);
        }
    }

    async createNewFile(type) {
        try {
            const name = 'New Text Document.txt';
            await this.system.filesystem.writeFile(`/Desktop/${name}`, '');
            await this.refreshDesktop();
        } catch (error) {
            console.error('Failed to create new file:', error);
        }
    }

    async showDesktopInfo() {
        // TODO: Show desktop info dialog
        console.log('Show desktop info');
    }

    async showItemInfo(icon) {
        // TODO: Show item info dialog
        console.log('Show item info:', icon.querySelector('.file-name').textContent);
    }

    async renameItem(icon) {
        // TODO: Implement rename functionality
        console.log('Rename item:', icon.querySelector('.file-name').textContent);
    }

    async moveToTrash(icon) {
        // TODO: Implement move to trash
        console.log('Move to trash:', icon.querySelector('.file-name').textContent);
    }

    async openDesktopItem(icon) {
        const name = icon.querySelector('.file-name').textContent;
        const type = icon.querySelector('.file-icon').alt;

        if (type === 'directory') {
            await this.system.appSystem.launchApp('finder', { path: `/Desktop/${name}` });
        } else {
            // TODO: Open file with appropriate app based on extension
            console.log('Open file:', name);
        }
    }

    async refreshDesktop() {
        try {
            // Clear current icons
            this.element.innerHTML = '';

            // Load desktop contents
            const entries = await this.system.filesystem.readDirectory('/Desktop');
            
            for (const entry of entries) {
                const icon = document.createElement('div');
                icon.className = 'desktop-icon';
                icon.innerHTML = `
                    <img class="file-icon" src="assets/icons/${entry.type === 'directory' ? 'directory' : 'file'}.svg" alt="${entry.type}">
                    <span class="file-name">${entry.name}</span>
                `;
                this.element.appendChild(icon);
            }
        } catch (error) {
            console.error('Failed to refresh desktop:', error);
        }
    }

    cleanUpIcons(by) {
        // TODO: Implement icon cleanup
        console.log('Clean up icons by:', by);
    }

    sortIcons(by) {
        // TODO: Implement icon sorting
        console.log('Sort icons by:', by);
    }
}

// Add to window object
window.Desktop = Desktop; 