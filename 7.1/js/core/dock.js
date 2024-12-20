class Dock {
    constructor(system) {
        this.system = system;
        this.element = document.querySelector('#dock');
        this.runningIndicators = new Map();
        this.longPressTimer = null;
        this.longPressDelay = 1000; // 1 second for long press
        this.longPressStartPos = null;
        this.isDragging = false;
        this.longPressTriggered = false;

        // Register this manager with the system
        if (!window.menuManagers) {
            window.menuManagers = new Set();
        }
        window.menuManagers.add(this);
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
            { id: 'activity-monitor', name: 'Activity Monitor', icon: 'assets/icons/activity-monitor-icon.svg' },
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
        // Handle mousedown for long-press detection
        const handleMouseDown = (e, element, contextMenuHandler) => {
            // Only handle left clicks
            if (e.button !== 0) return;

            const startX = e.clientX;
            const startY = e.clientY;
            this.longPressStartPos = { x: startX, y: startY };
            this.longPressTriggered = false;
            
            this.longPressTimer = setTimeout(() => {
                // Only trigger if we haven't moved much (5px threshold)
                const dx = Math.abs(e.clientX - startX);
                const dy = Math.abs(e.clientY - startY);
                if (dx < 5 && dy < 5 && !this.isDragging) {
                    this.longPressTriggered = true;
                    contextMenuHandler(e);
                }
            }, this.longPressDelay);

            // Add temporary mousemove and mouseup listeners
            const handleMouseMove = (e) => {
                const dx = Math.abs(e.clientX - startX);
                const dy = Math.abs(e.clientY - startY);
                // If moved more than 5px, cancel long press
                if (dx > 5 || dy > 5) {
                    clearTimeout(this.longPressTimer);
                    this.isDragging = true;
                }
            };

            const handleMouseUp = () => {
                clearTimeout(this.longPressTimer);
                this.isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        // App icons click and long-press
        this.appContainer.addEventListener('mousedown', (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                handleMouseDown(e, dockItem, (event) => {
                    event.preventDefault();
                    const appId = dockItem.dataset.appId;
                    this.showDockItemContextMenu(event, appId);
                });
            }
        });

        this.appContainer.addEventListener('click', async (e) => {
            if (this.isDragging || this.longPressTriggered) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                const appId = dockItem.dataset.appId;
                await this.handleDockItemClick(appId);
            }
        });

        // Trash icon click and long-press
        this.trashContainer.addEventListener('mousedown', (e) => {
            const trashIcon = e.target.closest('.dock-trash-icon');
            if (trashIcon) {
                handleMouseDown(e, trashIcon, (event) => {
                    event.preventDefault();
                    this.showTrashContextMenu(event);
                });
            }
        });

        this.trashContainer.addEventListener('click', (e) => {
            if (this.isDragging || this.longPressTriggered) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            this.openTrash();
        });

        // Keep existing context menu event listeners as fallback for right-click
        this.appContainer.addEventListener('contextmenu', (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                e.preventDefault();
                const appId = dockItem.dataset.appId;
                this.showDockItemContextMenu(e, appId);
            }
        });

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
        
        // Add keyboard accessibility
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `${app.name} application`);
        
        item.innerHTML = `
            <img src="${app.icon}" alt="${app.name}">
            <div class="dock-item-indicator"></div>
            <div class="dock-item-tooltip">${app.name}</div>
        `;
        
        // Add keyboard event listeners
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Show context menu for long press
                    e.preventDefault();
                    this.showDockItemContextMenu(e, app.id);
                } else {
                    // Normal click
                    this.handleDockItemClick(app.id);
                }
            }
        });

        // Add hover animations only for mouse and keyboard focus
        item.addEventListener('mouseenter', () => {
            if (!item.matches(':focus-visible')) {
                item.classList.add('dock-item-hover');
            }
        });
        item.addEventListener('mouseleave', () => {
            if (!item.matches(':focus-visible')) {
                item.classList.remove('dock-item-hover');
            }
        });
        
        this.appContainer.appendChild(item);
        this.runningIndicators.set(app.id, item.querySelector('.dock-item-indicator'));

        // Set initial state if app is already running
        if (this.system.appSystem.isAppRunning(app.id)) {
            this.setRunningIndicator(app.id, true);
        }
    }

    addTrashIcon() {
        const trashIcon = document.createElement('div');
        trashIcon.className = 'dock-trash-icon';
        
        // Add keyboard accessibility
        trashIcon.setAttribute('tabindex', '0');
        trashIcon.setAttribute('role', 'button');
        trashIcon.setAttribute('aria-label', 'Trash');
        
        trashIcon.innerHTML = `
            <img src="assets/icons/trash-icon.svg" alt="Trash">
            <div class="dock-item-tooltip">Trash</div>
        `;

        // Add keyboard event listeners
        trashIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Show context menu for long press
                    e.preventDefault();
                    this.showTrashContextMenu(e);
                } else {
                    // Normal click
                    this.openTrash();
                }
            }
        });

        // Add hover animations only for mouse and keyboard focus
        trashIcon.addEventListener('mouseenter', () => {
            if (!trashIcon.matches(':focus-visible')) {
                trashIcon.classList.add('dock-item-hover');
            }
        });
        trashIcon.addEventListener('mouseleave', () => {
            if (!trashIcon.matches(':focus-visible')) {
                trashIcon.classList.remove('dock-item-hover');
            }
        });

        this.trashContainer.appendChild(trashIcon);
    }

    async openTrash() {
        try {
            console.log('Opening Trash folder...');
            
            // Check for existing empty trash dialog
            const existingDialog = Array.from(this.system.windowManager.windows.values())
                .find(win => win.element.classList.contains('empty-trash-dialog'));
            
            if (existingDialog) {
                // If dialog exists, just bring it to front
                this.system.windowManager.activateWindow(existingDialog.id);
                return;
            }
            
            // Check for existing Finder windows showing the Trash folder
            const existingTrashWindow = Array.from(this.system.windowManager.windows.values())
                .find(win => win.app.id === 'finder' && win.app.getWindowState(win)?.currentPath === '/Trash');

            if (existingTrashWindow) {
                // If window is minimized, restore it
                if (existingTrashWindow.isMinimized) {
                    this.system.windowManager.restoreWindow(existingTrashWindow.id);
                }
                // Bring window to front and activate it
                this.system.windowManager.activateWindow(existingTrashWindow.id);
            } else {
                // No existing Trash window, create a new one
                await this.system.appSystem.launchApp('finder', { path: '/Trash', createWindow: true });
            }
        } catch (error) {
            console.error('Failed to open Trash:', error);
            this.system.showNotification(
                'Trash',
                'Failed to open Trash folder',
                'assets/icons/trash-icon.svg'
            );
        }
    }

    async handleDockItemClick(appId) {
        // Get all windows for this app
        const appWindows = Array.from(this.system.windowManager.windows.values())
            .filter(win => win.app.id === appId);

        if (appWindows.length > 0) {
            // If there are any minimized windows, restore them
            const minimizedWindows = appWindows.filter(win => win.isMinimized);
            if (minimizedWindows.length > 0) {
                minimizedWindows.forEach(win => {
                    this.system.windowManager.restoreWindow(win.id);
                });
            } else {
                // Find the topmost window by highest z-index
                const topmostWindow = appWindows.reduce((highest, current) => {
                    const currentZ = parseInt(current.element.style.zIndex) || 0;
                    const highestZ = parseInt(highest.element.style.zIndex) || 0;
                    return currentZ > highestZ ? current : highest;
                }, appWindows[0]);
                
                // Activate only the topmost window
                this.system.windowManager.activateWindow(topmostWindow.id);
            }
        } else {
            try {
                // For Finder, create a new window when clicked if no windows exist
                // For other apps, just launch them normally
                if (appId === 'finder') {
                    await this.system.appSystem.launchApp(appId, { createWindow: true });
                } else {
                    await this.system.appSystem.launchApp(appId);
                }
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

    // Add this method to update all indicators
    updateAllIndicators() {
        for (const [appId, indicator] of this.runningIndicators) {
            const isRunning = this.system.appSystem.isAppRunning(appId);
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
                    await this.system.appSystem.launchApp('finder', { createWindow: true });
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
            { label: 'Empty Trash', action: () => this.emptyTrash() }
        ];

        const trashItem = e.target.closest('.dock-trash-icon');
        this.showDockContextMenu(trashItem, menuItems);
    }

    async emptyTrash() {
        // Check if there's already an empty trash dialog
        const existingDialog = Array.from(this.system.windowManager.windows.values())
            .find(win => win.element.classList.contains('empty-trash-dialog'));

        if (existingDialog) {
            // If dialog exists, just bring it to front
            this.system.windowManager.activateWindow(existingDialog.id);
            return;
        }

        // Create a proper app object for the dialog
        const dialogApp = {
            id: 'finder',  // Use finder ID since this is a Finder alert
            name: 'Finder',
            parentApp: this.system.appSystem.getRunningApp('finder'),  // Store reference to parent app
            getMenus() {
                if (!this.parentApp) return {};

                // Get parent app's menus
                const parentMenus = this.parentApp.getMenus();
                
                // Create a disabled version of all menu items
                const disabledMenus = {};
                for (const [key, menu] of Object.entries(parentMenus)) {
                    disabledMenus[key] = {
                        title: menu.title,
                        items: menu.items.map(item => {
                            if (item.type === 'separator') {
                                return { type: 'separator' };
                            }
                            return {
                                label: item.label,
                                shortcut: item.shortcut,
                                enabled: () => false,  // Disable all menu items
                                action: () => {}  // Empty action
                            };
                        })
                    };
                }

                return disabledMenus;
            },
            getWindowState() {
                return null;
            },
            system: this.system
        };

        // Create dialog as a special window
        const dialog = document.createElement('div');
        dialog.className = 'window empty-trash-dialog';
        dialog.innerHTML = `
            <div class="window-content dialog-content">
                <img src="assets/icons/trash-icon.svg" alt="Trash" class="dialog-icon">
                <h2>Are you sure you want to permanently erase the items in the Trash?</h2>
                <p>You can't undo this action.</p>
                <div class="dialog-buttons">
                    <button class="dialog-button" id="cancel-empty-trash">Cancel</button>
                    <button class="dialog-button dialog-button-danger" id="confirm-empty-trash">Empty Trash</button>
                </div>
            </div>
        `;

        // Add styles specific to this dialog
        const style = document.createElement('style');
        style.textContent = `
            .empty-trash-dialog {
                position: fixed;
                background: var(--window-bg-75);
                backdrop-filter: var(--blur-filter);
                border-radius: 12px;
                box-shadow: 0 0 0 0.5px #404040, 0 0 0 1px black, 0 5px 30px rgba(0, 0, 0, 0.3);
                width: 280px;
                height: auto;
                animation: windowAppear 0.2s ease-out;
                user-select: none;
            }

            .empty-trash-dialog.active {
                box-shadow: 0 0 0 0.5px #404040, 0 0 0 1px black, 0 5px 30px rgba(0, 0, 0, 0.5);
            }

            .empty-trash-dialog .window-content {
                padding: 24px 16px 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                height: 100%;
            }

            .empty-trash-dialog .dialog-icon {
                width: 64px;
                height: 64px;
                margin-bottom: 16px;
                pointer-events: none;
            }

            .empty-trash-dialog h2 {
                color: var(--text-color);
                font-size: 16px;
                margin: 0 0 8px 0;
                font-weight: 500;
                pointer-events: none;
            }

            .empty-trash-dialog p {
                color: var(--text-secondary);
                font-size: 13px;
                margin: 0 0 24px 0;
                pointer-events: none;
            }

            .empty-trash-dialog .dialog-buttons {
                display: flex;
                gap: 8px;
                justify-content: center;
            }

            .empty-trash-dialog .dialog-button {
                padding: 6px 12px;
                border-radius: 6px;
                border: none;
                background: #ffffff40;
                color: var(--text-color);
                width: 120px;
                height: 32px;
                font-size: 12px;
                font-weight: bold;
                font-family: 'Inter';
                cursor: pointer;
                transition: background 0.2s;
            }

            .empty-trash-dialog .dialog-button:hover {
                background: var(--button-hover-bg);
            }

            .empty-trash-dialog .dialog-button-danger {
                background: var(--danger-color, #ff3b30);
                color: white;
            }

            .empty-trash-dialog .dialog-button-danger:hover {
                background: var(--danger-color-hover, #ff2d55);
            }
        `;

        document.head.appendChild(style);
        document.getElementById('desktop').appendChild(dialog);

        // Center the dialog on screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dialogWidth = 280;
        const dialogHeight = 250; // Approximate height
        dialog.style.left = `${(viewportWidth - dialogWidth) / 2}px`;
        dialog.style.top = `${(viewportHeight - dialogHeight) / 2}px`;

        // Create a special window object to track this dialog
        const dialogWindow = {
            id: 'empty-trash-dialog-' + Date.now(),
            element: dialog,
            app: dialogApp,
            isDialog: true,
            isMinimized: false,
            isMaximized: false,
            setTitle: () => {},  // No-op since dialog doesn't have a title bar
            minimize: () => {},   // No-op since dialog can't be minimized
            maximize: () => {},   // No-op since dialog can't be maximized
            restore: () => {},    // No-op since dialog can't be restored
            close: () => cleanup()
        };

        // Make dialog draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        const handleMouseDown = (e) => {
            // Only allow dragging from the dialog content, not the buttons
            if (e.target.closest('.dialog-buttons')) return;

            isDragging = true;
            initialX = e.clientX - dialog.offsetLeft;
            initialY = e.clientY - dialog.offsetTop;

            // Bring window to front when starting to drag
            this.system.windowManager.activateWindow(dialogWindow.id);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            dialog.style.left = `${currentX}px`;
            dialog.style.top = `${currentY}px`;
        };

        const handleMouseUp = () => {
            isDragging = false;
        };

        dialog.addEventListener('mousedown', (e) => {
            handleMouseDown(e);
            // Bring window to front when clicked anywhere
            this.system.windowManager.activateWindow(dialogWindow.id);
        });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Add to window manager and its stack
        this.system.windowManager.windows.set(dialogWindow.id, dialogWindow);
        this.system.windowManager.windowStack.push(dialogWindow);
        this.system.windowManager.activateWindow(dialogWindow.id);

        return new Promise((resolve) => {
            const cancelBtn = dialog.querySelector('#cancel-empty-trash');
            const confirmBtn = dialog.querySelector('#confirm-empty-trash');

            const cleanup = () => {
                dialog.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                this.system.windowManager.windowStack = this.system.windowManager.windowStack.filter(w => w !== dialogWindow);
                this.system.windowManager.windows.delete(dialogWindow.id);
                dialog.remove();
                style.remove();
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', async () => {
                cleanup();
                resolve(true);
                
                try {
                    // Get all items in the Trash folder
                    const filesystem = await this.system.filesystem.readDirectory('/Trash');
                    
                    // Delete each item
                    for (const item of filesystem) {
                        await this.system.filesystem.deleteEntry(`/Trash/${item.name}`);
                    }

                    // Show success notification
                    this.system.showNotification(
                        'Trash',
                        'Trash has been emptied',
                        'assets/icons/trash-icon.svg'
                    );

                    // Refresh any open Trash windows
                    const trashWindows = Array.from(this.system.windowManager.windows.values())
                        .filter(win => win.app.id === 'finder' && win.app.getWindowState(win)?.currentPath === '/Trash');
                    
                    for (const window of trashWindows) {
                        await window.app.loadDirectory(window, '/Trash');
                    }
                } catch (error) {
                    console.error('Failed to empty trash:', error);
                    this.system.showNotification(
                        'Trash',
                        'Failed to empty the Trash',
                        'assets/icons/trash-icon.svg'
                    );
                }
            });
        });
    }

    showDockContextMenu(dockItem, items) {
        // Close other types of menus
        this.closeOtherMenuTypes('dock');

        // If there's an existing menu, close it and wait for transitions
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            // First remove the active class to trigger fade out
            existingMenu.classList.remove('active');
            
            // Wait for menu fade out
            setTimeout(() => {
                this.closeContextMenu();
                // Wait for icon transform transitions (200ms is the transform transition time in CSS)
                setTimeout(() => this.createAndShowContextMenu(dockItem, items), 200);
            }, 150); // Wait for menu fade out (matches the 0.15s in CSS)
            return;
        }

        this.createAndShowContextMenu(dockItem, items);
    }

    createAndShowContextMenu(dockItem, items) {
        // Add class to indicate context menu is open
        dockItem.classList.add('context-menu-open');
        this.element.querySelector('.dock-container').classList.add('has-open-menu');

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu dock-context-menu';
        menu.dataset.menuType = 'dock';  // Add menu type identifier

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
            // Remove the has-open-menu class from dock container
            this.element.querySelector('.dock-container').classList.remove('has-open-menu');
            existingMenu.remove();
        }
    }

    closeOtherMenuTypes(currentType) {
        // Close all other menu types
        window.menuManagers.forEach(manager => {
            if (manager !== this) {
                // Try different close methods based on manager type
                if (manager.closeAllMenus) {
                    manager.closeAllMenus();
                } else if (manager.closeContextMenu) {
                    manager.closeContextMenu();
                }
            }
        });
    }
}

window.Dock = Dock; 