class SettingsApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        
        // Try to load saved settings from localStorage
        const savedSettings = localStorage.getItem('omega-settings');
        const systemPreferences = system.state.systemPreferences || {};
        
        // Default settings
        this.settings = {
            appearance: {
                theme: systemPreferences.theme || 'light',
                accentColor: systemPreferences.accentColor || '#007AFF',
                fontSize: systemPreferences.fontSize || '14px'
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

        // Override with saved settings if they exist
        if (savedSettings) {
            this.settings = {
                ...this.settings,
                ...JSON.parse(savedSettings)
            };
        }
    }

    async onInitialize(window) {
        // Store window reference
        this.window = window;

        // Define preset accent colors
        this.accentColors = [
            { name: 'Blue', value: '#007AFF' },
            { name: 'Purple', value: '#5856D6' },
            { name: 'Pink', value: '#FF2D55' },
            { name: 'Red', value: '#FF3B30' },
            { name: 'Orange', value: '#FF9500' },
            { name: 'Yellow', value: '#FFCC00' },
            { name: 'Green', value: '#34C759' },
            { name: 'Teal', value: '#5AC8FA' },
            { name: 'Graphite', value: '#8E8E93' }
        ];

        // Apply current settings
        this.applySettings();

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
                            <div class="accent-colors" role="radiogroup" aria-label="Choose accent color">
                                ${this.accentColors.map(color => `
                                    <div class="accent-color-option ${color.value === this.settings.appearance.accentColor ? 'active' : ''}" 
                                         data-color="${color.value}"
                                         tabindex="0"
                                         role="radio"
                                         aria-checked="${color.value === this.settings.appearance.accentColor}"
                                         aria-label="${color.name}"
                                         style="background-color: ${color.value};"
                                         title="${color.name}">
                                         ${color.value === this.settings.appearance.accentColor ? '<div class="check-mark"></div>' : ''}
                                    </div>
                                `).join('')}
                            </div>
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

            .accent-colors {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 8px;
            }

            .accent-color-option {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                position: relative;
                transition: transform 0.2s, border-color 0.2s;
                border: 2px solid transparent;
                outline: none;
            }

            .accent-color-option:hover,
            .accent-color-option:focus-visible {
                transform: scale(1.1);
            }

            .accent-color-option:focus-visible {
                box-shadow: 0 0 0 2px var(--accent-color);
            }

            .accent-color-option.active {
                border-color: var(--text-color);
            }

            .accent-color-option .check-mark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>') center/contain no-repeat;
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

        // Theme select
        const themeSelect = window.querySelector('#theme');
        themeSelect.value = this.settings.appearance.theme;
        themeSelect.addEventListener('change', (e) => {
            this.settings.appearance.theme = e.target.value;
            this.applySettings();
        });

        // Accent colors
        const accentColors = window.querySelector('.accent-colors');
        
        const updateAccentColor = (colorOption) => {
            const color = colorOption.dataset.color;
            this.settings.appearance.accentColor = color;
            
            // Update active state visually
            window.querySelectorAll('.accent-color-option').forEach(option => {
                const isActive = option.dataset.color === color;
                option.classList.toggle('active', isActive);
                option.setAttribute('aria-checked', isActive);
                option.innerHTML = isActive ? '<div class="check-mark"></div>' : '';
            });
            
            this.applySettings();
        };

        accentColors.addEventListener('click', (e) => {
            const colorOption = e.target.closest('.accent-color-option');
            if (colorOption) {
                updateAccentColor(colorOption);
            }
        });

        // Keyboard navigation for accent colors
        accentColors.addEventListener('keydown', (e) => {
            const colorOption = e.target.closest('.accent-color-option');
            if (!colorOption) return;

            const options = Array.from(window.querySelectorAll('.accent-color-option'));
            const currentIndex = options.indexOf(colorOption);
            let nextIndex;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    updateAccentColor(colorOption);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + options.length) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    options[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    options[options.length - 1].focus();
                    break;
            }
        });

        // Font size select
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
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.appearance.theme);
        
        // Apply accent color
        document.documentElement.style.setProperty('--accent-color', this.settings.appearance.accentColor);
        
        // Apply font size
        document.documentElement.style.setProperty('--base-font-size', this.settings.appearance.fontSize);
        
        // Save settings to system
        this.system.state.systemPreferences = {
            ...this.system.state.systemPreferences,
            theme: this.settings.appearance.theme,
            accentColor: this.settings.appearance.accentColor,
            fontSize: this.settings.appearance.fontSize
        };
        
        // Notify system of settings change using custom event
        window.dispatchEvent(new CustomEvent('settingsChanged', { 
            detail: this.settings 
        }));
        
        // Save to local storage for persistence
        localStorage.setItem('omega-settings', JSON.stringify(this.settings));
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