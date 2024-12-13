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
        this.system.showNotification(
            "Trash",
            "Trash functionality is not implemented yet!"
        );
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
            { label: 'Empty Trash', action: () => {
                this.system.showNotification('Trash', 'Empty Trash functionality is not implemented yet!');
            }}
        ];

        const trashItem = e.target.closest('.dock-trash-icon');
        this.showDockContextMenu(trashItem, menuItems);
    }

    showDockContextMenu(dockItem, items) {
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
}

window.Dock = Dock; 