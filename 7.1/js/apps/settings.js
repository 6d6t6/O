class SettingsApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        
        // Get settings from settings manager
        this.settings = system.settingsManager.getSettings();

        // Define available wallpapers
        this.wallpapers = [
            'aaron-burden-Qy-CBKUg_X8-unsplash.jpg',
            'amy-tran-L2owAEPX0Vk-unsplash.jpg',
            'anders-jilden-AkUR27wtaxs-unsplash.jpg',
            'anders-jilden-O85h02qZ24w-unsplash.jpg',
            'andrew-neel-jtsW--Z6bFw-unsplash.jpg',
            'andrew-ridley-jR4Zf-riEjI-unsplash.jpg',
            'breno-machado-in9-n0JwgZ0-unsplash.jpg',
            'dan-freeman-wAn4RfmXtxU-unsplash.jpg',
            'efe-kurnaz-RnCPiXixooY-unsplash.jpg',
            'ian-dooley-DuBNA1QMpPA-unsplash.jpg',
            'jakob-owens-EwRM05V0VSI-unsplash.jpg',
            'jakob-owens-n5wwck8ES4w-unsplash.jpg',
            'javen-yang-MWZi4XTIsKA-unsplash.jpg',
            'jayanth-muppaneni-zRZqxAogRnY-unsplash.jpg',
            'jeremy-bishop-B2Q7UC6QGLE-unsplash.jpg',
            'jms-kFHz9Xh3PPU-unsplash.jpg',
            'john-fowler-RsRTIofe0HE-unsplash.jpg',
            'jr-korpa-9XngoIpxcEo-unsplash.jpg',
            'meiying-ng-OrwkD-iWgqg-unsplash.jpg',
            'milad-fakurian-bexwsdM5BCw-unsplash.jpg',
            'milad-fakurian-iLHDO19h0ng-unsplash.jpg',
            'milad-fakurian-PGdW_bHDbpI-unsplash.jpg',
            'nasa-_SFJhRPzJHs-unsplash.jpg',
            'patrick-tomasso-5hvn-2WW6rY-unsplash.jpg',
            'rodion-kutsaiev-pVoEPpLw818-unsplash.jpg',
            'sean-sinclair-C_NJKfnTR5A-unsplash.jpg',
            'sora-sagano-Dksk8szLRN0-unsplash.jpg',
            'vackground-com-iSaDQdcPozk-unsplash.jpg'
        ];
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

        // Set up the UI with current settings
        this.setupUI(window);
    }

    setupUI(window) {
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
                        <div class="setting-group">
                            <label>Desktop Wallpaper</label>
                            <div class="wallpaper-grid">
                                ${this.wallpapers.map(wallpaper => `
                                    <div class="wallpaper-option ${this.settings.appearance.wallpaper === '/System/Wallpapers/' + wallpaper ? 'active' : ''}"
                                         data-wallpaper="/System/Wallpapers/${wallpaper}"
                                         tabindex="0"
                                         role="radio"
                                         aria-checked="${this.settings.appearance.wallpaper === '/System/Wallpapers/' + wallpaper}"
                                         aria-label="Wallpaper ${wallpaper.split('.')[0]}"
                                         style="background-image: url('assets/wallpapers/${wallpaper}')">
                                         ${this.settings.appearance.wallpaper === '/System/Wallpapers/' + wallpaper ? '<div class="check-mark"></div>' : ''}
                                    </div>
                                `).join('')}
                                <label class="wallpaper-upload" tabindex="0" role="button" aria-label="Upload custom wallpaper">
                                    <input type="file" accept="image/*" id="wallpaperUpload" class="hidden">
                                    <div class="upload-icon">+</div>
                                    <div class="upload-text">Custom</div>
                                </label>
                            </div>
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

            .wallpaper-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 16px;
                margin-top: 12px;
            }

            .wallpaper-option {
                aspect-ratio: 16/10;
                border-radius: 8px;
                cursor: pointer;
                background-size: cover;
                background-position: center;
                position: relative;
                transition: transform 0.2s, box-shadow 0.2s;
                border: 2px solid transparent;
                outline: none;
            }

            .wallpaper-option:hover,
            .wallpaper-option:focus-visible {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .wallpaper-option.active {
                border-color: var(--accent-color);
            }

            .wallpaper-option .check-mark {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 20px;
                height: 20px;
                background: var(--accent-color);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .wallpaper-option .check-mark::after {
                content: '✓';
                color: white;
                font-size: 14px;
            }

            .wallpaper-upload {
                aspect-ratio: 16/10;
                border-radius: 8px;
                border: 2px dashed var(--border-color);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, border-color 0.2s;
                outline: none;
            }

            .wallpaper-upload:hover,
            .wallpaper-upload:focus-visible {
                transform: scale(1.05);
                border-color: var(--accent-color);
            }

            .wallpaper-upload .upload-icon {
                font-size: 24px;
                margin-bottom: 4px;
                color: var(--text-secondary);
            }

            .wallpaper-upload .upload-text {
                font-size: 12px;
                color: var(--text-secondary);
            }

            .hidden {
                display: none;
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

        // Wallpaper selection
        const wallpaperGrid = window.querySelector('.wallpaper-grid');
        
        const updateWallpaper = (wallpaperPath) => {
            this.settings.appearance.wallpaper = wallpaperPath;
            
            // Update active state visually
            window.querySelectorAll('.wallpaper-option').forEach(option => {
                const isActive = option.dataset.wallpaper === wallpaperPath;
                option.classList.toggle('active', isActive);
                option.setAttribute('aria-checked', isActive);
                option.innerHTML = isActive ? '<div class="check-mark"></div>' : '';
            });
            
            // Apply settings with wallpaper change flag
            this.applySettings({ wallpaper: true });
        };

        wallpaperGrid.addEventListener('click', (e) => {
            const wallpaperOption = e.target.closest('.wallpaper-option');
            if (wallpaperOption) {
                updateWallpaper(wallpaperOption.dataset.wallpaper);
            }
        });

        // Keyboard navigation for wallpapers
        wallpaperGrid.addEventListener('keydown', (e) => {
            const wallpaperOption = e.target.closest('.wallpaper-option');
            if (!wallpaperOption) return;

            const options = Array.from(window.querySelectorAll('.wallpaper-option'));
            const currentIndex = options.indexOf(wallpaperOption);
            let nextIndex;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    updateWallpaper(wallpaperOption.dataset.wallpaper);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + options.length) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex - 3;
                    if (nextIndex >= 0) options[nextIndex].focus();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = currentIndex + 3;
                    if (nextIndex < options.length) options[nextIndex].focus();
                    break;
            }
        });

        // Custom wallpaper upload
        const wallpaperUpload = window.querySelector('#wallpaperUpload');
        wallpaperUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    // Generate a unique filename
                    const timestamp = Date.now();
                    const filename = `custom-${timestamp}-${file.name}`;
                    const systemPath = `/System/Wallpapers/${filename}`;

                    // Save file to system wallpapers directory
                    await this.system.filesystem.writeFile(systemPath, file);

                    // Update wallpaper setting
                    updateWallpaper(systemPath);
                } catch (error) {
                    console.error('Failed to save wallpaper:', error);
                    this.system.showNotification(
                        'Error',
                        'Failed to save wallpaper. Please try again.'
                    );
                }
            }
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

    async applySettings(changedSettings = {}) {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.appearance.theme);
        
        // Apply accent color
        document.documentElement.style.setProperty('--accent-color', this.settings.appearance.accentColor);
        
        // Apply font size
        document.documentElement.style.setProperty('--base-font-size', this.settings.appearance.fontSize);
        
        // Only apply wallpaper if it was changed
        if (changedSettings.wallpaper) {
            const wallpaper = this.settings.appearance.wallpaper;
            if (wallpaper.startsWith('/System/Wallpapers/')) {
                // For system wallpapers, first try the filesystem URL
                this.system.filesystem.getFileUrl(wallpaper)
                    .then(url => {
                        document.getElementById('desktop').style.backgroundImage = `url(${url})`;
                    })
                    .catch(async (error) => {
                        // If file not found, try to copy it from assets
                        const wallpaperName = wallpaper.split('/').pop();
                        try {
                            const response = await fetch(`/assets/wallpapers/${wallpaperName}`);
                            const blob = await response.blob();
                            await this.system.filesystem.writeFile(wallpaper, blob);
                            
                            // Try getting the URL again
                            const url = await this.system.filesystem.getFileUrl(wallpaper);
                            document.getElementById('desktop').style.backgroundImage = `url(${url})`;
                        } catch (copyError) {
                            console.error('Failed to copy wallpaper:', copyError);
                            // Fallback to assets directory
                            document.getElementById('desktop').style.backgroundImage = `url(/assets/wallpapers/${wallpaperName})`;
                        }
                    });
            }
        }
        
        // Save settings to system
        this.system.state.systemPreferences = {
            ...this.system.state.systemPreferences,
            ...this.settings.appearance
        };
        
        // Save settings using settings manager
        await this.system.settingsManager.updateSettings(this.settings);
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