class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.fileSystemHandle = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Try to restore session
            const savedSession = localStorage.getItem('omega_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                this.currentUser = session.user;
                this.fileSystemHandle = session.fileSystemHandle;
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize auth system:', error);
            this.signOut();
        }
    }

    isSignedIn() {
        return !!this.currentUser;
    }

    getFileSystemHandle() {
        return this.fileSystemHandle;
    }

    setFileSystemHandle(handle) {
        this.fileSystemHandle = handle;
        this.saveSession();
    }

    clearFileSystemHandle() {
        this.fileSystemHandle = null;
        this.saveSession();
    }

    async signIn(username) {
        if (!username) return false;
        
        this.currentUser = {
            username,
            signedInAt: new Date().toISOString()
        };
        
        this.saveSession();
        return true;
    }

    async signOut() {
        this.currentUser = null;
        this.fileSystemHandle = null;
        localStorage.removeItem('omega_session');
    }

    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('omega_session', JSON.stringify({
                user: this.currentUser,
                fileSystemHandle: this.fileSystemHandle
            }));
        }
    }

    showSignInScreen() {
        // Remove any existing sign-in screen
        const existingScreen = document.getElementById('omega-signin');
        if (existingScreen) {
            existingScreen.remove();
        }

        const signInScreen = document.createElement('div');
        signInScreen.id = 'omega-signin';
        signInScreen.innerHTML = `
            <div class="signin-content">
                <img src="assets/omega-logo.svg" alt="OMEGA" class="signin-logo">
                <h1>Welcome to OMEGA OS</h1>
                <div class="signin-form">
                    <input type="text" id="username" placeholder="Enter your username" autocomplete="off">
                    <button id="signin-button">Sign In</button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #omega-signin {
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

            .signin-content {
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .signin-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
            }

            .signin-content h1 {
                color: white;
                font-size: 24px;
                margin-bottom: 30px;
            }

            .signin-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .signin-form input {
                padding: 12px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(0, 0, 0, 0.2);
                color: white;
                font-size: 16px;
                width: 250px;
            }

            .signin-form button {
                padding: 12px;
                border-radius: 8px;
                border: none;
                background: #007AFF;
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .signin-form button:hover {
                background: #0055CC;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(signInScreen);

        // Add event listeners
        const button = signInScreen.querySelector('#signin-button');
        const input = signInScreen.querySelector('#username');

        const handleSignIn = async () => {
            const username = input.value.trim();
            if (username) {
                await this.signIn(username);
                signInScreen.remove();
                window.location.reload();
            }
        };

        button.addEventListener('click', handleSignIn);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSignIn();
            }
        });
    }

    showWelcomeNotification() {
        if (this.currentUser) {
            // TODO: Implement notification system
            console.log(`Welcome back, ${this.currentUser.username}!`);
        }
    }
} 