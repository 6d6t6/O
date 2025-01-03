// OMEGA OS - Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.fileSystemHandle = null;
        this.isInitialized = false;
        this.isAuthScreenVisible = false;
        
        // Remove the localStorage.getItem call since we can't use the path directly
        this.lastDirectoryPath = null;

        // Define browser support information
        this.browserSupport = {
            chrome: {
                name: 'Chrome',
                minVersion: '121',
                support: 'full'
            },
            edge: {
                name: 'Edge',
                minVersion: '121',
                support: 'full'
            },
            firefox: {
                name: 'Firefox',
                minVersion: '111',
                support: 'partial'
            },
            safari: {
                name: 'Safari',
                minVersion: '16.4',
                support: 'partial'
            },
            opera: {
                name: 'Opera',
                minVersion: '107',
                support: 'full'
            },
            unknown: {
                name: 'Unknown Browser',
                support: 'none'
            }
        };
    }

    // Helper method to compare versions
    compareVersions(version1, version2) {
        // Split versions into parts
        const v1Parts = version1.toString().split('.').map(Number);
        const v2Parts = version2.toString().split('.').map(Number);

        // Pad arrays with zeros if needed
        while (v1Parts.length < 3) v1Parts.push(0);
        while (v2Parts.length < 3) v2Parts.push(0);

        // Compare major version
        if (v1Parts[0] !== v2Parts[0]) return v1Parts[0] - v2Parts[0];
        // Compare minor version
        if (v1Parts[1] !== v2Parts[1]) return v1Parts[1] - v2Parts[1];
        // Compare patch version
        return v1Parts[2] - v2Parts[2];
    }

    // Add browser detection method
    detectBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        let browser = 'unknown';
        let version = '0.0.0';

        // Opera - check first because it includes 'chrome'
        if (userAgent.includes('opr') || userAgent.includes('opera')) {
            browser = 'opera';
            console.log('Opera userAgent:', userAgent);
            const match = userAgent.match(/(?:opr|opera)\/(\d+)\.(\d+)\.(\d+)/);
            if (match) {
                version = `${match[1]}.${match[2]}.${match[3]}`;
                console.log('Detected Opera version:', version);
            }
        }
        // Edge (Chromium) - check before Chrome because it includes 'chrome'
        else if (userAgent.includes('edg')) {
            browser = 'edge';
            console.log('Edge userAgent:', userAgent);
            const match = userAgent.match(/edg\/(\d+)\.(\d+)\.(\d+)/);
            if (match) {
                version = `${match[1]}.${match[2]}.${match[3]}`;
                console.log('Detected Edge version:', version);
            }
        }
        // Chrome - check after Opera and Edge
        else if (userAgent.includes('chrome')) {
            browser = 'chrome';
            console.log('Chrome userAgent:', userAgent);
            const match = userAgent.match(/chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
            if (match) {
                version = `${match[1]}.${match[2]}.${match[3]}`;
                console.log('Detected Chrome version:', version);
            }
        }
        // Firefox
        else if (userAgent.includes('firefox')) {
            browser = 'firefox';
            console.log('Firefox userAgent:', userAgent);
            const match = userAgent.match(/firefox\/(\d+)\.(\d+)/);
            if (match) {
                version = `${match[1]}.${match[2]}.0`;
            }
            console.log('Detected Firefox version:', version);
        }
        // Safari - must be last because Chrome also includes 'safari'
        else if (userAgent.includes('safari')) {
            browser = 'safari';
            console.log('Safari userAgent:', userAgent);
            const match = userAgent.match(/version\/(\d+)\.(\d+)\.?(\d+)?/);
            if (match) {
                version = `${match[1]}.${match[2]}.${match[3] || '0'}`;
                console.log('Detected Safari version:', version);
            }
        }

        console.log('Final browser detection:', { browser, version });
        return { browser, version };
    }

    // Add browser compatibility check
    checkBrowserCompatibility() {
        const { browser, version } = this.detectBrowser();
        const browserInfo = this.browserSupport[browser] || this.browserSupport.unknown;
        const { name, minVersion, support } = browserInfo;

        if (support === 'none') {
            return { 
                isSupported: false, 
                browser, 
                version, 
                message: 'Your browser is not officially supported.' 
            };
        }

        const isOutdated = minVersion && this.compareVersions(version, minVersion) < 0;
        const isPartial = support === 'partial';

        if (isOutdated && isPartial) {
            return {
                isSupported: 'partial',
                browser,
                version,
                message: `Your ${name} version (${version}) is outdated and has partial support. Please update to version ${minVersion} or higher. Some features may not work correctly.`
            };
        }

        if (isOutdated) {
            return {
                isSupported: false,
                browser,
                version,
                message: `Your ${name} version (${version}) is outdated. Please update to version ${minVersion} or higher.`
            };
        }

        if (isPartial) {
            return {
                isSupported: 'partial',
                browser,
                version,
                message: `${name} has partial support. Some features may not work correctly.`
            };
        }

        return { isSupported: true, browser, version };
    }

    // Add browser warning dialog
    async showBrowserWarning(compatibility) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'window browser-warning-dialog';
            dialog.innerHTML = `
                <div class="window-content dialog-content">
                    <span class="material-symbols-rounded" style="font-size: 48px; color: #ff9500; font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;">warning</span>
                    <h2>Browser Compatibility Warning</h2>
                    <p>${compatibility.message}</p>
                    <p style="font-size: 12px; margin-top: 8px;">For the best experience, we recommend using the latest version of Chrome, Edge, or Opera.</p>
                    <div class="dialog-buttons">
                        <button class="dialog-button" id="continue-anyway">Continue Anyway</button>
                    </div>
                </div>
            `;

            // Add styles specific to this dialog
            const style = document.createElement('style');
            style.textContent = `
                .browser-warning-dialog {
                    position: fixed;
                    background: #1e1e1ebf;
                    backdrop-filter: var(--blur-filter);
                    border-radius: 12px;
                    box-shadow: 0 0 0 0.5px #404040, 0 0 0 1px black, 0 5px 30px rgba(0, 0, 0, 0.3);
                    width: 320px;
                    height: auto;
                    animation: windowAppear 0.2s ease-out;
                    user-select: none;
                    z-index: 10000;
                }

                .browser-warning-dialog.active {
                    box-shadow: 0 0 0 0.5px #404040, 0 0 0 1px black, 0 5px 30px rgba(0, 0, 0, 0.5);
                }

                .browser-warning-dialog .window-content {
                    padding: 24px 16px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    height: 100%;
                }

                .browser-warning-dialog h2 {
                    color: var(--text-color);
                    font-size: 16px;
                    margin: 16px 0 8px 0;
                    font-weight: 500;
                    pointer-events: none;
                }

                .browser-warning-dialog p {
                    color: var(--text-secondary);
                    font-size: 13px;
                    margin: 0;
                    pointer-events: none;
                }

                .browser-warning-dialog .dialog-buttons {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-top: 24px;
                }

                .browser-warning-dialog .dialog-button {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: none;
                    background: #ffffff40;
                    color: var(--text-color);
                    width: 132px;
                    height: 32px;
                    font-size: 12px;
                    font-weight: bold;
                    font-family: 'Inter';
                    cursor: pointer;
                    transition: background 0.2s;
                    justify-content: center;
                }

                .browser-warning-dialog .dialog-button:hover {
                    background: var(--button-hover-bg);
                }

                @keyframes windowAppear {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(dialog);

            // Center the dialog on screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const dialogWidth = 320;
            const dialogHeight = 280; // Approximate height
            dialog.style.left = `${(viewportWidth - dialogWidth) / 2}px`;
            dialog.style.top = `${(viewportHeight - dialogHeight) / 2}px`;

            // Make dialog draggable
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            const handleMouseDown = (e) => {
                if (e.target.closest('.dialog-buttons')) return;
                isDragging = true;
                initialX = e.clientX - dialog.offsetLeft;
                initialY = e.clientY - dialog.offsetTop;
            };

            const handleMouseMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                dialog.style.left = `${currentX}px`;
                dialog.style.top = `${currentY}px`;
            };

            const handleMouseUp = () => {
                isDragging = false;
            };

            dialog.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Handle continue button
            const continueBtn = dialog.querySelector('#continue-anyway');
            continueBtn.addEventListener('click', () => {
                dialog.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                dialog.remove();
                style.remove();
                resolve();
            });
        });
    }

    async initialize() {
        try {
            // Check browser compatibility first
            const compatibility = this.checkBrowserCompatibility();
            if (!compatibility.isSupported || compatibility.isSupported === 'partial') {
                await this.showBrowserWarning(compatibility);
            }

            // Continue with normal initialization
            const isSetupComplete = localStorage.getItem('omega-setup-complete') === 'true';
            
            if (!isSetupComplete) {
                await this.showSetupWizard();
                return;
            }

            // Try to restore session
            const savedSession = localStorage.getItem('omega_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                this.currentUser = session.user;
                this.isAuthenticated = true;
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize auth system:', error);
            await this.signOut();
        }
    }

    isSignedIn() {
        return !!this.currentUser && this.isAuthenticated;
    }

    getFileSystemHandle() {
        return this.fileSystemHandle;
    }

    async requestFileSystemAccess() {
        try {
            // Request file system access with just the mode option
            const options = {
                mode: 'readwrite'
            };
            
            this.fileSystemHandle = await window.showDirectoryPicker(options);
            
            // Store the directory handle name for display purposes only
            this.lastDirectoryPath = this.fileSystemHandle.name;
            
            return true;
        } catch (error) {
            console.error('Failed to get file system access:', error);
            return false;
        }
    }

    saveSession() {
        if (this.currentUser) {
            const session = {
                user: this.currentUser,
                timestamp: Date.now()
            };
            localStorage.setItem('omega_session', JSON.stringify(session));
            localStorage.setItem('omega-last-user', this.currentUser.username);
        }
    }

    async signIn(username, password) {
        try {
            const userJson = localStorage.getItem(`omega-user-${username}`);
            if (!userJson) {
                throw new Error('User not found');
            }

            const user = JSON.parse(userJson);

            // Verify credentials
            if (user.passwordHash) {
                const salt = new Uint8Array(user.salt);
                const passwordHash = await this.hashPassword(password, salt);
                if (passwordHash !== user.passwordHash) {
                    return false;
                }
            }

            // Request file system access
            const hasAccess = await this.requestFileSystemAccess();
            if (!hasAccess) {
                throw new Error('File system access is required');
            }

            // Set up session
            this.currentUser = user;
            this.isAuthenticated = true;
            
            // Save session
            this.saveSession();
            
            return true;
        } catch (error) {
            console.error('Sign in failed:', error);
            return false;
        }
    }

    async signOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.fileSystemHandle = null;
        localStorage.removeItem('omega_session');
        localStorage.removeItem('omega-last-user');
    }

    async showSignIn() {
        this.isAuthScreenVisible = true;
        
        document.body.innerHTML = `
            <div class="signin-screen">
                <div class="signin-container">
                    <div class="signin-header">
                        <img src="assets/omega-logo.svg" alt="Omega" class="signin-logo">
                        <h1>Sign in</h1>
                    </div>
                    <form id="signin-form" class="signin-form">
                        <input type="text" id="username" placeholder="Username" required autofocus autocomplete="off" spellcheck="false">
                        <input type="password" id="password" placeholder="Password" autocomplete="off" spellcheck="false">
                        <button type="submit">Sign In</button>
                        <button type="button" id="create-account" style="background: transparent;">Create a new user account</button>
                    </form>
                </div>
            </div>
        `;

        // Add signin styles
        const style = document.createElement('style');
        style.textContent = `
            .signin-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: var(--system-font);
            }

            .signin-container {
                width: 100%;
                max-width: 400px;
                padding: 40px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .signin-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .signin-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }

            .signin-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .signin-form input {
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 16px;
            }

            .signin-form input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            #create-account {
                background: rgba(255, 255, 255, 0.1);
            }

            #create-account:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);

        // Handle sign in
        const signinForm = document.getElementById('signin-form');
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const signInSuccess = await this.signIn(username, password);
                
                if (signInSuccess) {
                    // Show loading screen
                    document.body.innerHTML = `
                        <div class="loading-screen">
                            <img src="assets/omega-logo.svg" alt="Omega" class="loading-logo">
                            <div class="loading-text">Loading Omega...</div>
                        </div>
                    `;

                    // Add loading styles
                    const loadingStyle = document.createElement('style');
                    loadingStyle.textContent = `
                        .loading-screen {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: #1a1a1a;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            color: white;
                        }

                        .loading-logo {
                            width: 120px;
                            height: 120px;
                            margin-bottom: 24px;
                            animation: pulse 2s infinite;
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
                    `;
                    document.head.appendChild(loadingStyle);

                    // Clear auth screen flag
                    this.isAuthScreenVisible = false;
                    
                    // Initialize OS without reloading
                    await window.omegaOS.init();
                } else {
                    alert('Invalid username or password');
                }
            } catch (error) {
                alert(error.message);
            }
        });

        // Handle create account button
        const createAccountBtn = document.getElementById('create-account');
        createAccountBtn.addEventListener('click', () => {
            this.showSetupWizard();
        });
    }

    async showSetupWizard() {
        this.isAuthScreenVisible = true;
        const setupData = {};

        document.body.innerHTML = `
            <div class="setup-wizard">
                <div class="setup-container">
                    <div class="setup-header" id="setup-header">
                        <div class="setup-welcome">
                            <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Welcome</h1>
                            <p style="font-size: 12px; font-variation-settings: 'wght' 500; letter-spacing: 0.02em; margin-top: 12px;">In just a few steps, you'll be ready to use Omega.</p>
                        </div>
                    </div>
                    
                    <!-- Step 1: Region -->
                    <div class="setup-step" id="step-1">
                        <form id="region-form" class="setup-form">
                            <div class="select-wrapper">
                                <div class="classic-select">
                                    <select id="region" required size="10">
                                        <option value="" disabled>Select Region</option>
                                    </select>
                                </div>
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-button" disabled>Back</button>
                                <button type="submit">Continue</button>
                            </div>
                        </form>
                    </div>

                    <!-- Step 2: Language -->
                    <div class="setup-step" id="step-2" style="display: none;">
                        <form id="language-form" class="setup-form">
                            <div class="select-wrapper">
                                <div class="classic-select">
                                    <select id="language" required size="10">
                                        <option value="" disabled>Select Language</option>
                                    </select>
                                </div>
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-button">Back</button>
                                <button type="submit">Continue</button>
                            </div>
                        </form>
                    </div>

                    <!-- Step 4: Account Creation -->
                    <div class="setup-step" id="step-4" style="display: none;">
                        <form id="account-form" class="setup-form">
                            <div class="input-group">
                                <label for="display-name">Display Name</label>
                                <input type="text" id="display-name" required autofocus autocomplete="off" spellcheck="false" placeholder="Steve Jobs">
                            </div>
                            <div class="input-group">
                                <label for="username">Username</label>
                                <input type="text" id="username" required autocomplete="off" spellcheck="false" placeholder="steve_jobs">
                            </div>
                            <div class="input-group">
                                <label for="password">Password (optional)</label>
                                <input type="password" id="password" autocomplete="off" spellcheck="false" placeholder="•••••••••">
                            </div>
                            <div class="button-group">
                                <button type="button" class="back-button">Back</button>
                                <button type="submit">Continue</button>
                            </div>
                        </form>
                    </div>

                    <!-- Step 5: Date & Time -->
                    <div class="setup-step" id="step-5" style="display: none;">
                        <form id="datetime-form" class="setup-form">
                            <div class="setup-info">
                                <div class="current-time">
                                    <span id="current-time">--:--:--</span>
                                </div>
                                <div class="current-date">
                                    <span id="current-date">---</span>
                                </div>
                            </div>

                            <div class="checkbox-wrapper">
                                <label class="toggle-label">
                                    <span>Use 24-hour format</span>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="24hour" checked>
                                        <span class="toggle-slider"></span>
                                    </div>
                                </label>
                            </div>

                            <div class="checkbox-wrapper">
                                <label class="toggle-label">
                                    <span>Set Time & Date Automatically</span>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="auto-time" checked>
                                        <span class="toggle-slider"></span>
                                    </div>
                                </label>
                                <p class="setting-description">Synchronize with Internet time servers</p>
                            </div>

                            <div id="manual-time-settings" style="display: none;">
                                <div class="time-input-group">
                                    <label>Time</label>
                                    <input type="time" id="manual-time" step="1">
                                </div>
                                <div class="date-input-group">
                                    <label>Date</label>
                                    <input type="date" id="manual-date">
                                </div>
                            </div>

                            <div class="select-wrapper">
                                <label for="timezone">Time Zone</label>
                                <select id="timezone" required>
                                    <option value="" disabled selected>Select Time Zone</option>
                                </select>
                            </div>

                            <div class="button-group">
                                <button type="button" class="back-button">Back</button>
                                <button type="submit">Continue</button>
                            </div>
                        </form>
                    </div>

                    <!-- Step 6: File System Access -->
                    <div class="setup-step" id="step-6" style="display: none;">
                        <p>Omega needs a location to store your files and settings.</p>
                        <div class="button-group">
                            <button type="button" class="back-button">Back</button>
                            <button id="grant-access" class="primary-button">Choose Location</button>
                        </div>
                    </div>

                    <!-- Step 7: Summary -->
                    <div class="setup-step" id="step-7" style="display: none;">
                        <div class="setup-summary">
                            <ul id="setup-summary">
                            </ul>
                        </div>
                        <div class="button-group">
                            <button type="button" class="back-button">Back</button>
                            <button id="start-omega" class="primary-button">Start Using Omega</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create and add accessibility step
        const accessibilityStep = document.createElement('div');
        accessibilityStep.id = 'step-3';
        accessibilityStep.className = 'setup-step';
        accessibilityStep.style.display = 'none';
        accessibilityStep.innerHTML = `
            <div class="accessibility-grid">
                <div class="accessibility-option" data-feature="vision">
                    <span class="material-symbols-rounded">visibility</span>
                    <h3>Vision</h3>
                </div>
                <div class="accessibility-option" data-feature="motor">
                    <span class="material-symbols-rounded">back_hand</span>
                    <h3>Motor</h3>
                </div>
                <div class="accessibility-option" data-feature="hearing">
                    <span class="material-symbols-rounded">hearing</span>
                    <h3>Hearing</h3>
                </div>
                <div class="accessibility-option" data-feature="cognitive">
                    <span class="material-symbols-rounded">cognition</span>
                    <h3>Cognitive</h3>
                </div>
            </div>
            <div class="button-group">
                <button type="button" class="back-button">Back</button>
                <button type="button" class="primary-button" id="accessibility-continue">Not Now</button>
            </div>
        `;

        // Insert accessibility step after language step
        const languageStep = document.getElementById('step-2');
        languageStep.parentNode.insertBefore(accessibilityStep, languageStep.nextSibling);

        // Add setup wizard styles
        const style = document.createElement('style');
        style.textContent = `
            .setup-wizard {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: var(--system-font);
            }

            .setup-container {
                width: 100%;
                max-width: 640px;
                padding: 40px;
                background: #323232;
                border-radius: 16px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 0 0.5px #404040, 0 0 0 1px black, 0 5px 30px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                flex-direction: column;
            }

            .setup-header {
                text-align: center;
                /* margin-bottom: 16px; */
                height: 160px !important;
                margin: 32px 0;
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: center;
            }
            
            .setup-welcome {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
                background-image: url('assets/world.svg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }

            .setup-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }
            
            .setup-world {
                width: 320px;
                margin: 0 0 -80px 0;
            }

            .setup-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 560px;
            }

            .setup-form input,
            .setup-form select {
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 16px;
                width: 100%;
            }

            .setup-form select {
                appearance: none;
                padding: 4px 8px !important;
                text-align: left;
            }

            .select-wrapper {
                position: relative;
                display: grid;
                grid-template-columns: 0.5fr 1.5fr;
                align-items: center;
                gap: 16px;
                padding: 8px 0;
            }

            .select-wrapper label {
                font-size: 14px;
                font-weight: 500;
                margin: 0;
                color: white;
                text-align: right;
            }

            .select-wrapper select {
                width: 100%;
                min-width: 200px;
                padding: 8px 32px 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 14px;
                appearance: none;
            }

            .select-wrapper::after {
                content: '';
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.5);
            }

            .select-wrapper select:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .select-wrapper select:focus {
                outline: none;
                border-color: var(--accent-color);
                background: rgba(255, 255, 255, 0.2);
            }

            .setup-form input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .setup-info {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin: 8px 0;
            }

            .current-time {
                font-size: 48px;
                font-weight: 200;
                text-align: center;
                margin: 20px 0;
                font-variant-numeric: tabular-nums;
                letter-spacing: 2px;
            }

            .current-date {
                font-size: 18px;
                text-align: center;
                margin-bottom: 20px;
                color: rgba(255, 255, 255, 0.8);
            }

            .checkbox-wrapper {
                margin: 0;
            }

            .toggle-label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                font-weight: 500;
                margin: 0 !important;
                padding: 8px 0;
            }

            .toggle-label span {
                font-size: 14px;
                font-variation-settings: 'wght' 400;
                letter-spacing: 0.01em;
                /* padding: 0 8px; */
            }

            .toggle-switch {
                position: relative;
                width: 40px;
                height: 24px;
                margin-left: 8px;
                flex-shrink: 0;
            }

            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }

            .toggle-slider {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.1);
                transition: 0.3s;
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .toggle-switch input:checked + .toggle-slider {
                background-color: var(--accent-color);
                border-color: transparent;
            }

            .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(16px);
            }

            .toggle-switch input:focus-visible + .toggle-slider {
                outline: 2px solid var(--accent-color);
                outline-offset: 2px;
            }

            .toggle-label {
                font-size: 16px;
            }

            .setting-description {
                margin: 4px 0 0 0;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
            }

            .time-input-group,
            .date-input-group {
                margin: 16px 0;
                display: grid;
                grid-template-columns: 0.5fr 1.5fr;
                align-items: center;
                gap: 16px;
            }

            .time-input-group label,
            .date-input-group label {
                text-align: right;
                margin: 0;
                color: rgba(255, 255, 255, 0.7);
            }

            .time-input-group input,
            .date-input-group input {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 16px;
            }

            #manual-time-settings {
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .setup-summary {
                background: rgba(0, 0, 0, 0.2);
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }

            .setup-summary ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .setup-summary li {
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
            }

            .setup-step {
                animation: fadeIn 0.3s ease-out;
                width: 560px;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Add new styles for account form inputs */
            #account-form {
                display: grid;
                gap: 16px;
                width: 560px;
            }

            #account-form .input-group {
                display: grid;
                grid-template-columns: 0.5fr 1.5fr;
                align-items: center;
                gap: 16px;
            }

            #account-form .input-group label {
                text-align: right;
                color: white;
                font-size: 14px;
                font-weight: 500;
            }

            #account-form button {
                grid-column: 1 / -1;
            }

            .classic-select {
                background: #1c1c1e;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin: 12px 0;
                width: 320px;
                max-width: none;
            }

            .classic-select select {
                width: 100%;
                height: 260px;
                border: none;
                outline: none;
                background: transparent;
                font-size: 12px;
                line-height: 1.6;
                color: white;
                padding: 4px !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
            }
            
            .classic-select select:hover, .classic-select select:focus {
                background: unset !important;
            }

            .classic-select select:focus {
                outline: none;
            }

            .classic-select select option {
                padding: 4px 8px;
                align-content: center;
                display: flex;
                height: 24px;
                border-radius: 4px;
                cursor: default;
                background: #1c1c1e;
                color: white;
                font-size: 12px;
                line-height: 1.6 !important;
                -webkit-appearance: none;
                align-items: center;
            }

            .classic-select select option:hover {
                background: #80808040;
                color: white;
            }

            /* Enhanced selection styles */
            .classic-select select option:active,
            .classic-select select option:checked,
            .classic-select select option:focus,
            .classic-select select option:hover:active {
                background-color: #0064D2 !important;
                background: #0064D2 !important;
                color: white !important;
                -webkit-text-fill-color: white !important;
                -webkit-background-clip: text !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
            }

            /* Force blue background for selected options */
            .classic-select select option::selection {
                background: #0064D2 !important;
                color: white !important;
            }

            .classic-select select option::-moz-selection {
                background: #0064D2 !important;
                color: white !important;
            }

            /* Additional WebKit-specific styles */
            .classic-select select:focus option:checked,
            .classic-select select option:checked {
                background: #0064D2 linear-gradient(0deg, #0064D2 0%, #0064D2 100%) !important;
                background-color: #0064D2 !important;
                -webkit-appearance: none !important;
                color: white !important;
                -webkit-text-fill-color: white !important;
            }

            .select-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 24px;
                width: 100%;
                padding: 0 40px;
            }

            .select-wrapper label {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 8px;
            }

            /* width */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
                background: #222;
                border-radius: 0 8px 8px 0; // only on the right sides
            }

            /* Track */
            ::-webkit-scrollbar-track {
                background: transparent;
                margin: 12px 0;
                
            }

            /* Handle */
            ::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 8px;
                border: 2px solid #222;
            }

            /* Handle on hover */
            ::-webkit-scrollbar-thumb:hover {
                background: #999;
            }

            /* Remove Firefox dotted outline */
            .classic-select select:-moz-focusring {
                color: transparent;
                text-shadow: 0 0 0 #fff;
            }

            /* Hide the default arrow in IE */
            .classic-select select::-ms-expand {
                display: none;
            }

            .accessibility-grid {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
                gap: 8px;
            }

            .accessibility-option {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                width: 100%;
                padding: 24px;
                text-align: center;
                transition: all 0.2s ease;
                user-select: none;
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;
                cursor: pointer;
                position: relative;
                outline: none;
            }

            .accessibility-option:focus-visible {
                box-shadow: 0 0 0 2px var(--accent-color);
            }

            .accessibility-option:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .accessibility-option.selected {
                background: var(--accent-color);
                border-color: transparent;
            }

            .accessibility-option .material-symbols-rounded {
                font-size: 24px !important;
                margin-bottom: 12px;
                color: rgba(255, 255, 255, 0.9);
                font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24 !important;
            }

            .accessibility-option h3 {
                font-size: 16px;
                margin: 0;
                font-weight: 500;
            }

            .button-group {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 24px;
            }

            .back-button {
                background: #ffffff40;
                color: white;
                transition: background 0.2s;
                box-shadow: 0 0 0 0.5px #ffffff40, 0 0 0 0.5px #808080, 0 0 0 1px black, inset 0 -2px 6px #00000040, inset 0 2px 6px #ffffff40;
            }

            .back-button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .back-button:disabled {
                background: rgba(255, 255, 255, 0.1);
                opacity: 0.25;
            }
            
        `;
        document.head.appendChild(style);

        let currentStep = 1;

        // Function to scroll to selected option
        const scrollToSelected = (selectElement) => {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            if (selectedOption) {
                // Get the height of the select element's viewport
                const selectHeight = selectElement.getBoundingClientRect().height;
                // Get the option's height (assuming all options have the same height)
                const optionHeight = selectedOption.getBoundingClientRect().height;
                // Calculate position to center the option
                const scrollPosition = selectedOption.offsetTop - (selectHeight / 2) + (optionHeight / 2);
                
                // Calculate the maximum scroll position
                const maxScroll = selectElement.scrollHeight - selectHeight;
                
                // Ensure we don't scroll past the bounds
                // This allows partial centering for items near the top or bottom
                const finalScroll = Math.max(0, Math.min(scrollPosition, maxScroll));
                
                selectElement.scrollTop = finalScroll;
            }
        };

        // Function to show step
        const showStep = (step) => {
            document.querySelectorAll('.setup-step').forEach(el => el.style.display = 'none');
            const stepElement = document.getElementById(`step-${step}`);
            stepElement.style.display = '';
            
            // Update header based on current step
            updateHeader(step);
            
            // Add a small delay to ensure the select is fully rendered
            setTimeout(() => {
                // Apply scrolling to both region and language selects when their steps are shown
                if (step === 1) {
                    const regionSelect = document.getElementById('region');
                    scrollToSelected(regionSelect);
                } else if (step === 2) {
                    const languageSelect = document.getElementById('language');
                    scrollToSelected(languageSelect);
                }
            }, 50);
        };

        // Function to update header content
        const updateHeader = (step) => {
            const header = document.getElementById('setup-header');
            let headerContent = '';

            switch(step) {
                case 1:
                    headerContent = `
                        <div class="setup-welcome">
                            <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Welcome</h1>
                            <p style="font-size: 12px; font-variation-settings: 'wght' 500; letter-spacing: 0.02em; margin-top: 12px;">In just a few steps, you'll be ready to use Omega.</p>
                        </div>
                    `;
                    break;
                case 2:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">language</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Choose Your Language</h1>
                    `;
                    break;
                case 3:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">accessibility_new</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Accessibility</h1>
                        <p style="font-size: 12px; font-variation-settings: 'wght' 500; letter-spacing: 0.02em; margin-top: 12px;">Accessibility features adapt Omega to your individual needs. You can turn them on now to help you finish setting up, and further customize them later in System Settings.</p>
                    `;
                    break;
                case 4:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">account_circle</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Create Your Account</h1>
                    `;
                    break;
                case 5:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">schedule</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Date & Time</h1>
                    `;
                    break;
                case 6:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">hard_drive_2</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Storage Location</h1>
                    `;
                    break;
                case 7:
                    headerContent = `
                        <span class="material-symbols-rounded" style="font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;">check_circle</span>
                        <h1 style="font-variation-settings: 'wght' 200; letter-spacing: 0.8px;">Setup Complete</h1>
                    `;
                    break;
            }

            header.innerHTML = headerContent;
        };

        // Initialize region and language dropdowns
        const regionSelect = document.getElementById('region');
        const languageSelect = document.getElementById('language');

        // Load regions and languages from JSON files
        let regions = [];
        let languages = [];

        try {
            // Load regions and languages
            const [regionsResponse, languagesResponse] = await Promise.all([
                fetch('/data/regions.json'),
                fetch('/data/languages.json')
            ]);

            const regionsData = await regionsResponse.json();
            const languagesData = await languagesResponse.json();

            regions = regionsData.regions.sort((a, b) => a.name.localeCompare(b.name));
            languages = languagesData.languages.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Failed to load regions/languages:', error);
            // Fallback to basic English/US if loading fails
            regions = [{ code: 'US', name: 'United States' }];
            languages = [{ code: 'en-US', name: 'English (US)' }];
        }

        // Populate dropdowns
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.code;
            option.textContent = region.nativeName ? `${region.name} — ${region.nativeName}` : region.name;
            regionSelect.appendChild(option);
        });

        languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language.code;
            option.textContent = language.nativeName ? `${language.name} — ${language.nativeName}` : language.name;
            languageSelect.appendChild(option);
        });

        // Try to auto-detect region and language
        try {
            // Get user's language preferences
            const userLanguages = navigator.languages || [navigator.language || navigator.userLanguage];
            console.log('Detected user languages:', userLanguages);

            // Get the primary language preference
            const primaryLanguage = userLanguages[0];
            console.log('Primary language:', primaryLanguage);

            // Parse the language code using Intl.Locale for more reliable parsing
            const locale = new Intl.Locale(primaryLanguage);
            const detectedRegion = locale.region || 'US';
            console.log('Detected region:', detectedRegion);

            // Set region if it exists in our list
            if (regions.find(r => r.code === detectedRegion)) {
                regionSelect.value = detectedRegion;
                console.log('Set region to:', detectedRegion);
                // Scroll to the selected region immediately
                setTimeout(() => {
                    scrollToSelected(regionSelect);
                }, 50);
            }

            // Try to find an exact match for the language-region combination
            const exactMatch = languages.find(l => l.code.toLowerCase() === primaryLanguage.toLowerCase());
            if (exactMatch) {
                languageSelect.value = exactMatch.code;
                console.log('Found exact language match:', exactMatch.code);
            } else {
                // If no exact match, try to find a language match with the detected region
                const languageWithRegion = `${locale.language}-${detectedRegion}`;
                const regionMatch = languages.find(l => l.code.toLowerCase() === languageWithRegion.toLowerCase());
                if (regionMatch) {
                    languageSelect.value = regionMatch.code;
                    console.log('Found region-specific language match:', regionMatch.code);
                } else {
                    // Fallback to base language match
                    const baseLanguage = locale.language;
                    const baseMatch = languages.find(l => l.code.startsWith(`${baseLanguage}-`));
                    if (baseMatch) {
                        languageSelect.value = baseMatch.code;
                        console.log('Found base language match:', baseMatch.code);
                    }
                }
            }

            // Also scroll when switching steps
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.style.display === '') {
                        const select = mutation.target.querySelector('select');
                        if (select) {
                            // Add a small delay to ensure the select is fully rendered
                            setTimeout(() => {
                                scrollToSelected(select);
                            }, 50);
                        }
                    }
                });
            });

            // Observe both step containers for display changes
            document.querySelectorAll('.setup-step').forEach(step => {
                observer.observe(step, { attributes: true, attributeFilter: ['style'] });
            });

            // Handle initial scroll for language select
            setTimeout(() => {
                scrollToSelected(languageSelect);
            }, 50);

        } catch (error) {
            console.warn('Failed to auto-detect region/language:', error);
        }

        // Handle region selection
        const regionForm = document.getElementById('region-form');
        regionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setupData.region = document.getElementById('region').value;
            currentStep = 2;
            showStep(2);
        });

        // Handle language selection
        const languageForm = document.getElementById('language-form');
        languageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setupData.language = document.getElementById('language').value;

            // Initialize settings structure
            setupData.settings = {
                appearance: {
                    theme: "dark",
                    accentColor: "#007AFF",
                    fontSize: "14px"
                },
                wallpaper: {
                    path: "/System/Wallpapers/milad-fakurian-iLHDO19h0ng-unsplash.jpg"
                },
                system: {
                    region: setupData.region,
                    language: setupData.language,
                    notifications: true,
                    animations: true,
                    soundEffects: true
                },
                notifications: {
                    order: "newest-first",
                    browserNotifications: true
                }
            };

            currentStep = 3;
            showStep(3);
        });

        // Handle accessibility options
        const accessibilityOptions = new Set();
        const accessibilityGrid = document.querySelector('.accessibility-grid');
        
        // Make each option focusable and add ARIA attributes
        document.querySelectorAll('.accessibility-option').forEach((option, index) => {
            option.setAttribute('tabindex', '0');
            option.setAttribute('role', 'checkbox');
            option.setAttribute('aria-checked', 'false');
            
            // Handle click and keyboard events
            const toggleOption = () => {
                option.classList.toggle('selected');
                const feature = option.dataset.feature;
                const isSelected = option.classList.contains('selected');
                
                option.setAttribute('aria-checked', isSelected.toString());
                
                if (isSelected) {
                    accessibilityOptions.add(feature);
                } else {
                    accessibilityOptions.delete(feature);
                }

                // Update continue button text
                const continueButton = document.getElementById('accessibility-continue');
                continueButton.textContent = accessibilityOptions.size > 0 ? 'Continue' : 'Not Now';
            };

            // Click handler
            option.addEventListener('click', toggleOption);
            
            // Keyboard handlers
            option.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case ' ':
                    case 'Enter':
                        e.preventDefault();
                        toggleOption();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextOption = option.nextElementSibling;
                        if (nextOption) nextOption.focus();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevOption = option.previousElementSibling;
                        if (prevOption) prevOption.focus();
                        break;
                }
            });
        });

        // Handle accessibility continue/skip
        document.getElementById('accessibility-continue').addEventListener('click', async () => {
            // Add accessibility settings at the root level
            setupData.settings.accessibility = {
                enabled: accessibilityOptions.size > 0,
                features: Array.from(accessibilityOptions)
            };
            
            currentStep = 4;
            showStep(4);
        });

        // Update step numbers for remaining steps
        const accountForm = document.getElementById('account-form');
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const displayName = document.getElementById('display-name').value;
            const password = document.getElementById('password').value;

            try {
                // Validate username
                if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                    throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
                }

                if (localStorage.getItem(`omega-user-${username}`)) {
                    throw new Error('Username already exists');
                }

                // Store account details in setupData for later creation
                setupData.accountDetails = {
                    username,
                    displayName,
                    password
                };
                // Also store these at the root level for the summary screen
                setupData.username = username;
                setupData.displayName = displayName;

                currentStep = 5;
                showStep(5);
                initializeDateTimeStep();
            } catch (error) {
                alert(error.message);
            }
        });

        // Initialize and handle date & time settings
        function initializeDateTimeStep() {
            const autoTimeCheckbox = document.getElementById('auto-time');
            const manualSettings = document.getElementById('manual-time-settings');
            const timeDisplay = document.getElementById('current-time');
            const dateDisplay = document.getElementById('current-date');
            const timezoneSelect = document.getElementById('timezone');
            const hour24Checkbox = document.getElementById('24hour');
            const manualTimeInput = document.getElementById('manual-time');
            const manualDateInput = document.getElementById('manual-date');

            // Populate timezone dropdown
            const timeZones = Intl.supportedValuesOf('timeZone');
            timeZones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone;
                // Format timezone name to be more readable
                option.textContent = zone.replace(/_/g, ' ').replace(/\//g, ' / ');
                timezoneSelect.appendChild(option);
            });

            // Try to detect user's timezone
            try {
                const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                timezoneSelect.value = userTimeZone;
            } catch (error) {
                console.warn('Failed to detect timezone:', error);
            }

            // Update clock
            function updateClock() {
                const now = new Date();
                
                // Convert the time to the selected timezone
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: !hour24Checkbox.checked,
                    timeZone: timezoneSelect.value
                };
                const dateOptions = {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: timezoneSelect.value
                };

                timeDisplay.textContent = now.toLocaleTimeString(setupData.language, timeOptions);
                dateDisplay.textContent = now.toLocaleDateString(setupData.language, dateOptions);

                // Update manual inputs with timezone-adjusted values
                const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezoneSelect.value }));
                const timeString = tzDate.toTimeString().split(' ')[0];
                const dateString = tzDate.toISOString().split('T')[0];
                manualTimeInput.value = timeString;
                manualDateInput.value = dateString;
            }

            // Start clock updates
            updateClock();
            const clockInterval = setInterval(updateClock, 1000);

            // Handle auto/manual toggle
            autoTimeCheckbox.addEventListener('change', () => {
                manualSettings.style.display = autoTimeCheckbox.checked ? 'none' : 'block';
            });

            // Handle 24-hour format toggle
            hour24Checkbox.addEventListener('change', updateClock);

            // Handle timezone change
            timezoneSelect.addEventListener('change', updateClock);

            // Handle form submission
            const datetimeForm = document.getElementById('datetime-form');
            datetimeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                clearInterval(clockInterval);

                // Store time settings while preserving other settings
                setupData.settings.system = {
                    ...setupData.settings.system,
                    timezone: timezoneSelect.value,
                    use24Hour: hour24Checkbox.checked,
                    autoTime: autoTimeCheckbox.checked
                };

                if (!autoTimeCheckbox.checked) {
                    const manualDate = new Date(`${manualDateInput.value}T${manualTimeInput.value}`);
                    const tzOffset = new Date().toLocaleString('en-US', { timeZone: timezoneSelect.value, timeZoneName: 'short' }).split(' ').pop();
                    setupData.settings.system.manualTime = `${manualDate.toISOString().split('.')[0]}${tzOffset}`;
                }

                currentStep = 6;
                showStep(6);
            });

            // If we have an Internet connection, use the browser's timezone
            if (autoTimeCheckbox.checked) {
                try {
                    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    console.log('Using browser timezone:', browserTimeZone);
                    
                    // Get current time in the detected timezone
                    const now = new Date();
                    const tzTime = now.toLocaleString('en-US', { timeZone: browserTimeZone });
                    console.log('Current time in detected timezone:', tzTime);
                    
                    // Get timezone offset
                    const tzOffset = now.toLocaleString('en-US', { timeZone: browserTimeZone, timeZoneName: 'long' });
                    console.log('Timezone details:', tzOffset);
                } catch (error) {
                    console.warn('Failed to get browser timezone:', error);
                }
            }
        }

        // Handle file system access
        const grantAccessBtn = document.getElementById('grant-access');
        grantAccessBtn.addEventListener('click', async () => {
            try {
                const hasAccess = await this.requestFileSystemAccess();
                if (hasAccess) {
                    // Create System/Preferences directory structure and save settings
                    try {
                        // Create System directory
                        const systemHandle = await this.fileSystemHandle.getDirectoryHandle('System', { create: true });
                        // Create Preferences directory inside System
                        const preferencesHandle = await systemHandle.getDirectoryHandle('Preferences', { create: true });
                        // Create settings.json inside Preferences
                        const settingsHandle = await preferencesHandle.getFileHandle('settings.json', { create: true });
                        
                        // Write settings to the file
                        const writable = await settingsHandle.createWritable();
                        await writable.write(JSON.stringify(setupData.settings, null, 2));
                        await writable.close();
                    } catch (error) {
                        console.error('Failed to save settings to settings.json:', error);
                    }

                    // Update summary
                    const summary = document.getElementById('setup-summary');
                    const region = regions.find(r => r.code === setupData.region);
                    const language = languages.find(l => l.code === setupData.language);
                    const timezone = document.getElementById('timezone').value;
                    
                    // Format accessibility features for display
                    const accessibilityText = setupData.settings.accessibility?.features?.length 
                        ? setupData.settings.accessibility.features.map(feature => 
                            feature.charAt(0).toUpperCase() + feature.slice(1)
                          ).join(', ')
                        : '';
                    
                    summary.innerHTML = `
                        <li><strong>Language:</strong> ${language?.nativeName || language?.name}</li>
                        <li><strong>Region:</strong> ${region?.nativeName || region?.name}</li>
                        <li><strong>Display Name:</strong> ${setupData.displayName}</li>
                        <li><strong>Username:</strong> ${setupData.username}</li>
                        <li><strong>Time Zone:</strong> ${timezone}</li>
                        ${accessibilityText ? `<li><strong>Accessibility:</strong> ${accessibilityText}</li>` : ''}
                        <li><strong>Storage Location:</strong> ${this.lastDirectoryPath}</li>
                    `;
                    
                    currentStep = 7;
                    showStep(7);
                } else {
                    throw new Error('Failed to get file system access');
                }
            } catch (error) {
                alert('Failed to get file system access. Please try again.');
            }
        });

        // Handle completion
        const startBtn = document.getElementById('start-omega');
        startBtn.addEventListener('click', async () => {
            try {
                // Create the user account now
                const { username, displayName, password } = setupData.accountDetails;
                const success = await this.createAccount(username, password, displayName);
                if (!success) {
                    throw new Error('Failed to create account');
                }

                // Set setup as complete
                localStorage.setItem('omega-setup-complete', 'true');
                
                // Save final settings to settings.json
                try {
                    const systemHandle = await this.fileSystemHandle.getDirectoryHandle('System', { create: true });
                    const preferencesHandle = await systemHandle.getDirectoryHandle('Preferences', { create: true });
                    const settingsHandle = await preferencesHandle.getFileHandle('settings.json', { create: true });
                    
                    // Log settings before saving to help debug
                    console.log('Saving final settings:', JSON.stringify(setupData.settings, null, 2));
                    
                    const writable = await settingsHandle.createWritable();
                    await writable.write(JSON.stringify(setupData.settings, null, 2));
                    await writable.close();
                } catch (error) {
                    console.error('Failed to save final settings to settings.json:', error);
                }
                
                // Set up session with complete settings
                this.currentUser = {
                    username: setupData.username,
                    displayName: setupData.displayName,
                    settings: setupData.settings,
                    signedInAt: new Date().toISOString()
                };
                this.isAuthenticated = true;
                this.saveSession();

                // Show loading screen
                document.body.innerHTML = `
                    <div class="loading-screen">
                        <img src="assets/omega-logo.svg" alt="Omega" class="loading-logo">
                        <div class="loading-text">Loading Omega OS...</div>
                    </div>
                `;
                
                // Add loading styles
                const loadingStyle = document.createElement('style');
                loadingStyle.textContent = `
                    .loading-screen {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #1a1a1a;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    }

                    .loading-logo {
                        width: 120px;
                        height: 120px;
                        margin-bottom: 24px;
                        animation: pulse 2s infinite;
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
                `;
                document.head.appendChild(loadingStyle);

                // Clear auth screen flag
                this.isAuthScreenVisible = false;
                
                // Initialize OS
                await window.omegaOS.init();

                // Apply settings after OS is initialized
                if (setupData.settings) {
                    await window.omegaOS.settingsManager.updateSettings(setupData.settings);
                }
            } catch (error) {
                alert(error.message);
            }
        });

        // Add back button functionality to all steps
        document.querySelectorAll('.back-button').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', () => {
                    currentStep--;
                    showStep(currentStep);
                });
            }
        });
    }

    async createAccount(username, password, displayName) {
        // Validate username
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
        }

        if (localStorage.getItem(`omega-user-${username}`)) {
            throw new Error('Username already exists');
        }

        // Create user object
        const user = {
            username,
            displayName,
            created: Date.now(),
            settings: {}
        };

        // Hash password if provided
        if (password) {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const passwordHash = await this.hashPassword(password, salt);
            user.passwordHash = passwordHash;
            user.salt = Array.from(salt);
        }

        // Save user
        localStorage.setItem(`omega-user-${username}`, JSON.stringify(user));
        localStorage.setItem('omega-last-user', username);
        
        this.currentUser = user;
        return true;
    }

    generateSessionToken() {
        // Generate a random session token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const saltedPassword = new Uint8Array([...salt, ...passwordData]);
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    showWelcomeNotification() {
        const user = this.getCurrentUser();
        if (user) {
            const isNewUser = !localStorage.getItem(`omega-user-${user.username}-has-logged-in`);
            if (isNewUser) {
                localStorage.setItem(`omega-user-${user.username}-has-logged-in`, 'true');
                window.omegaOS.showNotification(
                    'Omega',
                    `Welcome, ${user.displayName}!`,
                    'assets/icons/system-icon.svg'
                );
            } else {
                window.omegaOS.showNotification(
                    'Omega',
                    `Welcome back, ${user.displayName}!`,
                    'assets/icons/system-icon.svg'
                );
            }
        }
    }
} 