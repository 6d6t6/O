class OmegaOS {
    constructor() {
        this.state = {
            isInitialized: false,
            isFileSystemReady: false,
            activeApp: null,
            systemPreferences: {
                theme: 'dark',
                accentColor: '#007AFF',
                notificationOrder: 'newest-first'
            }
        };
    }

    async init() {
        try {
            // If we're already initialized, don't initialize again
            if (this.state.isInitialized) {
                return true;
            }

            // Initialize auth system first
            await this.auth.initialize();

            // If we're not signed in, show auth screen
            if (!this.auth.isSignedIn()) {
                // Check if setup is complete
                const isSetupComplete = localStorage.getItem('omega-setup-complete') === 'true';
                
                if (!isSetupComplete) {
                    await this.auth.showSetupWizard();
                } else {
                    await this.auth.showSignIn();
                }
                return false;
            }

            // Get filesystem handle - if none, show sign in
            const handle = this.auth.getFileSystemHandle();
            if (!handle) {
                await this.auth.signOut();
                await this.auth.showSignIn();
                return false;
            }

            // Show loading screen
            this.showLoadingScreen();

            // Initialize filesystem using the handle from auth system
            const fsInitialized = await this.initializeFileSystem();
            
            if (!fsInitialized) {
                // If filesystem fails, force sign out and show auth screen
                await this.auth.signOut();
                await this.auth.showSignIn();
                return false;
            }

            // Load user preferences
            this.loadUserPreferences();

            // Create OS UI structure
            this.createOSStructure();
            
            // Initialize remaining components
            this.initializeWindowManager();
            this.initializeMenuBar();
            await this.initializeAppSystem();
            await this.initializeDock();
            await this.initializeDesktop();
            
            this.state.isInitialized = true;
            console.log('OMEGA OS initialized successfully');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Show desktop
            document.getElementById('omega-os').style.display = 'block';
            
            // Show welcome notification
            this.auth.showWelcomeNotification();
            
            // Dispatch system ready event
            window.dispatchEvent(new CustomEvent('omega:ready'));
            
            return true;
        } catch (error) {
            console.error('Failed to initialize OS:', error);
            
            // Clean up and show auth screen on critical errors
            await this.auth.signOut();
            await this.auth.showSignIn();
            return false;
        }
    }

    async initializeFileSystem() {
        try {
            const handle = this.auth.getFileSystemHandle();
            if (!handle) {
                throw new Error('No filesystem handle available');
            }

            this.filesystem = new FileSystem();
            await this.filesystem.initialize(handle);
            this.state.isFileSystemReady = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize filesystem:', error);
            this.state.isFileSystemReady = false;
            return false;
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'omega-loading';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <img src="assets/omega-logo.svg" alt="OMEGA" class="loading-logo">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading OMEGA OS...</div>
            </div>
        `;

        // Add loading styles
        const style = document.createElement('style');
        style.textContent = `
            #omega-loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1a1a1a;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .loading-content {
                text-align: center;
                color: white;
            }

            .loading-logo {
                width: 120px;
                height: 120px;
                margin-bottom: 24px;
                animation: pulse 2s infinite;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                margin: 20px auto;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                border-top-color: #007AFF;
                animation: spin 1s linear infinite;
            }

            .loading-text {
                font-size: 18px;
                color: rgba(255, 255, 255, 0.8);
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.95); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingScreen);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('omega-loading');
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }

    createOSStructure() {
        document.body.innerHTML = `
            <div id="omega-os" style="display: none;">
                <!-- Top Menu Bar -->
                <div id="menu-bar">
                    <div class="menu-item active-app-name">Loading...</div>
                    <div class="system-tray">
                        <span id="clock"></span>
                        <div class="user-menu">
                            <img src="assets/icons/user.svg" alt="User" class="user-icon">
                        </div>
                    </div>
                </div>

                <!-- Desktop Area -->
                <div id="desktop">
                    <!-- Desktop icons will be dynamically added here -->
                </div>

                <!-- Dock -->
                <div id="dock">
                    <div class="dock-container">
                        <!-- Default apps will be added here -->
                    </div>
                    <div class="dock-separator" style="display: none;"></div>
                    <div class="dock-minimized-windows"></div>
                </div>
            </div>
        `;
    }

    addFileSystemHelp() {
        const errorScreen = document.querySelector('.error-screen .error-content');
        if (errorScreen) {
            const helpText = document.createElement('div');
            helpText.className = 'error-help';
            helpText.innerHTML = `
                <p>To fix this:</p>
                <ol>
                    <li>Click "Try Again"</li>
                    <li>When prompted, select a directory for OMEGA OS to use</li>
                    <li>Click "Allow" to grant access</li>
                </ol>
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                .error-help {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: left;
                }
                
                .error-help p {
                    margin-bottom: 10px;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .error-help ol {
                    margin: 0;
                    padding-left: 20px;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .error-help li {
                    margin: 5px 0;
                }
            `;
            document.head.appendChild(style);
            
            errorScreen.appendChild(helpText);
        }
    }

    showErrorScreen(title, message) {
        const errorScreen = document.createElement('div');
        errorScreen.className = 'error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <img src="assets/omega-logo.svg" alt="OMEGA OS" class="error-logo">
                <h1>${title}</h1>
                <p>${message}</p>
                <button onclick="window.location.reload()">Try Again</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .error-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1a1a1a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                z-index: 10000;
            }

            .error-content {
                text-align: center;
                padding: 40px;
            }

            .error-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 24px;
                opacity: 0.5;
            }

            .error-content h1 {
                margin: 0 0 16px 0;
                font-size: 24px;
            }

            .error-content p {
                margin: 0 0 24px 0;
                color: rgba(255, 255, 255, 0.8);
            }

            .error-content button {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                background: var(--accent-color);
                color: white;
                font-size: 16px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(errorScreen);
    }

    loadUserPreferences() {
        const user = this.auth.getCurrentUser();
        if (user && user.settings) {
            this.state.systemPreferences = {
                ...this.state.systemPreferences,
                ...user.settings
            };
        }

        // Apply preferences
        document.documentElement.setAttribute('data-theme', this.state.systemPreferences.theme);
        document.documentElement.style.setProperty('--accent-color', this.state.systemPreferences.accentColor);
    }

    initializeWindowManager() {
        this.windowManager = new WindowManager(this);
    }

    async initializeAppSystem() {
        this.appSystem = new AppSystem(this);

        // Register core apps
        await this.appSystem.registerApp({
            id: 'finder',
            name: 'Finder',
            icon: 'assets/icons/finder-icon.svg'
        });

        await this.appSystem.registerApp({
            id: 'terminal',
            name: 'Terminal',
            icon: 'assets/icons/terminal-icon.svg'
        });

        await this.appSystem.registerApp({
            id: 'settings',
            name: 'Settings',
            icon: 'assets/icons/settings-icon.svg'
        });
    }

    async initializeDock() {
        this.dock = new Dock(this);
        await this.dock.initialize();
    }

    async initializeDesktop() {
        try {
            // Load desktop contents
            const entries = await this.filesystem.readDirectory('/Desktop');
            const desktop = document.getElementById('desktop');
            
            for (const entry of entries) {
                const icon = document.createElement('div');
                icon.className = 'desktop-icon';
                icon.innerHTML = `
                    <img src="assets/icons/${entry.type === 'directory' ? 'directory' : 'file'}.svg" alt="${entry.type}">
                    <span>${entry.name}</span>
                `;
                desktop.appendChild(icon);
            }
        } catch (error) {
            console.error('Failed to load desktop contents:', error);
        }
    }

    // System API Methods
    async showDialog(title, message, buttons = ['OK']) {
        return new Promise(resolve => {
            const dialog = document.createElement('div');
            dialog.className = 'system-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div class="dialog-buttons">
                        ${buttons.map(btn => `
                            <button class="dialog-btn" data-action="${btn}">${btn}</button>
                        `).join('')}
                    </div>
                </div>
            `;

            // Add dialog styles if not already added
            if (!document.getElementById('dialog-styles')) {
                const style = document.createElement('style');
                style.id = 'dialog-styles';
                style.textContent = `
                    .system-dialog {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }

                    .dialog-content {
                        background: var(--window-bg);
                        border-radius: var(--window-border-radius);
                        padding: 20px;
                        min-width: 300px;
                        max-width: 500px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .dialog-content h2 {
                        margin: 0 0 10px 0;
                        font-size: 18px;
                    }

                    .dialog-content p {
                        margin: 0 0 20px 0;
                        color: #666;
                    }

                    .dialog-buttons {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }

                    .dialog-btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--accent-color);
                        color: white;
                        cursor: pointer;
                    }

                    .dialog-btn:hover {
                        background: var(--accent-color-hover);
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(dialog);

            // Handle button clicks
            dialog.addEventListener('click', (e) => {
                const btn = e.target.closest('.dialog-btn');
                if (btn) {
                    const action = btn.dataset.action;
                    dialog.remove();
                    resolve(action);
                }
            });
        });
    }

    showNotification(title, message, options = {}) {
        const notification = document.createElement('div');
        notification.className = 'desktop-notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-body">${message}</div>
        `;
        
        // Add notification styles if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                #notification-container {
                    position: fixed;
                    top: 8px;
                    right: 0px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    pointer-events: none;
                    z-index: 10000;
                }

                .desktop-notification {
                    position: relative;
                    background: rgba(30, 30, 30, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    font-size: 13px;
                    width: 300px;
                    min-height: fit-content;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                    transform: translateX(120%);
                    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
                    pointer-events: auto;
                    box-sizing: border-box;
                }

                .desktop-notification.show {
                    transform: translateX(0);
                }

                .notification-title {
                    font-weight: 600;
                    margin-bottom: 2px;
                    font-size: 13px;
                    line-height: 1.4;
                }

                .notification-body {
                    opacity: 0.8;
                    font-size: 12px;
                    line-height: 1.3;
                    margin: 0;
                    padding: 0;
                }
            `;
            document.head.appendChild(style);
        }

        // Create or get notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        // Insert new notification at the beginning (top)
        container.insertBefore(notification, container.firstChild);
        requestAnimationFrame(() => notification.classList.add('show'));
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                // Remove container if empty
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, options.duration || 5000);
    }

    async requestPermission(appId, permission) {
        // TODO: Implement permission system
        return true;
    }

    signOut() {
        this.auth.signOut();
    }

    initializeMenuBar() {
        this.menuBar = new MenuBarManager(this);
    }
}

// Create global instance
window.omegaOS = new OmegaOS(); 