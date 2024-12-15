class ContextMenuManager {
    constructor(system) {
        this.system = system;
        this.activeContextMenu = null;
        this.activeSubmenus = new Set();
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
        menu.dataset.menuType = 'context';  // Add menu type identifier

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
                    arrow.className = 'submenu-arrow';
                    arrow.textContent = '›';
                    menuItem.appendChild(arrow);
                }

                // Handle mouseenter for ALL menu items
                menuItem.addEventListener('mouseenter', () => {
                    if (!menuItem.classList.contains('disabled')) {
                        // Close any open submenus from sibling menu items
                        const parentMenu = menuItem.closest('.context-menu');
                        if (parentMenu) {
                            parentMenu.querySelectorAll('.context-menu-item').forEach(item => {
                                if (item !== menuItem) {
                                    item.classList.remove('has-open-submenu');
                                    const submenuId = item.dataset.submenuId;
                                    if (submenuId) {
                                        const submenu = document.querySelector('.submenu[data-parent="' + submenuId + '"]');
                                        if (submenu) {
                                            this.closeSubmenu(submenu);
                                        }
                                    }
                                }
                            });
                        }
                        // Only show submenu if this item has items
                        if (item.items) {
                            this.showSubmenu(menuItem, item.items);
                        }
                    }
                });

                if (item.items) {
                    menuItem.addEventListener('mouseleave', (e) => {
                        const submenu = document.querySelector('.submenu[data-parent="' + menuItem.dataset.submenuId + '"]');
                        this.handleSubmenuMouseLeave(menuItem, submenu, e);
                    });
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

                // Handle click
                if (!menuItem.classList.contains('disabled')) {
                    menuItem.addEventListener('click', (event) => {
                        event.stopPropagation();
                        
                        // Handle radio/checkbox state
                        if (item.type === 'radio' || item.type === 'checkbox') {
                            const indicator = menuItem.querySelector('.menu-item-indicator');
                            if (item.type === 'radio') {
                                // Uncheck all other radio items in the group
                                const group = menu.querySelectorAll('.menu-item-indicator.radio');
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

                // Add unique ID for submenu tracking
                if (item.items) {
                    menuItem.dataset.submenuId = Math.random().toString(36).substr(2, 9);
                }

                menu.appendChild(menuItem);
            }
        });

        // Position the menu at cursor
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;

        // Add to document
        document.body.appendChild(menu);
        this.activeContextMenu = menu;

        // Adjust position if menu goes off-screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${e.clientX - menuRect.width}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${e.clientY - menuRect.height}px`;
        }
    }

    showSubmenu(parentItem, items) {
        // Remove any existing submenu from this parent
        const existingSubmenu = document.querySelector('.submenu[data-parent="' + parentItem.dataset.submenuId + '"]');
        if (existingSubmenu) {
            this.closeSubmenu(existingSubmenu);
        }

        // Create submenu
        const submenu = document.createElement('div');
        submenu.className = 'context-menu submenu active';
        submenu.dataset.parent = parentItem.dataset.submenuId;
        submenu.dataset.menuType = 'context';  // Add menu type identifier

        // Add hover state to parent item
        parentItem.classList.add('has-open-submenu');

        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                submenu.appendChild(separator);
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

                // Add nested submenu arrow if has items
                if (item.items) {
                    const arrow = document.createElement('span');
                    arrow.className = 'submenu-arrow';
                    arrow.textContent = '›';
                    menuItem.appendChild(arrow);

                    // Add unique ID for submenu tracking
                    menuItem.dataset.submenuId = Math.random().toString(36).substr(2, 9);

                    // Handle nested submenu hover
                    menuItem.addEventListener('mouseenter', () => {
                        if (!menuItem.classList.contains('disabled')) {
                            // Remove other submenus at this level
                            submenu.querySelectorAll('.context-menu-item').forEach(item => {
                                if (item !== menuItem) {
                                    const submenuId = item.dataset.submenuId;
                                    if (submenuId) {
                                        const nestedSubmenu = document.querySelector('.submenu[data-parent="' + submenuId + '"]');
                                        if (nestedSubmenu) {
                                            this.closeSubmenu(nestedSubmenu);
                                        }
                                    }
                                }
                            });
                            this.showSubmenu(menuItem, item.items);
                        }
                    });

                    menuItem.addEventListener('mouseleave', (e) => {
                        const nestedSubmenu = document.querySelector('.submenu[data-parent="' + menuItem.dataset.submenuId + '"]');
                        if (nestedSubmenu) {
                            const submenuRect = nestedSubmenu.getBoundingClientRect();
                            const menuItemRect = menuItem.getBoundingClientRect();
                            
                            // Check if submenu is on the left or right side
                            const isSubmenuOnLeft = submenuRect.right <= menuItemRect.left;
                            
                            // Keep submenu open if moving towards it from either direction
                            if (isSubmenuOnLeft) {
                                if (e.clientX <= menuItemRect.left && 
                                    e.clientX >= submenuRect.left && 
                                    e.clientY >= submenuRect.top && 
                                    e.clientY <= submenuRect.bottom) {
                                    return;
                                }
                            } else {
                                if (e.clientX >= menuItemRect.right && 
                                    e.clientX <= submenuRect.right && 
                                    e.clientY >= submenuRect.top && 
                                    e.clientY <= submenuRect.bottom) {
                                    return;
                                }
                            }
                            this.closeSubmenu(nestedSubmenu);
                        }
                    });
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

                // Handle click
                if (!menuItem.classList.contains('disabled')) {
                    menuItem.addEventListener('click', (event) => {
                        event.stopPropagation();
                        
                        // Handle radio/checkbox state
                        if (item.type === 'radio' || item.type === 'checkbox') {
                            const indicator = menuItem.querySelector('.menu-item-indicator');
                            if (item.type === 'radio') {
                                // Uncheck all other radio items in the group
                                const group = submenu.querySelectorAll('.menu-item-indicator.radio');
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

                submenu.appendChild(menuItem);
            }
        });

        // Position submenu
        const parentRect = parentItem.getBoundingClientRect();
        submenu.style.top = `${parentRect.top}px`;
        submenu.style.left = `${parentRect.right}px`;

        // Add to document body
        document.body.appendChild(submenu);
        this.activeSubmenus.add(submenu);

        // Get accurate submenu dimensions after adding to DOM
        const submenuRect = submenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Determine if there's room on the right
        const roomOnRight = (parentRect.right + submenuRect.width) <= windowWidth;
        const roomOnLeft = (parentRect.left - submenuRect.width) >= 0;

        // Position horizontally
        if (roomOnRight) {
            // Show on right side (default)
            submenu.style.left = `${parentRect.right}px`;
        } else if (roomOnLeft) {
            // Show on left side
            submenu.style.left = `${parentRect.left - submenuRect.width}px`;
        } else {
            // No room on either side, show on the side with more space
            const spaceOnRight = windowWidth - parentRect.right;
            const spaceOnLeft = parentRect.left;
            if (spaceOnRight >= spaceOnLeft) {
                submenu.style.left = `${parentRect.right}px`;
                if (submenuRect.right > windowWidth) {
                    submenu.style.left = `${windowWidth - submenuRect.width}px`;
                }
            } else {
                submenu.style.left = `${parentRect.left - submenuRect.width}px`;
                if (submenuRect.left < 0) {
                    submenu.style.left = '0px';
                }
            }
        }

        // Position vertically
        const spaceBelow = windowHeight - parentRect.top;
        const spaceAbove = parentRect.bottom;
        
        if (submenuRect.height <= spaceBelow) {
            // Enough space below, align with parent top
            submenu.style.top = `${parentRect.top}px`;
        } else if (submenuRect.height <= spaceAbove) {
            // Not enough space below but enough above, show above
            submenu.style.top = `${parentRect.bottom - submenuRect.height}px`;
        } else {
            // Not enough space either way, show where there's more space
            if (spaceBelow >= spaceAbove) {
                submenu.style.top = `${parentRect.top}px`;
                if (submenuRect.bottom > windowHeight) {
                    submenu.style.top = `${windowHeight - submenuRect.height}px`;
                }
            } else {
                submenu.style.top = `${parentRect.bottom - submenuRect.height}px`;
                if (submenuRect.top < 0) {
                    submenu.style.top = '0px';
                }
            }
        }

        // Store the submenu position for mouseleave calculations
        submenu.dataset.position = roomOnRight ? 'right' : 'left';
    }

    closeSubmenu(submenu) {
        if (submenu) {
            // Remove hover state from parent item
            const parentId = submenu.dataset.parent;
            if (parentId) {
                const parentItem = document.querySelector(`[data-submenu-id="${parentId}"]`);
                if (parentItem) {
                    parentItem.classList.remove('has-open-submenu');
                }
            }

            // Close any nested submenus first
            const nestedSubmenus = document.querySelectorAll(`.submenu[data-parent^="${submenu.dataset.parent}"]`);
            nestedSubmenus.forEach(nested => {
                if (nested !== submenu) {
                    this.closeSubmenu(nested);
                }
            });
            submenu.remove();
            this.activeSubmenus.delete(submenu);
        }
    }

    handleSubmenuMouseLeave(menuItem, submenu, e) {
        if (!submenu) return;
        
        const submenuRect = submenu.getBoundingClientRect();
        const menuItemRect = menuItem.getBoundingClientRect();
        const isSubmenuOnLeft = submenu.dataset.position === 'left';
        
        // Calculate the safe zone for mouse movement
        const safeZone = {
            left: isSubmenuOnLeft ? submenuRect.left : menuItemRect.left,
            right: isSubmenuOnLeft ? menuItemRect.right : submenuRect.right,
            top: Math.min(menuItemRect.top, submenuRect.top),
            bottom: Math.max(menuItemRect.bottom, submenuRect.bottom)
        };

        // Check if mouse is within the safe zone
        const isInSafeZone = 
            e.clientX >= safeZone.left &&
            e.clientX <= safeZone.right &&
            e.clientY >= safeZone.top &&
            e.clientY <= safeZone.bottom;

        // Check if mouse is moving towards submenu
        const isMovingTowardsSubmenu = isSubmenuOnLeft ?
            (e.clientX <= menuItemRect.left && e.clientX >= submenuRect.left) :
            (e.clientX >= menuItemRect.right && e.clientX <= submenuRect.right);

        // Only keep submenu open if we're in safe zone AND moving towards submenu
        if (!isInSafeZone || !isMovingTowardsSubmenu) {
            this.closeSubmenu(submenu);
        }
    }

    closeContextMenu() {
        // Close all submenus first
        this.activeSubmenus.forEach(submenu => {
            submenu.remove();
        });
        this.activeSubmenus.clear();

        if (this.activeContextMenu) {
            this.activeContextMenu.remove();
            this.activeContextMenu = null;
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

// Add to window object
window.ContextMenuManager = ContextMenuManager; 