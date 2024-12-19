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
                        <img src="assets/omega-logo.svg" alt="Omega" class="signin-logo">
                        <h1>Sign in</h1>
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
                    <div class="setup-header">
                        <img src="assets/omega-logo.svg" alt="Omega" class="setup-logo">
                        <h1>Welcome to Omega</h1>
                    </div>
                    
                    <!-- Step 1: Account Creation -->
                    <div class="setup-step" id="step-1">
                        <h2>Create Your Account</h2>
                        <form id="account-form" class="setup-form">
                            <input type="text" id="display-name" placeholder="Display Name" required>
                            <input type="text" id="username" placeholder="Username" required>
                            <input type="password" id="password" placeholder="Password (optional)">
                            <button type="submit">Continue</button>
                        </form>
                    </div>

                    <!-- Step 2: Region & Language -->
                    <div class="setup-step" id="step-2" style="display: none;">
                        <h2>Choose Your Region & Language</h2>
                        <form id="locale-form" class="setup-form">
                            <div class="select-wrapper">
                                <select id="region" required>
                                    <option value="" disabled selected>Select Region</option>
                                </select>
                            </div>
                            <div class="select-wrapper">
                                <select id="language" required>
                                    <option value="" disabled selected>Select Language</option>
                                </select>
                            </div>
                            <div class="setup-info">
                                <p>We'll try to detect your region and language automatically.</p>
                            </div>
                            <button type="submit">Continue</button>
                        </form>
                    </div>

                    <!-- Step 3: Date & Time -->
                    <div class="setup-step" id="step-3" style="display: none;">
                        <h2>Date & Time Settings</h2>
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
                                <label class="toggle-switch">
                                    <input type="checkbox" id="auto-time" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Set Time & Date Automatically</span>
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
                                <label>Time Zone</label>
                                <select id="timezone" required>
                                    <option value="" disabled selected>Select Time Zone</option>
                                </select>
                            </div>

                            <div class="checkbox-wrapper">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="24hour" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-label">Use 24-hour format</span>
                                </label>
                            </div>

                            <button type="submit">Continue</button>
                        </form>
                    </div>

                    <!-- Step 4: File System Access -->
                    <div class="setup-step" id="step-4" style="display: none;">
                        <h2>Storage Location</h2>
                        <p>Omega needs a location to store your files and settings.</p>
                        <button id="grant-access" class="primary-button">Choose Location</button>
                    </div>

                    <!-- Step 5: Summary -->
                    <div class="setup-step" id="step-5" style="display: none;">
                        <h2>Setup Complete!</h2>
                        <div class="setup-summary">
                            <ul id="setup-summary">
                            </ul>
                        </div>
                        <button id="start-omega" class="primary-button">Start Using Omega</button>
                    </div>
                </div>
            </div>
        `;

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
                cursor: pointer;
            }

            .select-wrapper {
                position: relative;
            }

            .select-wrapper::after {
                content: '▼';
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                pointer-events: none;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
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
                margin: 16px 0;
            }

            .toggle-switch {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .toggle-switch input {
                display: none;
            }

            .toggle-slider {
                position: relative;
                width: 50px;
                height: 24px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                margin-right: 12px;
                transition: 0.3s;
            }

            .toggle-slider:before {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: 0.3s;
            }

            .toggle-switch input:checked + .toggle-slider {
                background: var(--accent-color, #007AFF);
            }

            .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }

            .toggle-label {
                font-size: 16px;
            }

            .setting-description {
                margin: 4px 0 0 62px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
            }

            .time-input-group,
            .date-input-group {
                margin: 16px 0;
            }

            .time-input-group label,
            .date-input-group label,
            .select-wrapper label {
                display: block;
                margin-bottom: 8px;
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
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);

        let currentStep = 1;

        const showStep = (step) => {
            document.querySelectorAll('.setup-step').forEach(el => el.style.display = 'none');
            document.getElementById(`step-${step}`).style.display = 'block';
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
        } catch (error) {
            console.warn('Failed to auto-detect region/language:', error);
        }

        // Handle account creation
        const accountForm = document.getElementById('account-form');
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const displayName = document.getElementById('display-name').value;
            const password = document.getElementById('password').value;

            try {
                const success = await this.createAccount(username, password, displayName);
                if (success) {
                    setupData.username = username;
                    setupData.displayName = displayName;
                    currentStep = 2;
                    showStep(2);
                }
            } catch (error) {
                alert(error.message);
            }
        });

        // Handle region & language selection
        const localeForm = document.getElementById('locale-form');
        localeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setupData.region = document.getElementById('region').value;
            setupData.language = document.getElementById('language').value;

            // Store settings in setupData instead of updating immediately
            setupData.settings = {
                system: {
                    region: setupData.region,
                    language: setupData.language
                }
            };

            currentStep = 3;
            showStep(3);

            // Initialize date & time step
            initializeDateTimeStep();
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

                // Store time settings
                setupData.settings.system = {
                    ...setupData.settings.system,
                    timezone: timezoneSelect.value,
                    use24Hour: hour24Checkbox.checked,
                    autoTime: autoTimeCheckbox.checked
                };

                if (!autoTimeCheckbox.checked) {
                    // Create date in the selected timezone
                    const manualDate = new Date(`${manualDateInput.value}T${manualTimeInput.value}`);
                    const tzOffset = new Date().toLocaleString('en-US', { timeZone: timezoneSelect.value, timeZoneName: 'short' }).split(' ').pop();
                    setupData.settings.system.manualTime = `${manualDate.toISOString().split('.')[0]}${tzOffset}`;
                }

                currentStep = 4;
                showStep(4);
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
                    // Update summary
                    const summary = document.getElementById('setup-summary');
                    const region = regions.find(r => r.code === setupData.region);
                    const language = languages.find(l => l.code === setupData.language);
                    const timezone = document.getElementById('timezone').value;
                    
                    summary.innerHTML = `
                        <li><strong>Display Name:</strong> ${setupData.displayName}</li>
                        <li><strong>Username:</strong> ${setupData.username}</li>
                        <li><strong>Region:</strong> ${region?.nativeName || region?.name}</li>
                        <li><strong>Language:</strong> ${language?.nativeName || language?.name}</li>
                        <li><strong>Time Zone:</strong> ${timezone}</li>
                        <li><strong>Storage Location:</strong> ${this.lastDirectoryPath}</li>
                    `;
                    
                    currentStep = 5;
                    showStep(5);
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
                
                // Set up session directly without requesting filesystem access again
                this.currentUser = {
                    username: setupData.username,
                    displayName: setupData.displayName,
                    settings: setupData.settings, // Store settings in user object
                    signedInAt: new Date().toISOString()
                };
                this.isAuthenticated = true;
                this.saveSession();
                
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