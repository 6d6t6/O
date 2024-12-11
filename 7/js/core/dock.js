class Dock {
    constructor(system) {
        this.system = system;
        this.element = document.querySelector('#dock');
        this.runningIndicators = new Map();
    }

    async initialize() {
        // Create dock structure
        this.element.innerHTML = `
            <div class="dock-container">
                <div class="dock-apps"></div>
                <div class="dock-separator" style="display: none;"></div>
                <div class="dock-minimized-windows"></div>
                <div class="dock-separator"></div>
                <div class="dock-trash"></div>
            </div>
        `;
        
        this.appContainer = this.element.querySelector('.dock-apps');
        this.separators = this.element.querySelectorAll('.dock-separator');
        this.minimizedContainer = this.element.querySelector('.dock-minimized-windows');
        this.trashContainer = this.element.querySelector('.dock-trash');

        // Add default apps to dock
        const defaultApps = [
            { id: 'finder', name: 'Finder', icon: 'assets/icons/finder-icon.svg' },
            { id: 'terminal', name: 'Terminal', icon: 'assets/icons/terminal-icon.svg' },
            { id: 'settings', name: 'Settings', icon: 'assets/icons/settings-icon.svg' }
        ];

        for (const app of defaultApps) {
            this.addDockItem(app);
        }

        // Add trash icon
        this.addTrashIcon();

        this.initializeEventListeners();
    }

    // Add method to handle separator visibility
    updateSeparatorVisibility() {
        const hasMinimizedWindows = this.minimizedContainer.children.length > 0;
        this.separators[0].style.display = hasMinimizedWindows ? '' : 'none';
    }

    // Rest of the code stays the same, but update event listener to use appContainer
    initializeEventListeners() {
        this.appContainer.addEventListener('click', async (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                const appId = dockItem.dataset.appId;
                await this.handleDockItemClick(appId);
            }
        });

        // Add context menu event listeners
        this.appContainer.addEventListener('contextmenu', (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                e.preventDefault();
                const appId = dockItem.dataset.appId;
                this.showDockItemContextMenu(e, appId);
            }
        });

        this.trashContainer.addEventListener('click', () => {
            this.openTrash();
        });

        // Add context menu for trash
        this.trashContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showTrashContextMenu(e);
        });

        // Prevent context menu on minimized windows
        this.minimizedContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Close context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.closeContextMenu();
            }
        });
    }

    addDockItem(app) {
        const item = document.createElement('div');
        item.className = 'dock-item';
        item.dataset.appId = app.id;
        
        item.innerHTML = `
            <img src="${app.icon}" alt="${app.name}">
            <div class="dock-item-indicator"></div>
            <div class="dock-item-tooltip">${app.name}</div>
        `;
        
        this.appContainer.appendChild(item);
        this.runningIndicators.set(app.id, item.querySelector('.dock-item-indicator'));
    }

    addTrashIcon() {
        const trashIcon = document.createElement('div');
        trashIcon.className = 'dock-trash-icon';
        trashIcon.innerHTML = `
            <img src="assets/icons/trash-icon.svg" alt="Trash">
            <div class="dock-item-tooltip">Trash</div>
        `;
        this.trashContainer.appendChild(trashIcon);
    }

    async openTrash() {
        this.system.showNotification(
            "Trash",
            "Trash functionality is not implemented yet!"
        );
    }

    async handleDockItemClick(appId) {
        // Check if there's a minimized window for this app
        const minimizedWindow = Array.from(this.system.windowManager.windows.values())
            .find(win => win.app.id === appId && win.isMinimized);

        if (minimizedWindow) {
            // Restore the minimized window
            this.system.windowManager.restoreWindow(minimizedWindow.id);
        } else {
            try {
                await this.system.appSystem.launchApp(appId);
            } catch (error) {
                console.error('Failed to launch app:', error);
            }
        }
    }

    setRunningIndicator(appId, isRunning) {
        const indicator = this.runningIndicators.get(appId);
        if (indicator) {
            indicator.classList.toggle('active', isRunning);
        }
    }

    showDockItemContextMenu(e, appId) {
        const menuItems = [];
        const app = this.system.appSystem.getRunningApp(appId);
        
        // Get all windows for this app
        const allWindows = Array.from(this.system.windowManager.windows.values())
            .filter(win => win.app.id === appId);
        
        const openWindows = allWindows.filter(win => !win.isMinimized);
        const minimizedWindows = allWindows.filter(win => win.isMinimized);

        // Show open windows at the top
        if (openWindows.length > 0) {
            openWindows.forEach(win => {
                menuItems.push({
                    label: win.element.querySelector('.window-title').textContent || win.app.name,
                    action: () => this.system.windowManager.activateWindow(win.id)
                });
            });
            menuItems.push({ type: 'separator' });
        }

        // Show minimized windows
        if (minimizedWindows.length > 0) {
            minimizedWindows.forEach(win => {
                menuItems.push({
                    label: `Show ${win.element.querySelector('.window-title').textContent || win.app.name}`,
                    action: () => this.system.windowManager.restoreWindow(win.id)
                });
            });
            menuItems.push({ type: 'separator' });
        }

        // Special case for Finder
        if (appId === 'finder') {
            menuItems.push({ 
                label: 'New Finder Window', 
                action: async () => {
                    await this.system.appSystem.launchApp('finder', { forceNew: true });
                }
            });
        } else {
            // For non-running apps
            if (!app) {
                menuItems.push({ label: 'Open', action: () => this.system.appSystem.launchApp(appId) });
            } else {
                // For running apps
                menuItems.push({ 
                    label: `New ${app.name} Window`, 
                    action: async () => {
                        await this.system.appSystem.launchApp(appId, { forceNew: true });
                    }
                });
                menuItems.push({ type: 'separator' });
                menuItems.push({ label: 'Quit', action: () => this.system.appSystem.terminateApp(appId) });
            }
        }

        const dockItem = e.target.closest('.dock-item, .dock-trash-icon');
        this.showDockContextMenu(dockItem, menuItems);
    }

    showTrashContextMenu(e) {
        const menuItems = [
            { label: 'Open', action: () => this.openTrash() },
            { type: 'separator' },
            { label: 'Empty Trash', action: () => {
                this.system.showNotification('Trash', 'Empty Trash functionality is not implemented yet!');
            }}
        ];

        const trashItem = e.target.closest('.dock-trash-icon');
        this.showDockContextMenu(trashItem, menuItems);
    }

    showDockContextMenu(dockItem, items) {
        // Remove any existing context menu
        this.closeContextMenu();

        // Add class to indicate context menu is open
        dockItem.classList.add('context-menu-open');

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu dock-context-menu';

        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.textContent = item.label;
                menuItem.addEventListener('click', () => {
                    item.action();
                    this.closeContextMenu();
                });
                menu.appendChild(menuItem);
            }
        });

        // Position menu above the dock item
        const dockItemRect = dockItem.getBoundingClientRect();
        const menuHeight = items.length * 25 + (items.filter(i => i.type === 'separator').length * 10); // Approximate height
        
        menu.style.left = `${dockItemRect.left}px`;
        menu.style.bottom = `${window.innerHeight - dockItemRect.top + 10}px`; // 10px gap from dock item

        // Add to document
        document.body.appendChild(menu);

        // Adjust horizontal position if menu goes off-screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            const overflow = menuRect.right - window.innerWidth;
            menu.style.left = `${dockItemRect.left - overflow - 10}px`; // 10px padding from window edge
        }

        // Activate with slight delay for animation
        requestAnimationFrame(() => {
            menu.classList.add('active');
        });
    }

    closeContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            // Remove the context-menu-open class from any dock items
            document.querySelectorAll('.context-menu-open').forEach(item => {
                item.classList.remove('context-menu-open');
            });
            existingMenu.remove();
        }
    }
}

window.Dock = Dock; 