class ProcessManager {
    constructor(system) {
        this.system = system;
        this.processes = new Map(); // pid -> process info
        this.nextPid = 1000; // Start PIDs from 1000
        this.systemProcesses = new Set(); // PIDs of system processes that can't be terminated
    }

    initialize() {
        // We'll initialize system processes later when apps are ready
    }

    initializeSystemProcesses() {
        // Initialize system processes (like Finder) after apps are ready
        const finder = this.system.appSystem?.getRunningApp('finder');
        if (finder && finder.pid === undefined) {
            finder.pid = this.nextPid++;
            this.processes.set(finder.pid, {
                pid: finder.pid,
                app: finder,
                name: finder.name,
                status: finder.status || 'running',
                windows: new Set(),
                startTime: Date.now()
            });
            this.systemProcesses.add(finder.pid);
        }
    }

    createProcess(app) {
        const pid = this.nextPid++;
        app.pid = pid;

        const processInfo = {
            pid,
            app,
            name: app.name,
            status: app.status,
            windows: new Set(),
            startTime: Date.now()
        };

        this.processes.set(pid, processInfo);
        return processInfo;
    }

    registerWindow(window) {
        const process = this.processes.get(window.app.pid);
        if (process) {
            process.windows.add(window.id);
        }
    }

    unregisterWindow(window) {
        const process = this.processes.get(window.app.pid);
        if (process) {
            process.windows.delete(window.id);
        }
    }

    async terminateProcess(pid) {
        const process = this.processes.get(pid);
        if (!process || this.systemProcesses.has(pid)) {
            return;
        }

        try {
            // Set status to terminating
            process.status = 'terminating';
            process.app.status = 'terminating';

            // Get all windows for this process
            const windowsToClose = [...process.windows];

            // Close all windows
            for (const windowId of windowsToClose) {
                await this.system.windowManager.closeWindow(windowId);
                process.windows.delete(windowId);
            }

            // Clean up the app
            await process.app.onCleanup();

            // Update status and remove from running apps
            process.status = 'terminated';
            process.app.status = 'terminated';
            this.system.appSystem.runningApps.delete(process.app.id);

            // Update dock indicator
            if (this.system.dock) {
                this.system.dock.setRunningIndicator(process.app.id, false);
            }

            // Remove the process
            this.processes.delete(pid);

            // Switch back to Finder in menu bar if needed
            const finder = this.system.appSystem.getRunningApp('finder');
            if (finder) {
                this.system.menuBar.setActiveApp(finder);
            }
        } catch (error) {
            console.error(`Failed to terminate process ${pid}:`, error);
            throw error;
        }
    }

    getProcessInfo(pid) {
        return this.processes.get(pid);
    }

    getAllProcesses() {
        return Array.from(this.processes.values());
    }

    getProcessesByApp(appId) {
        return Array.from(this.processes.values())
            .filter(process => process.app.id === appId);
    }
}

window.ProcessManager = ProcessManager; 