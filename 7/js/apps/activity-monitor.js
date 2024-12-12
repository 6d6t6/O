class ActivityMonitorApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.updateInterval = null;
        this.windows = new Set();
    }

    getMenus() {
        return {
            file: {
                title: 'File',
                items: [
                    { label: 'Close Window', shortcut: '⌘+W', action: () => this.handleMenuAction('close') }
                ]
            },
            edit: {
                title: 'Edit',
                items: [
                    { label: 'Cut', shortcut: '⌘+X', action: () => this.handleMenuAction('cut') },
                    { label: 'Copy', shortcut: '⌘+C', action: () => this.handleMenuAction('copy') },
                    { label: 'Paste', shortcut: '⌘+V', action: () => this.handleMenuAction('paste') },
                    { type: 'separator' },
                    { label: 'Select All', shortcut: '⌘+A', action: () => this.handleMenuAction('selectAll') }
                ]
            },
            view: {
                title: 'View',
                items: [
                    { label: 'Refresh', shortcut: '⌘+R', action: () => this.updateProcessList() }
                ]
            },
            window: {
                title: 'Window',
                items: [
                    { label: 'Minimize', shortcut: '⌘+M', action: () => this.handleMenuAction('minimize') },
                    { label: 'Zoom', action: () => this.handleMenuAction('zoom') }
                ]
            },
            help: {
                title: 'Help',
                items: [
                    { label: `${this.name} Help`, action: () => this.handleMenuAction('help') }
                ]
            }
        };
    }

    async handleMenuAction(action) {
        switch (action) {
            case 'close':
                if (this.window) {
                    await this.system.windowManager.closeWindow(this.window.id);
                }
                break;
            case 'quit':
                // Terminate the entire app process
                await this.system.processManager.terminateProcess(this.pid);
                break;
            case 'minimize':
                if (this.window) {
                    this.system.windowManager.minimizeWindow(this.window.id);
                }
                break;
            case 'zoom':
                if (this.window) {
                    this.system.windowManager.toggleMaximizeWindow(this.window.id);
                }
                break;
            // ... handle other actions ...
        }
    }

    async onInitialize(window) {
        await super.onInitialize(window);
        this.window = window;
        this.windows.add(window);
        
        // Set up the UI
        this.setupUI(window);
        
        // Start updating process list
        this.startUpdating();
    }

    async onCleanup() {
        // Stop updating when app is closed
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Close all windows
        for (const window of this.windows) {
            await this.system.windowManager.closeWindow(window.id);
        }
        this.windows.clear();

        await super.onCleanup();
    }

    setupUI(window) {
        const styles = `
            .activity-monitor {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--window-bg);
                color: var(--text-color);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .toolbar {
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid var(--border-color);
                gap: 10px;
            }

            .search-box {
                flex: 1;
                max-width: 200px;
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid var(--border-color);
                background: var(--input-bg);
                color: var(--text-color);
            }

            .process-list {
                flex: 1;
                overflow: auto;
                padding: 10px;
            }

            .process-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }

            .process-table th,
            .process-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid var(--border-color);
            }

            .process-table th {
                background: var(--header-bg);
                font-weight: 500;
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .process-table tr:hover {
                background: var(--hover-bg);
            }

            .process-icon {
                width: 16px;
                height: 16px;
                vertical-align: middle;
                margin-right: 8px;
            }

            .status-running { color: #00FF66; }
            .status-terminating { color: #FFB340; }
            .status-terminated { color: #FF4040; }

            .force-quit {
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid var(--border-color);
                background: var(--button-bg);
                color: var(--text-color);
                cursor: pointer;
                font-size: 12px;
            }

            .force-quit:hover:not(:disabled) {
                background: var(--button-hover-bg);
            }

            .force-quit:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .refresh-btn {
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid var(--border-color);
                background: var(--button-bg);
                color: var(--text-color);
                cursor: pointer;
            }

            .refresh-btn:hover {
                background: var(--button-hover-bg);
            }
        `;

        const content = `
            <div class="activity-monitor">
                <div class="toolbar">
                    <input type="text" class="search-box" placeholder="Search processes...">
                    <button class="refresh-btn">Refresh</button>
                </div>
                <div class="process-list">
                    <table class="process-table">
                        <thead>
                            <tr>
                                <th>Process Name</th>
                                <th>PID</th>
                                <th>Status</th>
                                <th>Windows</th>
                                <th>Running Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Process rows will be added here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        window.addStyles(styles);
        window.setContent(content);

        // Add event listeners
        const searchBox = window.querySelector('.search-box');
        searchBox.addEventListener('input', () => this.updateProcessList());

        const refreshBtn = window.querySelector('.refresh-btn');
        refreshBtn.addEventListener('click', () => {
            this.updateProcessList();
            // Visual feedback
            refreshBtn.style.opacity = '0.5';
            setTimeout(() => refreshBtn.style.opacity = '1', 200);
        });
    }

    startUpdating() {
        // Update immediately
        this.updateProcessList();
        
        // Then update every second
        this.updateInterval = setInterval(() => this.updateProcessList(), 1000);
    }

    updateProcessList() {
        if (!this.window) return;

        const processes = this.system.processManager.getAllProcesses();
        const searchTerm = this.window.querySelector('.search-box').value.toLowerCase();
        const tbody = this.window.querySelector('.process-table tbody');
        
        // Filter processes based on search term
        const filteredProcesses = processes.filter(process => 
            process.name.toLowerCase().includes(searchTerm) ||
            process.pid.toString().includes(searchTerm)
        );

        // Sort processes: Finder first, then by PID
        filteredProcesses.sort((a, b) => {
            if (a.app.id === 'finder') return -1;
            if (b.app.id === 'finder') return 1;
            return a.pid - b.pid;
        });

        // Clear existing rows
        tbody.innerHTML = '';

        // Add process rows
        filteredProcesses.forEach(process => {
            const runningTime = this.formatRunningTime(Date.now() - process.startTime);
            const row = document.createElement('tr');
            
            // Get window count
            const windowCount = process.windows.size;
            
            // Determine status color
            const statusClass = {
                'running': 'status-running',
                'terminating': 'status-terminating',
                'terminated': 'status-terminated'
            }[process.status.toLowerCase()] || '';

            row.innerHTML = `
                <td>
                    <img src="${process.app.icon}" class="process-icon" alt="${process.name}">
                    ${process.name}
                </td>
                <td>${process.pid}</td>
                <td class="${statusClass}">${process.status}</td>
                <td>${windowCount} ${windowCount === 1 ? 'window' : 'windows'}</td>
                <td>${runningTime}</td>
                <td>
                    <button class="force-quit" data-pid="${process.pid}"
                            ${this.system.processManager.systemProcesses.has(process.pid) ? 'disabled' : ''}>
                        Force Quit
                    </button>
                </td>
            `;

            // Add force quit handler
            const forceQuitBtn = row.querySelector('.force-quit');
            if (!forceQuitBtn.disabled) {
                forceQuitBtn.addEventListener('click', async () => {
                    try {
                        await this.forceQuitProcess(process.pid);
                        this.updateProcessList(); // Update immediately after force quit
                    } catch (error) {
                        this.window.showError('Force Quit Failed', error.message);
                    }
                });
            }

            tbody.appendChild(row);
        });

        // If no processes found, show a message
        if (filteredProcesses.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 20px;">
                    ${searchTerm ? 'No matching processes found' : 'No processes running'}
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    formatRunningTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    async forceQuitProcess(pid) {
        try {
            await this.system.processManager.terminateProcess(pid);
            this.updateProcessList();
        } catch (error) {
            this.window.showError('Force Quit Failed', `Failed to terminate process ${pid}: ${error.message}`);
        }
    }
}

window.ActivityMonitorApp = ActivityMonitorApp; 