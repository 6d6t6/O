class WindowManager {
    constructor(system) {
        this.system = system;
        this.windows = new Map();
        this.activeWindow = null;
        this.windowStack = []; // Track window stacking order
        
        // Window template
        this.windowTemplate = `
            <div class="window-header">
                <div class="window-controls">
                    <button class="window-control close"></button>
                    <button class="window-control minimize"></button>
                    <button class="window-control maximize"></button>
                </div>
                <div class="window-title"></div>
            </div>
            <div class="window-content"></div>
            <div class="window-resize-handle"></div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('desktop').addEventListener('click', (e) => {
            if (e.target.id === 'desktop') {
                this.deactivateAllWindows();
                // Set Finder as active app in menu bar
                const finder = this.system.appSystem?.getRunningApp('finder');
                if (finder) {
                    this.system.menuBar?.setActiveApp(finder);
                }
            }
        });
    }

    createWindow(app) {
        const windowId = `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = windowId;

        // Create window instance
        const window = {
            id: windowId,
            element: windowEl,
            app: app,
            isMinimized: false,
            isMaximized: false,
            previousState: null,
            // Add window methods
            setContent: (content) => {
                const contentEl = windowEl.querySelector('.window-content');
                contentEl.innerHTML = content;
            },
            addStyles: (styles) => {
                const styleEl = document.createElement('style');
                styleEl.textContent = styles;
                windowEl.appendChild(styleEl);
            },
            setTitle: (title) => {
                windowEl.querySelector('.window-title').textContent = title;
            },
            querySelector: (selector) => windowEl.querySelector(selector),
            querySelectorAll: (selector) => windowEl.querySelectorAll(selector),
            showError: (title, message) => {
                this.system.showNotification(title, message, { type: 'error' });
            },
            showPrompt: async (title, message) => {
                return this.system.showPrompt(title, message);
            }
        };

        // Add to windows collection
        this.windows.set(windowId, window);

        // Register with process manager
        if (this.system.processManager) {
            this.system.processManager.registerWindow(window);
        }

        // Set up window UI and controls
        this.setupWindow(window);
        
        return window;
    }

    setupWindow(window) {
        const windowEl = window.element;
        windowEl.innerHTML = this.windowTemplate;

        // Set initial window title as app name
        const titleEl = windowEl.querySelector('.window-title');
        titleEl.textContent = window.app.name;
        titleEl.dataset.defaultTitle = window.app.name;  // Store default title for reference

        // Set initial position and size
        const defaultOptions = {
            width: 800,
            height: 600,
            x: 100 + (this.windows.size * 20),
            y: 100 + (this.windows.size * 20)
        };
        
        Object.assign(windowEl.style, {
            width: defaultOptions.width + 'px',
            height: defaultOptions.height + 'px',
            left: defaultOptions.x + 'px',
            top: defaultOptions.y + 'px'
        });

        // Add window to desktop and stack
        document.getElementById('desktop').appendChild(windowEl);
        this.updateWindowStack(window);

        this.setupWindowControls(window);
        this.makeWindowDraggable(window);
        this.makeWindowResizable(window);
        
        this.activateWindow(window.id);
    }

    setupWindowControls(window) {
        const controls = window.element.querySelector('.window-controls');
        
        // Close button
        controls.querySelector('.close').addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent window activation
            this.closeWindow(window.id);
        });

        // Minimize button
        controls.querySelector('.minimize').addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent window activation
            this.minimizeWindow(window.id);
        });

        // Maximize button
        controls.querySelector('.maximize').addEventListener('click', () => {
            this.toggleMaximizeWindow(window.id);
        });

        // Activate window on click
        window.element.addEventListener('mousedown', () => {
            this.activateWindow(window.id);
        });
    }

    makeWindowDraggable(window) {
        const header = window.element.querySelector('.window-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            window.element.style.transition = 'none';
            
            initialX = e.clientX - window.element.offsetLeft;
            initialY = e.clientY - window.element.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Prevent dragging above menu bar
            const menuBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menubar-height'));
            currentY = Math.max(menuBarHeight + 1, currentY);

            window.element.style.left = currentX + 'px';
            window.element.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            window.element.style.transition = '';
        });
    }

    makeWindowResizable(window) {
        const resizeHandle = window.element.querySelector('.window-resize-handle');
        let isResizing = false;
        let startWidth;
        let startHeight;
        let startX;
        let startY;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startWidth = window.element.offsetWidth;
            startHeight = window.element.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);

            window.element.style.width = Math.max(300, newWidth) + 'px';
            window.element.style.height = Math.max(200, newHeight) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    activateWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Deactivate all windows
        this.deactivateAllWindows();

        // Activate the selected window
        window.element.classList.add('active');
        this.updateWindowStack(window);
        this.activeWindow = window;

        // Update system state
        if (this.system.state) {
            this.system.state.activeApp = window.app.id;
        }

        // Update menu bar if available
        if (this.system.menuBar) {
            this.system.menuBar.setActiveApp(window.app);
        }
    }

    deactivateAllWindows() {
        this.windows.forEach(window => {
            window.element.classList.remove('active');
        });
        this.activeWindow = null;
    }

    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.isMinimized = true;
        
        // If this is the active window, try to activate another window of the same app
        if (this.activeWindow === window) {
            const sameAppWindow = Array.from(this.windows.values())
                .filter(w => w.app === window.app && !w.isMinimized && w !== window)
                .sort((a, b) => this.windowStack.indexOf(b) - this.windowStack.indexOf(a))[0];
            
            if (sameAppWindow) {
                this.activateWindow(sameAppWindow.id);
            } else {
                this.deactivateAllWindows();
            }
        }
        
        // Create minimized container in dock
        const minimizedContainer = document.createElement('div');
        minimizedContainer.className = 'dock-item';
        minimizedContainer.id = `minimized-${windowId}`;
        
        // Add keyboard accessibility
        minimizedContainer.setAttribute('tabindex', '0');
        minimizedContainer.setAttribute('role', 'button');
        const windowTitle = window.element.querySelector('.window-title').textContent;
        minimizedContainer.setAttribute('aria-label', `Restore ${windowTitle} window`);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'dock-item-tooltip';
        tooltip.textContent = windowTitle || window.app.name;
        minimizedContainer.appendChild(tooltip);
        
        // Add keyboard event listeners
        minimizedContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Simulate long click/right click behavior
                    // You can implement custom long-press behavior here
                } else {
                    this.restoreWindow(windowId);
                }
            }
        });

        // Add hover and focus animations
        minimizedContainer.addEventListener('mouseenter', () => {
            minimizedContainer.classList.add('dock-item-hover');
        });
        minimizedContainer.addEventListener('mouseleave', () => {
            minimizedContainer.classList.remove('dock-item-hover');
        });
        minimizedContainer.addEventListener('focus', () => {
            minimizedContainer.classList.add('dock-item-hover');
        });
        minimizedContainer.addEventListener('blur', () => {
            minimizedContainer.classList.remove('dock-item-hover');
        });

        // Get dimensions
        const dockIconSize = 48;
        const windowHeight = window.element.offsetHeight;
        const windowWidth = window.element.offsetWidth;
        
        // Calculate scales
        const scaleByHeight = (dockIconSize - 8) / windowHeight;
        const scaleByWidth = (dockIconSize + 8) / windowWidth;
        let targetScale = Math.min(scaleByHeight, scaleByWidth);
        
        // Calculate dimensions
        let previewWidth = Math.ceil(windowWidth * targetScale);
        let previewHeight = Math.ceil(windowHeight * targetScale);
        
        // Adjust width bounds
        const maxWidth = dockIconSize + 8;
        const minWidth = Math.max(dockIconSize * 0.75, 40);
        
        if (previewWidth > maxWidth) {
            targetScale = maxWidth / windowWidth;
            previewWidth = maxWidth;
            previewHeight = Math.ceil(windowHeight * targetScale);
        } else if (previewWidth < minWidth) {
            targetScale = minWidth / windowWidth;
            previewWidth = minWidth;
            previewHeight = Math.ceil(windowHeight * targetScale);
        }
        
        // Ensure height doesn't exceed dock icon size
        if (previewHeight > dockIconSize) {
            targetScale = dockIconSize / windowHeight;
            previewHeight = dockIconSize;
            previewWidth = Math.ceil(windowWidth * targetScale);
        }
        
        // Set container dimensions
        minimizedContainer.style.width = `${previewWidth}px`;
        minimizedContainer.style.height = `${dockIconSize}px`;
        
        // Store original window styles for restoration
        window.previousState = {
            transform: window.element.style.transform || '',
            width: window.element.style.width,
            height: window.element.style.height,
            left: window.element.style.left,
            top: window.element.style.top,
            zIndex: window.element.style.zIndex,
            transition: window.element.style.transition,
            position: window.element.style.position,
            pointerEvents: window.element.style.pointerEvents,
            tabIndex: window.element.getAttribute('tabindex'),
            ariaHidden: window.element.getAttribute('aria-hidden')
        };

        // Add click handler to restore
        minimizedContainer.addEventListener('click', () => this.restoreWindow(windowId));
        
        // Add keyboard accessibility
        minimizedContainer.setAttribute('tabindex', '0');
        minimizedContainer.setAttribute('role', 'button');
        minimizedContainer.setAttribute('aria-label', `Restore ${tooltip.textContent} window`);
        
        // Add keyboard and focus handling
        minimizedContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Simulate long click/right click behavior
                    // You can implement custom long-press behavior here
                } else {
                    this.restoreWindow(windowId);
                }
            }
        });

        // Add hover and focus animations
        minimizedContainer.addEventListener('mouseenter', () => {
            minimizedContainer.classList.add('dock-item-hover');
        });
        minimizedContainer.addEventListener('mouseleave', () => {
            minimizedContainer.classList.remove('dock-item-hover');
        });
        minimizedContainer.addEventListener('focus', () => {
            minimizedContainer.classList.add('dock-item-hover');
        });
        minimizedContainer.addEventListener('blur', () => {
            minimizedContainer.classList.remove('dock-item-hover');
        });

        // Add to dock's minimized section
        const minimizedSection = document.querySelector('.dock-minimized-windows');
        minimizedSection.appendChild(minimizedContainer);

        // Update separator visibility
        const separator = document.querySelector('.dock-separator');
        if (separator) {
            separator.style.display = '';
        }

        // Get positions for animation
        const containerBounds = minimizedContainer.getBoundingClientRect();
        const windowBounds = window.element.getBoundingClientRect();

        // Calculate the center position in the dock container
        const topOffset = Math.max(0, (dockIconSize - previewHeight) / 2);
        
        // Animate the window towards the minimized container
        const translateX = containerBounds.left - windowBounds.left;
        const translateY = (containerBounds.top + topOffset) - windowBounds.top;
        
        // Apply initial position and start animation
        Object.assign(window.element.style, {
            position: 'fixed',
            width: `${windowWidth}px`,
            height: `${windowHeight}px`,
            left: `${windowBounds.left}px`,
            top: `${windowBounds.top}px`,
            transform: 'none',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            zIndex: '9999'
        });

        // Force a reflow to ensure the initial styles are applied
        window.element.offsetHeight;

        // Apply the animation transform
        window.element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${targetScale})`;
        window.element.style.opacity = '0.8';

        // After animation completes, move the window to its final position
        setTimeout(() => {
            // Move the actual window into the minimized container
            minimizedContainer.appendChild(window.element);
            
            // Apply final transformation
            Object.assign(window.element.style, {
                position: 'absolute',
                width: `${windowWidth}px`,
                height: `${windowHeight}px`,
                left: '0',
                top: `${topOffset}px`,
                transform: `scale(${targetScale})`,
                transformOrigin: 'top left',
                transition: 'none',
                zIndex: 'auto',
                opacity: '1',
                pointerEvents: 'none'
            });
        }, 300);

        // Make window and all its children uninteractable
        window.element.setAttribute('tabindex', '-1');
        // window.element.setAttribute('aria-hidden', 'true'); // Removed for now because it might not be right or needed - but leave it here for now.
        window.element.setAttribute('inert', '');
    }

    restoreWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window || !window.isMinimized) return;

        const minimizedContainer = document.getElementById(`minimized-${windowId}`);
        if (!minimizedContainer) return;

        // Move window back to desktop
        document.getElementById('desktop').appendChild(window.element);
        
        // Restore original styles and interactivity
        if (window.previousState) {
            Object.assign(window.element.style, window.previousState);
            
            // Restore tabindex
            if (window.previousState.tabIndex) {
                window.element.setAttribute('tabindex', window.previousState.tabIndex);
            } else {
                window.element.removeAttribute('tabindex');
            }
            
            // Restore aria-hidden
            if (window.previousState.ariaHidden) {
                window.element.setAttribute('aria-hidden', window.previousState.ariaHidden);
            } else {
                window.element.removeAttribute('aria-hidden');
            }
            
            // Remove inert attribute
            window.element.removeAttribute('inert');
        }

        // Remove container and update separator visibility
        minimizedContainer.remove();
        
        const minimizedSection = document.querySelector('.dock-minimized-windows');
        const separator = document.querySelector('.dock-separator');
        if (separator && minimizedSection) {
            separator.style.display = minimizedSection.children.length === 0 ? 'none' : '';
        }

        window.isMinimized = false;
        this.activateWindow(windowId);
    }

    toggleMaximizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        if (window.isMaximized) {
            // Restore window
            Object.assign(window.element.style, window.previousState);
            window.isMaximized = false;
        } else {
            // Save current state
            window.previousState = {
                width: window.element.style.width,
                height: window.element.style.height,
                left: window.element.style.left,
                top: window.element.style.top,
                borderRadius: window.element.style.borderRadius
            };

            // Maximize window
            Object.assign(window.element.style, {
                width: '100vw',
                height: `calc(100vh - var(--menubar-height) - var(--dock-height) - 9px)`,
                left: '0',
                top: 'calc(var(--menubar-height) + 1px)',
                bottom: 'var(--dock-height)',
                borderRadius: '0px'
            });
            window.isMaximized = true;
        }
    }

    hasFinderWindows() {
        return Array.from(this.windows.values()).some(window => 
            window.app && window.app.id === 'finder'
        );
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Remove from stack
        this.windowStack = this.windowStack.filter(w => w !== window);
        
        // If this was the active window, try to activate next unminimized window of same app
        if (this.activeWindow === window) {
            const sameAppWindow = this.windowStack
                .filter(w => w.app === window.app && !w.isMinimized)
                .pop();
            
            if (sameAppWindow) {
                this.activateWindow(sameAppWindow.id);
            } else {
                this.activeWindow = null;
            }
        }

        // Remove window element and clean up
        window.element.remove();
        this.windows.delete(windowId);

        // Notify process manager
        if (this.system.processManager) {
            this.system.processManager.unregisterWindow(window);
        }

        // Update z-indices of remaining windows
        this.windowStack.forEach((w, index) => {
            w.element.style.zIndex = index + 1;
        });
    }

    hasOtherFinderWindows(currentWindowId) {
        return Array.from(this.windows.values())
            .some(w => w.app.id === 'finder' && w.id !== currentWindowId);
    }

    updateWindowStack(window) {
        // Remove window from current position in stack
        this.windowStack = this.windowStack.filter(w => w !== window);
        // Add window to top of stack
        this.windowStack.push(window);
        // Update z-indices based on stack position
        this.windowStack.forEach((w, index) => {
            w.element.style.zIndex = index + 1;
        });
    }
} 