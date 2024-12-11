class SettingsApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.settings = {
            appearance: {
                theme: 'light',
                accentColor: '#007AFF',
                fontSize: '14px'
            },
            system: {
                notifications: true,
                animations: true,
                soundEffects: true
            },
            notifications: {
                order: 'newest-first'
            }
        };
    }

    async onInitialize(window) {
        // Store window reference
        this.window = window;

        window.setContent(`
            <div class="settings">
                <div class="settings-sidebar">
                    <div class="settings-nav">
                        <div class="nav-item active" data-section="appearance">Appearance</div>
                        <div class="nav-item" data-section="notifications">Notifications</div>
                        <div class="nav-item" data-section="system">System</div>
                    </div>
                </div>
                <div class="settings-content">
                    <div class="settings-section active" id="appearance">
                        <h2>Appearance</h2>
                        <div class="setting-group">
                            <label>Theme</label>
                            <select id="theme">
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>Accent Color</label>
                            <input type="color" id="accentColor" value="${this.settings.appearance.accentColor}">
                        </div>
                        <div class="setting-group">
                            <label>Font Size</label>
                            <select id="fontSize">
                                <option value="12px">Small</option>
                                <option value="14px">Medium</option>
                                <option value="16px">Large</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-section" id="notifications">
                        <h2>Notifications</h2>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="notifications" ${this.settings.system.notifications ? 'checked' : ''}>
                                Enable Notifications
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>Notification Order</label>
                            <select id="notificationOrder">
                                <option value="newest-first">Newest First (Bottom)</option>
                                <option value="oldest-first">Oldest First (Top)</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-section" id="system">
                        <h2>System</h2>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="animations" ${this.settings.system.animations ? 'checked' : ''}>
                                Enable Animations
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="soundEffects" ${this.settings.system.soundEffects ? 'checked' : ''}>
                                Enable Sound Effects
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `);

        window.addStyles(`
            .settings {
                display: grid;
                grid-template-columns: 200px 1fr;
                height: 100%;
                background: var(--window-bg);
                color: var(--text-color);
            }

            .settings-sidebar {
                background: var(--sidebar-bg);
                border-right: 1px solid var(--border-color);
                padding: 16px;
            }

            .settings-nav {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nav-item {
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .nav-item:hover {
                background: var(--hover-bg);
            }

            .nav-item.active {
                background: var(--active-bg);
                color: var(--active-text);
            }

            .settings-content {
                padding: 24px;
                overflow-y: auto;
            }

            .settings-section {
                display: none;
            }

            .settings-section.active {
                display: block;
            }

            .setting-group {
                margin-bottom: 24px;
            }

            .setting-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }

            select, input[type="color"] {
                padding: 8px;
                border-radius: 4px;
                border: 1px solid var(--border-color);
                background: var(--input-bg);
                color: var(--text-color);
                width: 200px;
            }

            input[type="checkbox"] {
                margin-right: 8px;
            }

            h2 {
                margin: 0 0 24px 0;
                font-size: 24px;
                font-weight: 500;
            }
        `);

        this.initializeEventListeners(window);
    }

    initializeEventListeners(window) {
        // Navigation
        const nav = window.querySelector('.settings-nav');
        nav.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                this.switchSection(window, section);
            }
        });

        // Settings changes
        const themeSelect = window.querySelector('#theme');
        themeSelect.value = this.settings.appearance.theme;
        themeSelect.addEventListener('change', (e) => {
            this.settings.appearance.theme = e.target.value;
            this.applySettings();
        });

        const accentColor = window.querySelector('#accentColor');
        accentColor.addEventListener('change', (e) => {
            this.settings.appearance.accentColor = e.target.value;
            this.applySettings();
        });

        const fontSize = window.querySelector('#fontSize');
        fontSize.value = this.settings.appearance.fontSize;
        fontSize.addEventListener('change', (e) => {
            this.settings.appearance.fontSize = e.target.value;
            this.applySettings();
        });

        // System settings
        ['notifications', 'animations', 'soundEffects'].forEach(setting => {
            const checkbox = window.querySelector(`#${setting}`);
            checkbox.addEventListener('change', (e) => {
                this.settings.system[setting] = e.target.checked;
                this.applySettings();
            });
        });

        // Add notification order listener
        const notificationOrder = window.querySelector('#notificationOrder');
        notificationOrder.value = this.settings.notifications.order;
        notificationOrder.addEventListener('change', (e) => {
            this.settings.notifications.order = e.target.value;
            this.applySettings();
        });
    }

    switchSection(window, section) {
        // Update navigation
        window.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update content
        window.querySelectorAll('.settings-section').forEach(content => {
            content.classList.toggle('active', content.id === section);
        });
    }

    applySettings() {
        // Here you would implement the actual settings application
        // For now, we'll just save them and log
        console.log('Settings updated:', this.settings);
        
        // Notify system of settings change
        this.system.broadcast('settingsChanged', this.settings);
    }

    // Override handleMenuAction to ensure proper window closing
    handleMenuAction(action) {
        switch (action) {
            case 'close':
                if (this.window) {
                    this.system.windowManager.closeWindow(this.window.id);
                }
                break;
            case 'quit':
                this.system.appSystem.terminateApp(this.id);
                break;
            default:
                super.handleMenuAction(action);
        }
    }
}

window.SettingsApp = SettingsApp; 