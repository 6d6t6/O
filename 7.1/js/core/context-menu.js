class ContextMenuManager {
    constructor(system) {
        this.system = system;
        this.activeContextMenu = null;
        this.menuHierarchy = new Map(); // Maps menu elements to their parent and children
        this.closeTimeout = null;  // For delayed submenu closing
        this.setupEventListeners();

        // Register this manager with the system
        if (!window.menuManagers) {
            window.menuManagers = new Set();
        }
        window.menuManagers.add(this);
    }

    setupEventListeners() {
        // Close context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.closeContextMenu();
            }
        });

        // Close context menu when window loses focus
        window.addEventListener('blur', () => {
            this.closeContextMenu();
        });

        // Close context menu when scrolling
        document.addEventListener('scroll', () => {
            this.closeContextMenu();
        });

        // Close context menu when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeContextMenu();
            }
        });
    }

    showContextMenu(e, items) {
        e.preventDefault();
        
        // Close other types of menus
        this.closeOtherMenuTypes('context');
        
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu active';
        menu.dataset.menuType = 'context';
        menu.dataset.level = '0'; // Root level

        this.createMenuItems(menu, items);

        // Position the menu at cursor
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        // Add to document and hierarchy
        document.body.appendChild(menu);
        this.activeContextMenu = menu;
        this.menuHierarchy.set(menu, { parent: null, children: new Set() });

        // Adjust position if menu goes off-screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${e.clientX - menuRect.width}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${e.clientY - menuRect.height}px`;
        }
    }

    createMenuItems(menu, items) {
        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                
                // Create label container
                const labelContainer = document.createElement('div');
                labelContainer.className = 'menu-item-label';

                // Handle radio/checkbox items
                if (item.type === 'radio' || item.type === 'checkbox') {
                    const indicator = document.createElement('span');
                    indicator.className = `menu-item-indicator ${item.type}`;
                    if (item.checked) {
                        indicator.classList.add('checked');
                    }
                    labelContainer.appendChild(indicator);
                }

                // Add icon if exists
                if (item.icon) {
                    const icon = document.createElement('img');
                    icon.src = item.icon;
                    icon.className = 'menu-item-icon';
                    labelContainer.appendChild(icon);
                }

                const label = document.createElement('span');
                label.textContent = item.label;
                labelContainer.appendChild(label);
                menuItem.appendChild(labelContainer);

                // Add submenu arrow if has items
                if (item.items) {
                    const arrow = document.createElement('span');
                    arrow.className = 'submenu-arrow material-symbols-rounded';
                    arrow.textContent = 'chevron_right';
                    menuItem.appendChild(arrow);
                    menuItem.dataset.submenuId = Math.random().toString(36).substr(2, 9);
                }

                // Add shortcut if exists
                if (item.shortcut) {
                    const shortcutSpan = document.createElement('span');
                    shortcutSpan.className = 'menu-shortcut';
                    shortcutSpan.textContent = item.shortcut;
                    menuItem.appendChild(shortcutSpan);
                }

                // Handle disabled state
                if (typeof item.enabled === 'function' && !item.enabled()) {
                    menuItem.classList.add('disabled');
                }

                this.setupMenuItemEvents(menuItem, item, menu);
                menu.appendChild(menuItem);
            }
        });
    }

    setupMenuItemEvents(menuItem, item, parentMenu) {
        if (!menuItem.classList.contains('disabled')) {
            // Handle mouseenter for all menu items
            menuItem.addEventListener('mouseenter', () => {
                // Close sibling submenus
                this.closeSiblingSubmenus(menuItem);
                
                // Show submenu if this item has items
                if (item.items) {
                    this.showSubmenu(menuItem, item.items, parentMenu);
                }
            });

            // Handle mouseleave for items with submenus
            if (item.items) {
                menuItem.addEventListener('mouseleave', (e) => {
                    this.handleMenuItemMouseLeave(menuItem, e);
                });
            }

            // Handle click
            menuItem.addEventListener('click', (event) => {
                event.stopPropagation();
                
                // Handle radio/checkbox state
                if (item.type === 'radio' || item.type === 'checkbox') {
                    const indicator = menuItem.querySelector('.menu-item-indicator');
                    if (item.type === 'radio') {
                        // Uncheck all other radio items in the group
                        const group = parentMenu.querySelectorAll('.menu-item-indicator.radio');
                        group.forEach(radio => radio.classList.remove('checked'));
                    }
                    indicator.classList.toggle('checked');
                    item.checked = indicator.classList.contains('checked');
                }

                if (item.action) {
                    this.closeContextMenu();
                    item.action();
                }
            });
        }
    }

    showSubmenu(parentItem, items, parentMenu) {
        const parentLevel = parseInt(parentMenu.dataset.level);
        
        // Check if there's already a submenu at this level + 1
        const existingSubmenuAtLevel = document.querySelector(`.context-menu[data-level="${parentLevel + 1}"]`);
        if (existingSubmenuAtLevel) {
            this.closeSubmenuHierarchy(existingSubmenuAtLevel);
        }

        const submenu = document.createElement('div');
        submenu.className = 'context-menu submenu active';
        submenu.dataset.menuType = 'context';
        submenu.dataset.parent = parentItem.dataset.submenuId;
        submenu.dataset.level = (parentLevel + 1).toString();

        // Add hover state to parent item
        parentItem.classList.add('has-open-submenu');

        this.createMenuItems(submenu, items);

        // Position submenu relative to parent item
        const parentRect = parentItem.getBoundingClientRect();
        
        // Align with the parent item's top position minus 6px for better visual alignment
        submenu.style.top = `${parentRect.top - 4}px`;
        submenu.style.left = `${parentRect.right}px`;

        // Add to document and hierarchy
        document.body.appendChild(submenu);
        const hierarchyInfo = this.menuHierarchy.get(parentMenu);
        if (hierarchyInfo) {
            hierarchyInfo.children.add(submenu);
            this.menuHierarchy.set(submenu, { parent: parentMenu, children: new Set() });
        }

        // Adjust position based on available space
        this.adjustSubmenuPosition(submenu, parentItem);
    }

    adjustSubmenuPosition(submenu, parentItem) {
        const parentRect = parentItem.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Horizontal positioning
        const roomOnRight = (parentRect.right + submenuRect.width) <= windowWidth;
        const roomOnLeft = (parentRect.left - submenuRect.width) >= 0;

        if (roomOnRight) {
            // Position exactly at the right edge
            submenu.style.left = `${parentRect.right}px`;
            submenu.dataset.position = 'right';
        } else if (roomOnLeft) {
            // Position exactly at the left edge with a small gap (2px) to prevent overlap
            submenu.style.left = `${parentRect.left - submenuRect.width - 2}px`;
            submenu.dataset.position = 'left';
        } else {
            const spaceOnRight = windowWidth - parentRect.right;
            const spaceOnLeft = parentRect.left;
            if (spaceOnRight >= spaceOnLeft) {
                // Position on right with screen edge consideration
                submenu.style.left = `${Math.min(parentRect.right, windowWidth - submenuRect.width)}px`;
                submenu.dataset.position = 'right';
            } else {
                // Position on left with screen edge consideration and small gap
                submenu.style.left = `${Math.max(0, parentRect.left - submenuRect.width - 2)}px`;
                submenu.dataset.position = 'left';
            }
        }

        // Vertical positioning
        const spaceBelow = windowHeight - (parentRect.top - 6); // Account for the 6px offset
        const spaceAbove = parentRect.bottom - 6; // Account for the 6px offset
        
        if (submenuRect.height <= spaceBelow) {
            // Keep current vertical position (aligned with parent item minus 6px)
        } else if (submenuRect.height <= spaceAbove) {
            submenu.style.top = `${parentRect.bottom - submenuRect.height - 6}px`;
        } else {
            if (spaceBelow >= spaceAbove) {
                submenu.style.top = `${Math.min(parentRect.top - 6, windowHeight - submenuRect.height)}px`;
            } else {
                submenu.style.top = `${Math.max(0, parentRect.bottom - submenuRect.height - 6)}px`;
            }
        }
    }

    handleMenuItemMouseLeave(menuItem, e) {
        const parentMenu = menuItem.closest('.context-menu');
        const submenu = this.findSubmenuByParentId(menuItem.dataset.submenuId);
        
        if (!submenu) return;

        const submenuRect = submenu.getBoundingClientRect();
        const menuItemRect = menuItem.getBoundingClientRect();
        const isSubmenuOnLeft = submenu.dataset.position === 'left';
        
        // Add padding to the safe zone (10px on each side)
        const padding = 10;
        
        // Calculate the safe zone for mouse movement with padding
        const safeZone = {
            left: isSubmenuOnLeft ? submenuRect.left - padding : menuItemRect.left - padding,
            right: isSubmenuOnLeft ? menuItemRect.right + padding : submenuRect.right + padding,
            top: Math.min(menuItemRect.top, submenuRect.top) - padding,
            bottom: Math.max(menuItemRect.bottom, submenuRect.bottom) + padding
        };

        // Add a diagonal safe zone for more natural mouse movement
        const isDiagonalSafe = () => {
            if (isSubmenuOnLeft) {
                // Moving towards left submenu
                return e.clientX <= menuItemRect.left &&
                       e.clientX >= submenuRect.right - 50 && // More forgiving diagonal area
                       e.clientY >= safeZone.top &&
                       e.clientY <= safeZone.bottom;
            } else {
                // Moving towards right submenu
                return e.clientX >= menuItemRect.right &&
                       e.clientX <= submenuRect.left + 50 && // More forgiving diagonal area
                       e.clientY >= safeZone.top &&
                       e.clientY <= safeZone.bottom;
            }
        };

        // Check if mouse is within the safe zone
        const isInSafeZone = 
            e.clientX >= safeZone.left &&
            e.clientX <= safeZone.right &&
            e.clientY >= safeZone.top &&
            e.clientY <= safeZone.bottom;

        // Check if mouse is moving towards submenu with a more forgiving angle
        const isMovingTowardsSubmenu = isSubmenuOnLeft ?
            (e.clientX <= menuItemRect.left && e.clientX >= submenuRect.left - padding) :
            (e.clientX >= menuItemRect.right && e.clientX <= submenuRect.right + padding);

        // Clear any existing timeout
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }

        if (!isInSafeZone && !isMovingTowardsSubmenu && !isDiagonalSafe()) {
            // Set a small delay before closing
            this.closeTimeout = setTimeout(() => {
                this.closeSubmenuHierarchy(submenu);
            }, 100); // 100ms delay
        }
    }

    findSubmenuByParentId(parentId) {
        return document.querySelector(`.submenu[data-parent="${parentId}"]`);
    }

    closeSiblingSubmenus(menuItem) {
        const parentMenu = menuItem.closest('.context-menu');
        const hierarchyInfo = this.menuHierarchy.get(parentMenu);
        
        if (hierarchyInfo) {
            parentMenu.querySelectorAll('.context-menu-item').forEach(item => {
                if (item !== menuItem && item.classList.contains('has-open-submenu')) {
                    item.classList.remove('has-open-submenu');
                    const submenuId = item.dataset.submenuId;
                    if (submenuId) {
                        const submenu = this.findSubmenuByParentId(submenuId);
                        if (submenu) {
                            this.closeSubmenuHierarchy(submenu);
                        }
                    }
                }
            });
        }
    }

    closeSubmenuHierarchy(submenu) {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }

        const hierarchyInfo = this.menuHierarchy.get(submenu);
        if (hierarchyInfo) {
            // Close all children first
            hierarchyInfo.children.forEach(childMenu => {
                this.closeSubmenuHierarchy(childMenu);
            });

            // Remove hover state from parent item
            const parentId = submenu.dataset.parent;
            if (parentId) {
                const parentItem = document.querySelector(`[data-submenu-id="${parentId}"]`);
                if (parentItem) {
                    parentItem.classList.remove('has-open-submenu');
                }
            }

            // Remove from hierarchy and DOM
            this.menuHierarchy.delete(submenu);
            submenu.remove();
        }
    }

    closeContextMenu() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }

        if (this.activeContextMenu) {
            this.closeSubmenuHierarchy(this.activeContextMenu);
            this.menuHierarchy.delete(this.activeContextMenu);
            this.activeContextMenu.remove();
            this.activeContextMenu = null;
        }
    }

    closeOtherMenuTypes(currentType) {
        window.menuManagers.forEach(manager => {
            if (manager !== this) {
                if (manager.closeAllMenus) {
                    manager.closeAllMenus();
                } else if (manager.closeContextMenu) {
                    manager.closeContextMenu();
                }
            }
        });
    }
}

// Add to window object
window.ContextMenuManager = ContextMenuManager; 