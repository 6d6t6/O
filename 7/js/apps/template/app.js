class TemplateApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        // Initialize your app's state here
        this.state = {
            counter: 0
        };
    }

    async onInitialize(window) {
        // Set up your app's UI
        window.setContent(`
            <div class="template-app">
                <header class="app-header">
                    <h1>Template App</h1>
                </header>
                <main class="app-content">
                    <div class="counter-section">
                        <p>Counter: <span id="counter">0</span></p>
                        <button id="increment">Increment</button>
                    </div>
                    <div class="demo-section">
                        <h2>Features Demo</h2>
                        <button id="show-notification">Show Notification</button>
                        <button id="show-dialog">Show Dialog</button>
                        <button id="show-error">Show Error</button>
                    </div>
                </main>
            </div>
        `);

        // Add your app's styles
        window.addStyles(`
            .template-app {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--window-bg);
                color: var(--text-color);
            }

            .app-header {
                padding: 16px;
                background: var(--toolbar-bg);
                border-bottom: 1px solid var(--border-color);
            }

            .app-header h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 500;
            }

            .app-content {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
            }

            .counter-section,
            .demo-section {
                margin-bottom: 32px;
                padding: 16px;
                border-radius: 8px;
                background: var(--card-bg);
                border: 1px solid var(--border-color);
            }

            h2 {
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 500;
            }

            button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: var(--button-bg);
                color: var(--button-text);
                cursor: pointer;
                transition: background-color 0.2s;
            }

            button:hover {
                background: var(--button-hover-bg);
            }

            button + button {
                margin-left: 8px;
            }
        `);

        // Initialize event listeners
        this.initializeEventListeners(window);
    }

    initializeEventListeners(window) {
        // Counter functionality
        const incrementBtn = window.querySelector('#increment');
        incrementBtn.addEventListener('click', () => {
            this.state.counter++;
            this.updateCounter(window);
        });

        // Demo buttons
        const notificationBtn = window.querySelector('#show-notification');
        notificationBtn.addEventListener('click', () => {
            this.system.showNotification(
                'Template App',
                'This is a demo notification',
                { timeout: 3000 }
            );
        });

        const dialogBtn = window.querySelector('#show-dialog');
        dialogBtn.addEventListener('click', async () => {
            const result = await window.showPrompt(
                'Demo Dialog',
                'Enter some text:'
            );
            if (result) {
                this.system.showNotification(
                    'Dialog Result',
                    `You entered: ${result}`
                );
            }
        });

        const errorBtn = window.querySelector('#show-error');
        errorBtn.addEventListener('click', () => {
            window.showError(
                'Demo Error',
                'This is what an error message looks like'
            );
        });
    }

    updateCounter(window) {
        const counterElement = window.querySelector('#counter');
        counterElement.textContent = this.state.counter;
    }

    // Clean up when the app is closed
    onCleanup() {
        // Clean up any resources, event listeners, etc.
        console.log('Template app cleanup');
    }
}

// Register the app with the system
window.TemplateApp = TemplateApp; 