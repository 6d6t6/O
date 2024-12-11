class WindowManager {
    constructor(system) {
        this.system = system;
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndex = 1000;
        
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
            }
        });
    }

    createWindow(app, options = {}) {
        const windowId = `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = windowId;
        windowEl.innerHTML = this.windowTemplate;

        // Set initial window title as app name
        const titleEl = windowEl.querySelector('.window-title');
        titleEl.textContent = app.name;
        titleEl.dataset.defaultTitle = app.name;  // Store default title for reference

        // Set initial position and size
        const defaultOptions = {
            width: 800,
            height: 600,
            x: 100 + (this.windows.size * 20),
            y: 100 + (this.windows.size * 20)
        };
        
        const windowOptions = { ...defaultOptions, ...options };
        
        Object.assign(windowEl.style, {
            width: windowOptions.width + 'px',
            height: windowOptions.height + 'px',
            left: windowOptions.x + 'px',
            top: windowOptions.y + 'px',
            zIndex: ++this.zIndex
        });

        // Add window to desktop
        document.getElementById('desktop').appendChild(windowEl);

        // Create window instance
        const windowInstance = {
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

        this.windows.set(windowId, windowInstance);
        this.setupWindowControls(windowInstance);
        this.makeWindowDraggable(windowInstance);
        this.makeWindowResizable(windowInstance);
        
        this.activateWindow(windowId);
        
        return windowInstance;
    }

    setupWindowControls(windowInstance) {
        const controls = windowInstance.element.querySelector('.window-controls');
        
        // Close button
        controls.querySelector('.close').addEventListener('click', () => {
            this.closeWindow(windowInstance.id);
        });

        // Minimize button
        controls.querySelector('.minimize').addEventListener('click', () => {
            this.minimizeWindow(windowInstance.id);
        });

        // Maximize button
        controls.querySelector('.maximize').addEventListener('click', () => {
            this.toggleMaximizeWindow(windowInstance.id);
        });

        // Activate window on click
        windowInstance.element.addEventListener('mousedown', () => {
            this.activateWindow(windowInstance.id);
        });
    }

    makeWindowDraggable(windowInstance) {
        const header = windowInstance.element.querySelector('.window-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            windowInstance.element.style.transition = 'none';
            
            initialX = e.clientX - windowInstance.element.offsetLeft;
            initialY = e.clientY - windowInstance.element.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            windowInstance.element.style.left = currentX + 'px';
            windowInstance.element.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            windowInstance.element.style.transition = '';
        });
    }

    makeWindowResizable(windowInstance) {
        const resizeHandle = windowInstance.element.querySelector('.window-resize-handle');
        let isResizing = false;
        let startWidth;
        let startHeight;
        let startX;
        let startY;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startWidth = windowInstance.element.offsetWidth;
            startHeight = windowInstance.element.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);

            windowInstance.element.style.width = Math.max(300, newWidth) + 'px';
            windowInstance.element.style.height = Math.max(200, newHeight) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    activateWindow(windowId) {
        const windowInstance = this.windows.get(windowId);
        if (!windowInstance) return;

        // Deactivate all windows
        this.deactivateAllWindows();

        // Activate the selected window
        windowInstance.element.classList.add('active');
        windowInstance.element.style.zIndex = ++this.zIndex;
        this.activeWindow = windowInstance;

        // Update system state and menu bar
        this.system.state.activeApp = windowInstance.app.id;
        this.system.menuBar.setActiveApp(windowInstance.app);
    }

    deactivateAllWindows() {
        this.windows.forEach(window => {
            window.element.classList.remove('active');
        });
        this.activeWindow = null;
        
        // Reset menu bar to system menus
        this.system.menuBar.setActiveApp(null);
    }

    minimizeWindow(windowId) {
        const windowInstance = this.windows.get(windowId);
        if (!windowInstance) return;

        windowInstance.isMinimized = true;
        
        // Create minimized preview in dock
        const minimizedPreview = document.createElement('div');
        minimizedPreview.className = 'dock-item';
        minimizedPreview.id = `minimized-${windowId}`;
        
        // Create tooltip exactly like dock items do
        const tooltip = document.createElement('div');
        tooltip.className = 'dock-item-tooltip';
        const windowTitle = windowInstance.element.querySelector('.window-title').textContent;
        tooltip.textContent = windowTitle || windowInstance.app.name;
        minimizedPreview.appendChild(tooltip);
        
        // Create a container for the window preview
        const previewContainer = document.createElement('div');
        previewContainer.className = 'minimized-window-preview';
        
        // Get dimensions
        const dockIconSize = 48; // Standard dock icon size
        const windowHeight = windowInstance.element.offsetHeight;
        const windowWidth = windowInstance.element.offsetWidth;
        
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
        const windowClone = windowInstance.element.cloneNode(true);
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
        const windowBounds = windowInstance.element.getBoundingClientRect();

        // Set initial position and scale
        minimizedPreview.style.opacity = '0';
        
        // Animate the window to the preview position
        windowInstance.element.style.transition = 'all 0.3s ease';
        windowInstance.element.style.transform = `translate(${previewBounds.left - windowBounds.left}px, ${previewBounds.top - windowBounds.top}px) scale(${targetScale})`;
        windowInstance.element.style.opacity = '0';

        // After animation completes
        setTimeout(() => {
            minimizedPreview.style.opacity = '1';
            windowInstance.element.style.display = 'none';
        }, 300);
    }

    restoreWindow(windowId) {
        const windowInstance = this.windows.get(windowId);
        if (!windowInstance || !windowInstance.isMinimized) return;

        const minimizedPreview = document.getElementById(`minimized-${windowId}`);
        if (!minimizedPreview) return;

        // Get positions for animation
        const previewBounds = minimizedPreview.getBoundingClientRect();
        
        // Show window and set it to preview position
        windowInstance.element.style.display = '';
        windowInstance.element.style.transform = `translate(${previewBounds.left}px, ${previewBounds.top}px) scale(0.2)`;
        windowInstance.element.style.opacity = '0';

        // Force a reflow
        windowInstance.element.offsetHeight;

        // Animate back to original position and clear transform
        windowInstance.element.style.transform = '';
        windowInstance.element.style.opacity = '1';

        // Remove preview and update separator visibility
        minimizedPreview.remove();
        
        // Update separator visibility
        const minimizedSection = document.querySelector('.dock-minimized-windows');
        const separator = document.querySelector('.dock-separator');
        if (separator && minimizedSection) {
            separator.style.display = minimizedSection.children.length === 0 ? 'none' : '';
        }

        windowInstance.isMinimized = false;
        this.activateWindow(windowId);
    }

    toggleMaximizeWindow(windowId) {
        const windowInstance = this.windows.get(windowId);
        if (!windowInstance) return;

        if (windowInstance.isMaximized) {
            // Restore window
            Object.assign(windowInstance.element.style, windowInstance.previousState);
            windowInstance.isMaximized = false;
        } else {
            // Save current state
            windowInstance.previousState = {
                width: windowInstance.element.style.width,
                height: windowInstance.element.style.height,
                left: windowInstance.element.style.left,
                top: windowInstance.element.style.top
            };

            // Maximize window
            Object.assign(windowInstance.element.style, {
                width: '100vw',
                height: `calc(100vh - var(--menubar-height) - var(--dock-height))`,
                left: '0',
                top: 'var(--menubar-height)',
                bottom: 'var(--dock-height)',
            });
            windowInstance.isMaximized = true;
        }
    }

    hasFinderWindows() {
        return Array.from(this.windows.values()).some(window => 
            window.app && window.app.id === 'finder'
        );
    }

    closeWindow(windowId) {
        const windowInstance = this.windows.get(windowId);
        if (!windowInstance) return;

        const app = windowInstance.app;
        if (!app) {
            windowInstance.element.remove();
            this.windows.delete(windowId);
            return;
        }

        // For Finder, prevent closing if it's the last window
        if (app.id === 'finder' && !this.hasFinderWindows()) {
            return;
        }

        // Close the window
        windowInstance.element.remove();
        this.windows.delete(windowId);

        if (this.activeWindow === windowInstance) {
            this.activeWindow = null;
        }

        // Update menu bar if needed
        if (!this.hasFinderWindows() && app.id === 'finder') {
            this.system.menuBar.updateMenus();
        }
    }
} 