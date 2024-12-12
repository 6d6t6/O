class MenuBarManager {
    constructor(system) {
        this.system = system;
        this.element = document.getElementById('menu-bar');
        this.activeMenus = null;
        this.openMenus = new Set();
        this.activeApp = null;
        this.hoverTimeout = null;

        // Default system menus that are always available
        this.systemMenus = {
            omega: {
                title: '',
                icon: 'assets/omega-logo.svg',
                items: [
                    { label: 'About OMEGA OS', action: () => this.system.showAboutDialog() },
                    { type: 'separator' },
                    { label: 'System Settings...', action: () => this.system.openApp('settings') },
                    { type: 'separator' },
                    { label: 'Sleep', action: () => this.system.sleep() },
                    { label: 'Restart...', action: () => this.system.restart() },
                    { label: 'Shut Down...', action: () => this.system.shutdown() },
                    { type: 'separator' },
                    { label: 'Lock Screen', action: () => this.system.lockScreen() },
                    { label: 'Log Out...', action: () => this.system.logOut() }
                ]
            }
        };

        // Initialize with Finder as the default active app
        this.initializeFinder();
        this.setupEventListeners();
    }

    async initializeFinder() {
        // Create and register Finder if not already done
        if (!this.system.appSystem?.getRunningApp('finder')) {
            await this.system.appSystem?.registerApp({
                id: 'finder',
                name: 'Finder',
                icon: 'assets/icons/finder-icon.svg'
            });
            await this.system.appSystem?.launchApp('finder', { noWindow: true });
            // Set Finder as the active app immediately
            this.setActiveApp(this.system.appSystem?.getRunningApp('finder'));
        }
    }

    setupEventListeners() {
        // Handle menu item clicks
        this.element.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (!menuItem) return;

            const menuId = menuItem.dataset.menuId || menuItem.id === 'omega-menu' ? 'omega' : menuItem.textContent.toLowerCase();
            this.toggleMenu(menuItem, menuId);
        });

        // Handle menu item hover
        this.element.addEventListener('mouseover', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (!menuItem || !this.openMenus.size) return;

            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => {
                const menuId = menuItem.dataset.menuId || menuItem.id === 'omega-menu' ? 'omega' : menuItem.textContent.toLowerCase();
                this.switchToMenu(menuItem, menuId);
            }, 50);
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#menu-bar') && !e.target.closest('.menu-dropdown')) {
                this.closeAllMenus();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.metaKey || e.ctrlKey) {
                this.handleKeyboardShortcut(e);
            }
        });
    }

    setActiveApp(app) {
        // If no app is provided, set Finder as active
        if (!app) {
            app = this.system.appSystem?.getRunningApp('finder');
        }
        
        this.activeApp = app;
        this.updateMenus();
    }

    updateMenus() {
        // Clear existing menu items except the omega menu
        const items = this.element.querySelectorAll('.menu-item:not(#omega-menu)');
        items.forEach(item => item.remove());

        // Get active app's menus
        this.activeMenus = this.activeApp ? 
            { ...this.systemMenus, ...this.getAppMenus() } : 
            { ...this.systemMenus, ...this.getFinderMenus() };

        // Create menu items
        Object.entries(this.activeMenus).forEach(([id, menu]) => {
            if (id === 'omega') return; // Skip omega menu as it's already there

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = menu.title;
            menuItem.dataset.menuId = id;

            // Insert before system tray
            const systemTray = this.element.querySelector('.system-tray');
            this.element.insertBefore(menuItem, systemTray);
        });

        // Update app name
        const appNameEl = this.element.querySelector('.active-app-name');
        if (appNameEl) {
            appNameEl.textContent = this.activeApp ? this.activeApp.name : 'Finder';
        }
    }

    getAppMenus() {
        if (!this.activeApp) return this.getFinderMenus();

        const appMenus = this.activeApp.getMenus();
        const appName = this.activeApp.name;
        const isNotFinder = this.activeApp.id !== 'finder';

        // Add app-specific menu as first menu after omega menu
        return {
            [this.activeApp.id]: {
                title: appName,
                items: [
                    { label: `About ${appName}`, action: () => this.activeApp.handleMenuAction('about') },
                    { type: 'separator' },
                    { label: `Hide ${appName}`, shortcut: '⌘+H', action: () => this.activeApp.handleMenuAction('hide') },
                    { label: 'Hide Others', shortcut: '⌥+⌘+H', action: () => this.activeApp.handleMenuAction('hideOthers') },
                    { label: 'Show All', action: () => this.activeApp.handleMenuAction('showAll') },
                    ...(isNotFinder ? [
                        { type: 'separator' },
                        { label: `Quit ${appName}`, shortcut: '⌘+Q', action: () => this.system.appSystem.terminateApp(this.activeApp.id) }
                    ] : [])
                ]
            },
            ...appMenus
        };
    }

    getFinderMenus() {
        const finder = this.system.appSystem?.getRunningApp('finder');
        return finder ? finder.getMenus() : {};
    }

    switchToMenu(menuItem, menuTitle) {
        if (!this.openMenus.size) return;

        const currentActive = this.element.querySelector('.menu-item.active');
        if (currentActive === menuItem) return;

        // Close all dropdowns but keep track that menus are open
        document.querySelectorAll('.menu-dropdown').forEach(el => el.remove());
        
        // Remove active state from previous menu
        if (currentActive) {
            currentActive.classList.remove('active');
        }

        // Show the new menu
        this.showMenuDropdown(menuItem, menuTitle);
    }

    toggleMenu(menuItem, menuTitle) {
        if (menuItem.classList.contains('active')) {
            this.closeAllMenus();
        } else {
            this.openMenu(menuItem, menuTitle);
        }
    }

    openMenu(menuItem, menuTitle) {
        // Close any open menus first
        this.closeAllMenus();
        
        // Show the menu dropdown
        this.showMenuDropdown(menuItem, menuTitle);
        
        // Add to open menus set
        this.openMenus.add(menuItem);
    }

    showMenuDropdown(menuItem, menuTitle) {
        const menuId = menuItem.dataset.menuId || menuTitle.toLowerCase();
        const menu = this.activeMenus[menuId];
        if (!menu) return;

        // Create and show menu dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        
        menu.items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'menu-separator';
                dropdown.appendChild(separator);
            } else {
                const menuItemEl = document.createElement('div');
                menuItemEl.className = 'menu-item';
                
                // Check if item should be enabled
                const isEnabled = typeof item.enabled === 'function' ? item.enabled() : true;
                if (!isEnabled) {
                    menuItemEl.classList.add('disabled');
                }
                
                // Create label container
                const labelContainer = document.createElement('div');
                labelContainer.className = 'menu-item-label';
                labelContainer.textContent = item.label;
                menuItemEl.appendChild(labelContainer);

                // Add submenu arrow if has items
                if (item.items) {
                    const arrow = document.createElement('span');
                    arrow.className = 'submenu-arrow';
                    arrow.textContent = '›';
                    menuItemEl.appendChild(arrow);
                }

                // Add shortcut if exists
                if (item.shortcut) {
                    const shortcutSpan = document.createElement('span');
                    shortcutSpan.className = 'menu-shortcut';
                    shortcutSpan.textContent = item.shortcut;
                    menuItemEl.appendChild(shortcutSpan);
                }

                if (item.items) {
                    // Handle submenu hover
                    menuItemEl.addEventListener('mouseover', () => {
                        if (!menuItemEl.classList.contains('disabled')) {
                            this.showSubmenu(menuItemEl, item.items);
                        }
                    });

                    menuItemEl.addEventListener('mouseleave', (e) => {
                        // Check if moving to submenu
                        const submenu = menuItemEl.querySelector('.submenu');
                        if (submenu && !submenu.contains(e.relatedTarget)) {
                            submenu.remove();
                        }
                    });
                }

                if (item.action && isEnabled) {
                    menuItemEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.closeAllMenus();
                        item.action();
                    });
                }

                dropdown.appendChild(menuItemEl);
            }
        });

        // Position the dropdown
        const menuRect = menuItem.getBoundingClientRect();
        dropdown.style.top = `${menuRect.bottom}px`;
        dropdown.style.left = `${menuRect.left}px`;

        document.body.appendChild(dropdown);
        menuItem.classList.add('active');
    }

    showSubmenu(parentItem, items) {
        // Remove any existing submenu
        const existingSubmenu = parentItem.querySelector('.submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }

        // Create submenu
        const submenu = document.createElement('div');
        submenu.className = 'menu-dropdown submenu';

        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'menu-separator';
                submenu.appendChild(separator);
            } else {
                const menuItemEl = document.createElement('div');
                menuItemEl.className = 'menu-item';
                
                const labelContainer = document.createElement('div');
                labelContainer.className = 'menu-item-label';
                labelContainer.textContent = item.label;
                menuItemEl.appendChild(labelContainer);

                if (item.shortcut) {
                    const shortcutSpan = document.createElement('span');
                    shortcutSpan.className = 'menu-shortcut';
                    shortcutSpan.textContent = item.shortcut;
                    menuItemEl.appendChild(shortcutSpan);
                }

                if (item.action) {
                    menuItemEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.closeAllMenus();
                        item.action();
                    });
                }

                submenu.appendChild(menuItemEl);
            }
        });

        // Position submenu
        const parentRect = parentItem.getBoundingClientRect();
        submenu.style.top = `${parentRect.top}px`;
        submenu.style.left = `${parentRect.right}px`;

        parentItem.appendChild(submenu);
    }

    closeAllMenus() {
        // Remove all dropdowns
        document.querySelectorAll('.menu-dropdown').forEach(el => el.remove());
        
        // Remove active states
        document.querySelectorAll('.menu-item.active').forEach(el => {
            el.classList.remove('active');
        });

        // Clear open menus set
        this.openMenus.clear();
    }

    handleKeyboardShortcut(e) {
        if (!this.activeMenus) return;

        // Check all menus for matching shortcuts
        Object.values(this.activeMenus).forEach(menu => {
            menu.items.forEach(item => {
                if (item.shortcut && this.matchesShortcut(e, item.shortcut)) {
                    e.preventDefault();
                    item.action();
                }
            });
        });
    }

    matchesShortcut(e, shortcut) {
        const parts = shortcut.toLowerCase().split('+');
        const key = parts.pop();

        const hasCmd = parts.includes('⌘') && e.metaKey;
        const hasCtrl = parts.includes('ctrl') && e.ctrlKey;
        const hasShift = parts.includes('shift') && e.shiftKey;
        const hasAlt = (parts.includes('alt') || parts.includes('⌥')) && e.altKey;

        return (e.key.toLowerCase() === key) && 
               (hasCmd || hasCtrl) && 
               (!parts.includes('shift') || hasShift) && 
               (!parts.includes('alt') && !parts.includes('⌥') || hasAlt);
    }

    handleMenuAction(action) {
        const activeWindow = this.system.windowManager.activeWindow;
        
        switch (action) {
            case 'close':
                if (activeWindow && activeWindow.app === this.activeApp) {
                    this.system.windowManager.closeWindow(activeWindow.id);
                }
                break;
            case 'minimize':
                if (activeWindow && activeWindow.app === this.activeApp) {
                    this.system.windowManager.minimizeWindow(activeWindow.id);
                }
                break;
            // ... existing code ...
        }
    }
}

window.MenuBarManager = MenuBarManager; 