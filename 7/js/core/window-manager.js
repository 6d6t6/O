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
        
        // Create minimized preview in dock
        const minimizedPreview = document.createElement('div');
        minimizedPreview.className = 'dock-item';
        minimizedPreview.id = `minimized-${windowId}`;
        
        // Create tooltip exactly like dock items do
        const tooltip = document.createElement('div');
        tooltip.className = 'dock-item-tooltip';
        const windowTitle = window.element.querySelector('.window-title').textContent;
        tooltip.textContent = windowTitle || window.app.name;
        minimizedPreview.appendChild(tooltip);
        
        // Create a container for the window preview
        const previewContainer = document.createElement('div');
        previewContainer.className = 'minimized-window-preview';
        
        // Get dimensions
        const dockIconSize = 48; // Standard dock icon size
        const windowHeight = window.element.offsetHeight;
        const windowWidth = window.element.offsetWidth;
        
        // Calculate scales for both dimensions
        const scaleByHeight = (dockIconSize - 8) / windowHeight; // 4px margin top and bottom
        const scaleByWidth = (dockIconSize + 8) / windowWidth;  // Allow slightly wider than icon
        
        // Use the smaller scale to ensure neither dimension is too large
        let targetScale = Math.min(scaleByHeight, scaleByWidth);
        
        // Calculate resulting dimensions
        let previewWidth = Math.ceil(windowWidth * targetScale);
        let previewHeight = Math.ceil(windowHeight * targetScale);
        
        // Ensure width stays within reasonable bounds
        const maxWidth = dockIconSize + 8; // Just slightly wider than icon
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
        
        // Set preview dimensions
        minimizedPreview.style.width = `${previewWidth}px`;
        minimizedPreview.style.height = `${dockIconSize}px`;
        previewContainer.style.width = '100%';
        previewContainer.style.height = '100%';
        
        // Clone the entire window for preview
        const windowClone = window.element.cloneNode(true);
        windowClone.classList.add('preview-window');
        windowClone.style.pointerEvents = 'none';
        
        // Center the window clone vertically
        const topOffset = Math.max(0, (dockIconSize - previewHeight) / 2);
        
        // Apply the calculated scale and position
        windowClone.style.transform = `scale(${targetScale})`;
        windowClone.style.transformOrigin = 'top left';
        windowClone.style.top = `${topOffset}px`;
        windowClone.style.left = '0';
        
        previewContainer.appendChild(windowClone);
        minimizedPreview.appendChild(previewContainer);

        // Add click handler to restore
        minimizedPreview.addEventListener('click', () => this.restoreWindow(windowId));

        // Add to dock's minimized section and update separator
        const minimizedSection = document.querySelector('.dock-minimized-windows');
        minimizedSection.appendChild(minimizedPreview);

        // Update separator visibility
        const separator = document.querySelector('.dock-separator');
        if (separator) {
            separator.style.display = '';
        }

        // Get the final position for animation
        const previewBounds = minimizedPreview.getBoundingClientRect();
        const windowBounds = window.element.getBoundingClientRect();

        // Set initial position and scale
        minimizedPreview.style.opacity = '0';
        
        // Animate the window to the preview position
        window.element.style.transition = 'all 0.3s ease';
        window.element.style.transform = `translate(${previewBounds.left - windowBounds.left}px, ${previewBounds.top - windowBounds.top}px) scale(${targetScale})`;
        window.element.style.opacity = '0';

        // After animation completes
        setTimeout(() => {
            minimizedPreview.style.opacity = '1';
            window.element.style.display = 'none';
        }, 300);
    }

    restoreWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window || !window.isMinimized) return;

        const minimizedPreview = document.getElementById(`minimized-${windowId}`);
        if (!minimizedPreview) return;

        // Get positions for animation
        const previewBounds = minimizedPreview.getBoundingClientRect();
        
        // Show window and set it to preview position
        window.element.style.display = '';
        window.element.style.transform = `translate(${previewBounds.left}px, ${previewBounds.top}px) scale(0.2)`;
        window.element.style.opacity = '0';

        // Force a reflow
        window.element.offsetHeight;

        // Animate back to original position and clear transform
        window.element.style.transform = '';
        window.element.style.opacity = '1';

        // Remove preview and update separator visibility
        minimizedPreview.remove();
        
        // Update separator visibility
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
                top: window.element.style.top
            };

            // Maximize window
            Object.assign(window.element.style, {
                width: '100vw',
                height: `calc(100vh - var(--menubar-height) - var(--dock-height))`,
                left: '0',
                top: 'var(--menubar-height)',
                bottom: 'var(--dock-height)',
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