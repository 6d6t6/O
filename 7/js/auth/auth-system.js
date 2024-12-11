// OMEGA OS - Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.fileSystemHandle = null;
        this.isInitialized = false;
        this.isAuthScreenVisible = false;
        
        // Remove the localStorage.getItem call since we can't use the path directly
        this.lastDirectoryPath = null;
    }

    async initialize() {
        try {
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
                        <img src="assets/omega-logo.svg" alt="OMEGA OS" class="signin-logo">
                        <h1>Sign in to OMEGA OS</h1>
                    </div>
                    <form id="signin-form" class="signin-form">
                        <input type="text" id="username" placeholder="Username" required>
                        <input type="password" id="password" placeholder="Password">
                        <button type="submit">Sign In</button>
                        <button type="button" id="create-account">Create Account</button>
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

            button {
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: var(--accent-color, #007AFF);
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
            }

            button:hover {
                background: var(--accent-color-hover, #0066CC);
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
                            <img src="assets/omega-logo.svg" alt="OMEGA OS" class="loading-logo">
                            <div class="loading-text">Loading OMEGA OS...</div>
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
        let currentStep = 1;
        let setupData = {};
        
        const showStep = (stepNumber) => {
            document.querySelectorAll('.setup-step').forEach(step => {
                step.style.display = 'none';
            });
            document.querySelector(`[data-step="${stepNumber}"]`).style.display = 'block';
        };

        document.body.innerHTML = `
            <div class="setup-wizard">
                <div class="setup-container">
                    <div class="setup-header">
                        <img src="assets/omega-logo.svg" alt="OMEGA OS" class="setup-logo">
                        <h1>Welcome to OMEGA OS</h1>
                    </div>
                    <div class="setup-content">
                        <div class="setup-step" data-step="1">
                            <h2>Create Your Account</h2>
                            <form id="account-form" class="setup-form">
                                <input type="text" id="username" placeholder="Username" required>
                                <input type="password" id="password" placeholder="Password (optional)">
                                <input type="text" id="display-name" placeholder="Display Name" required>
                                <button type="submit">Continue</button>
                            </form>
                        </div>
                        <div class="setup-step" data-step="2" style="display: none;">
                            <h2>File System Access</h2>
                            <p>OMEGA OS needs permission to access a directory on your computer to store your files and settings.</p>
                            <div class="setup-info">
                                <p>When you click "Grant Access", you'll be asked to:</p>
                                <ol>
                                    <li>Select a directory where OMEGA OS will store its files</li>
                                    <li>Grant permission for OMEGA OS to access this directory</li>
                                </ol>
                                <p>This permission is required for OMEGA OS to function properly.</p>
                                <p class="setup-tip">💡 Tip: We recommend creating a new folder named "OMEGA OS" on your desktop.</p>
                            </div>
                            <button id="grant-access">Grant Access</button>
                        </div>
                        <div class="setup-step" data-step="3" style="display: none;">
                            <h2>Setup Complete!</h2>
                            <p>Your OMEGA OS is ready to use.</p>
                            <div class="setup-info">
                                <p>Your account has been created with:</p>
                                <ul id="setup-summary"></ul>
                            </div>
                            <button id="start-omega">Start OMEGA OS</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add setup styles
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
                max-width: 500px;
                padding: 40px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .setup-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .setup-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }

            .setup-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .setup-form input {
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 16px;
            }

            .setup-form input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .setup-info {
                text-align: left;
                margin: 20px 0;
                padding: 20px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            }

            .setup-info ol, .setup-info ul {
                margin: 10px 0;
                padding-left: 20px;
            }

            .setup-info li {
                margin: 8px 0;
                color: rgba(255, 255, 255, 0.8);
            }

            .setup-tip {
                margin-top: 16px;
                color: #007AFF;
            }

            button {
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: var(--accent-color, #007AFF);
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
                width: 100%;
            }

            button:hover {
                background: var(--accent-color-hover, #0066CC);
            }

            .setup-step {
                text-align: center;
            }

            .setup-step h2 {
                margin-bottom: 20px;
            }

            .setup-step p {
                margin-bottom: 20px;
                color: rgba(255, 255, 255, 0.8);
            }
        `;
        document.head.appendChild(style);

        // Handle account creation
        const accountForm = document.getElementById('account-form');
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setupData.username = document.getElementById('username').value;
            setupData.password = document.getElementById('password').value;
            setupData.displayName = document.getElementById('display-name').value;

            try {
                // Create the account
                await this.createAccount(setupData.username, setupData.password, setupData.displayName);
                
                // Move to next step
                currentStep = 2;
                showStep(2);
            } catch (error) {
                alert(error.message);
            }
        });

        // Handle file system access
        const grantAccessBtn = document.getElementById('grant-access');
        grantAccessBtn.addEventListener('click', async () => {
            try {
                const hasAccess = await this.requestFileSystemAccess();
                if (hasAccess) {
                    // Update summary
                    const summary = document.getElementById('setup-summary');
                    summary.innerHTML = `
                        <li><strong>Username:</strong> ${setupData.username}</li>
                        <li><strong>Display Name:</strong> ${setupData.displayName}</li>
                        <li><strong>Storage Location:</strong> ${this.lastDirectoryPath}</li>
                    `;
                    
                    currentStep = 3;
                    showStep(3);
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
                // Set setup as complete
                localStorage.setItem('omega-setup-complete', 'true');
                
                // Show loading screen
                document.body.innerHTML = `
                    <div class="loading-screen">
                        <img src="assets/omega-logo.svg" alt="OMEGA OS" class="loading-logo">
                        <div class="loading-text">Loading OMEGA OS...</div>
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
                
                // Set up session directly without requesting filesystem access again
                this.currentUser = {
                    username: setupData.username,
                    displayName: setupData.displayName,
                    signedInAt: new Date().toISOString()
                };
                this.isAuthenticated = true;
                this.saveSession();
                
                // Initialize OS
                await window.omegaOS.init();
            } catch (error) {
                alert(error.message);
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
            window.omegaOS.showNotification(
                'Welcome to OMEGA OS',
                `Welcome back, ${user.displayName}!`
            );
        }
    }
} 