class FinderApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.windowStates = new Map();
    }

    async onInitialize(window) {
        // Create window-specific state
        this.windowStates.set(window.id, {
            currentPath: '/',
            history: [],
            historyIndex: -1
        });
        
        // Set up window content
        window.setContent(`
            <div class="finder">
                <div class="finder-toolbar">
                    <div class="finder-nav">
                        <button class="nav-btn" id="back">←</button>
                        <button class="nav-btn" id="forward">→</button>
                        <button class="nav-btn" id="up">↑</button>
                    </div>
                    <div class="finder-path">/</div>
                    <div class="finder-actions">
                        <button class="action-btn" id="new-folder">New Folder</button>
                    </div>
                </div>
                <div class="finder-sidebar">
                    <div class="sidebar-section">
                        <h3>Favorites</h3>
                        <ul class="sidebar-list">
                            <li data-path="/">Home</li>
                            <li data-path="/Desktop">Desktop</li>
                            <li data-path="/Documents">Documents</li>
                        </ul>
                    </div>
                </div>
                <div class="finder-content">
                    <div class="finder-grid" id="files"></div>
                </div>
            </div>
        `);

        // Add styles
        window.addStyles(`
            .finder {
                display: grid;
                grid-template-rows: auto 1fr;
                grid-template-columns: 200px 1fr;
                height: 100%;
                background: var(--window-bg);
                color: var(--text-color);
            }

            .finder-toolbar {
                grid-column: 1 / -1;
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 16px;
                background: var(--toolbar-bg);
                border-bottom: 1px solid var(--border-color);
            }

            .finder-nav {
                display: flex;
                gap: 4px;
            }

            .nav-btn, .action-btn {
                padding: 4px 8px;
                border: none;
                border-radius: 4px;
                background: var(--button-bg);
                color: var(--text-color);
                cursor: pointer;
            }

            .nav-btn:hover, .action-btn:hover {
                background: var(--button-hover-bg);
            }

            .finder-path {
                flex: 1;
                padding: 4px 8px;
                background: var(--input-bg);
                border-radius: 4px;
                font-family: monospace;
            }

            .finder-sidebar {
                padding: 16px;
                background: var(--sidebar-bg);
                border-right: 1px solid var(--border-color);
            }

            .sidebar-section h3 {
                margin: 0 0 8px 0;
                font-size: 12px;
                text-transform: uppercase;
                color: var(--text-secondary);
            }

            .sidebar-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .sidebar-list li {
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
            }

            .sidebar-list li:hover {
                background: var(--hover-bg);
            }

            .finder-content {
                padding: 16px;
                overflow: auto;
            }

            .finder-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 16px;
                padding: 16px;
            }

            .file-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
            }

            .file-item:hover {
                background: var(--hover-bg);
            }

            .file-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 8px;
            }

            .file-name {
                font-size: 12px;
                word-break: break-word;
            }
        `);

        // Initialize event listeners with window reference
        this.initializeEventListeners(window);

        // Load initial directory
        await this.loadDirectory(window, '/');
    }

    getWindowState(window) {
        return this.windowStates.get(window.id);
    }

    async initializeEventListeners(window) {
        const state = this.getWindowState(window);
        const backBtn = window.querySelector('#back');
        const forwardBtn = window.querySelector('#forward');
        const upBtn = window.querySelector('#up');
        const newFolderBtn = window.querySelector('#new-folder');
        const sidebarList = window.querySelector('.sidebar-list');
        const filesGrid = window.querySelector('#files');

        backBtn.addEventListener('click', async () => {
            if (state.historyIndex > 0) {
                state.historyIndex--;
                await this.loadDirectory(window, state.history[state.historyIndex], false);
            }
        });

        forwardBtn.addEventListener('click', async () => {
            if (state.historyIndex < state.history.length - 1) {
                state.historyIndex++;
                await this.loadDirectory(window, state.history[state.historyIndex], false);
            }
        });

        upBtn.addEventListener('click', async () => {
            const parentPath = this.getParentPath(state.currentPath);
            if (parentPath !== state.currentPath) {
                await this.loadDirectory(window, parentPath);
            }
        });

        newFolderBtn.addEventListener('click', async () => {
            const name = await window.showPrompt('New Folder', 'Enter folder name:');
            if (name) {
                await this.createFolder(window, name);
            }
        });

        sidebarList.addEventListener('click', async (e) => {
            const item = e.target.closest('[data-path]');
            if (item) {
                const path = item.dataset.path;
                await this.loadDirectory(window, path);
            }
        });

        filesGrid.addEventListener('click', async (e) => {
            const item = e.target.closest('.file-item');
            if (item) {
                const type = item.dataset.type;
                const name = item.dataset.name;
                if (type === 'directory') {
                    await this.loadDirectory(window, this.joinPaths(state.currentPath, name));
                } else {
                    // TODO: Open file
                    console.log('Opening file:', name);
                }
            }
        });
    }

    async loadDirectory(window, path, addToHistory = true) {
        const state = this.getWindowState(window);
        try {
            const filesystem = await this.requestFileSystem();
            const entries = await filesystem.readDirectory(path);
            
            if (addToHistory) {
                // Add to history
                state.history = state.history.slice(0, state.historyIndex + 1);
                state.history.push(path);
                state.historyIndex = state.history.length - 1;
            }
            
            state.currentPath = path;
            const filesGrid = window.querySelector('#files');
            const pathDisplay = window.querySelector('.finder-path');
            
            // Update path display and window title
            pathDisplay.textContent = path;
            const dirName = path === '/' ? 'Home' : path.split('/').filter(Boolean).pop();
            window.setTitle(`${dirName} - Finder`);
            
            filesGrid.innerHTML = '';

            for (const entry of entries) {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.dataset.type = entry.type;
                item.dataset.name = entry.name;
                
                item.innerHTML = `
                    <img class="file-icon" src="assets/icons/${entry.type === 'directory' ? 'directory' : 'file'}.svg" alt="${entry.type}">
                    <div class="file-name">${entry.name}</div>
                `;
                
                filesGrid.appendChild(item);
            }
        } catch (error) {
            console.error('Failed to load directory:', error);
            window.showError('Error', `Failed to load directory: ${error.message}`);
        }
    }

    getParentPath(path) {
        if (path === '/') return '/';
        const parts = path.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/');
    }

    joinPaths(base, name) {
        if (base === '/') return '/' + name;
        return base + '/' + name;
    }

    async createFolder(window, name) {
        const state = this.getWindowState(window);
        try {
            const filesystem = await this.requestFileSystem();
            await filesystem.createDirectory(this.joinPaths(state.currentPath, name));
            await this.loadDirectory(window, state.currentPath); // Refresh current directory
        } catch (error) {
            console.error('Failed to create folder:', error);
            window.showError('Error', `Failed to create folder: ${error.message}`);
        }
    }

    async onCleanup() {
        // Clean up window states
        this.windowStates.clear();
    }
}

window.FinderApp = FinderApp; 