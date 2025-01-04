class TerminalApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        // All state is now initialized in onInitialize per window
        const currentUser = system.auth?.getCurrentUser();
        this.username = currentUser?.username || system.username || 'user';
        this.HOME = '/';
        this.shell = 'xosh'; // Our shell name (Omega OS shell)
    }

    createNewWindow() {
        const window = this.system.windowManager.createWindow(this);
        this.onInitialize(window);
        return window;
    }

    getMenus() {
        const defaultMenus = super.getMenus();
        
        // Add Shell menu
        defaultMenus.shell = {
            title: 'Shell',
            items: [
                { label: 'New Window', shortcut: '⌘+N', action: () => this.createNewWindow() },
                { type: 'separator' },
                { label: 'Clear Screen', shortcut: '⌘+K', action: () => this.clear(this.system.windowManager.activeWindow) }
            ]
        };

        // Override the edit menu to implement our own actions
        defaultMenus.edit = {
            title: 'Edit',
            items: [
                { label: 'Cut', shortcut: '⌘+X', action: () => this.handleMenuAction('cut') },
                { label: 'Copy', shortcut: '⌘+C', action: () => this.handleMenuAction('copy') },
                { label: 'Paste', shortcut: '⌘+V', action: () => this.handleMenuAction('paste') },
                { type: 'separator' },
                { label: 'Select All', shortcut: '⌘+A', action: () => this.handleMenuAction('selectAll') }
            ]
        };

        // Reorder menus to match macOS Terminal layout
        const orderedMenus = {};
        const order = ['app', 'shell', 'edit', 'view', 'window', 'help'];
        
        order.forEach(key => {
            if (defaultMenus[key]) {
                orderedMenus[key] = defaultMenus[key];
            }
        });

        return orderedMenus;
    }

    handleMenuAction(action) {
        const activeWindow = this.system.windowManager.activeWindow;
        if (!activeWindow || activeWindow.app !== this) {
            return super.handleMenuAction(action);
        }

        const input = this.getTerminalInput(activeWindow);
        if (!input) {
            return super.handleMenuAction(action);
        }

        const selection = window.getSelection();
        
        switch (action) {
            case 'copy':
                if (selection.toString()) {
                    navigator.clipboard.writeText(selection.toString());
                }
                break;
            case 'cut':
                if (selection.toString()) {
                    navigator.clipboard.writeText(selection.toString());
                    // Only delete if selection is within the input
                    if (input.contains(selection.anchorNode) && input.contains(selection.focusNode)) {
                        document.execCommand('delete');
                    }
                }
                break;
            case 'paste':
                navigator.clipboard.readText().then(text => {
                    // Remove any formatting and normalize line endings
                    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    // Insert at cursor position or replace selection
                    document.execCommand('insertText', false, text);
                });
                break;
            case 'selectAll':
                const range = document.createRange();
                range.selectNodeContents(input);
                selection.removeAllRanges();
                selection.addRange(range);
                break;
            default:
                super.handleMenuAction(action);
        }
    }

    async onInitialize(window) {
        // Each window gets its own isolated state
        this.initializeWindowState(window);

        // Enable grid-based resizing for terminal windows
        window.useGridResize = true;
        window.gridWidth = 8;  // Width of monospace character
        window.gridHeight = 16; // Height of monospace character
        window.element.setAttribute('data-grid-resize', 'true');

        // Set initial window dimensions to 80x24 characters
        const cols = 80;
        const rows = 24;
        const EDGE_PADDING = 10; // 8px left edge + 2px right edge
        const HEADER_HEIGHT = 32; // Height of window header
        const CONTENT_PADDING = 0;
        const SCROLLBAR_WIDTH = 4; // Width of the scrollbar
        const BORDER_WIDTH = 2; // Account for window border (1px on each side)
        
        // Calculate width to ensure exactly 80 characters fit between edges
        const characterSpace = cols * window.gridWidth;  // Space needed for characters
        const contentWidth = characterSpace + EDGE_PADDING + SCROLLBAR_WIDTH + BORDER_WIDTH;
        const contentHeight = (rows * window.gridHeight) + HEADER_HEIGHT + (CONTENT_PADDING * 2);
         
        // Set window size using style properties
        window.element.style.width = `${contentWidth}px`;
        window.element.style.height = `${contentHeight}px`;
         
        // Update window title and dispatch initial resize event
        this.updateWindowTitle(window, cols, rows);
        window.element.dispatchEvent(new CustomEvent('terminalResize', {
            detail: { 
                cols, 
                rows, 
                width: characterSpace, 
                height: contentHeight - HEADER_HEIGHT - (CONTENT_PADDING * 2)
            }
        }));

        // Listen for terminal resize events
        window.element.addEventListener('terminalResize', (e) => {
            const { cols, rows } = e.detail;
            this.updateWindowTitle(window, cols, rows);
        });

        window.setContent(`
            <div class="terminal">
                <div class="terminal-content-wrapper">
                    <div class="terminal-edge left-edge"></div>
                    <div class="terminal-output" style="font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 12px; word-break: break-all; letter-spacing: 0.8px; line-height: 16px;"></div>
                    <div class="terminal-edge right-edge"></div>
                </div>
            </div>
        `);

        window.addStyles(`
            /* width */
            ::-webkit-scrollbar {
                width: 4px;
                height: 4px;
            }

            /* Track */
            ::-webkit-scrollbar-track {
                background: transparent;
                margin: 0 4px 14px 0;
            }

            /* Handle */
            ::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 8px;
            }

            /* Handle on hover */
            ::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
            .terminal {
                height: 100%;
                background: var(--terminal-bg, #1a1a1a);
                color: var(--terminal-text, #f0f0f0);
                font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
                display: flex;
                flex-direction: row;
                overflow: hidden;
            }

            .terminal.maximized {
                justify-content: center;
            }

            .terminal-edge {
                width: 8px;
                height: 100%;
                flex-shrink: 0;
            }

            .terminal-edge.right-edge {
                width: 2px;
            }

            .terminal-content-wrapper {
                display: flex;
                flex-direction: row;
                width: 100%;
                height: 100%;
            }

            .terminal-output {
                flex: 1;
                overflow-y: scroll;
                white-space: pre-wrap;
                padding: 0;
                position: relative;
            }

            .terminal-output>span {
                font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
                min-height: 16px;
                line-height: 16px;
                line-break: anywhere;
            }

            .terminal-input-line {
                display: block;
                position: relative;
                margin: 0;
                width: 100%;
                overflow: hidden;
                min-height: 16px;
                line-height: 16px;
            }

            .prompt {
                color: var(--terminal-prompt, #4CAF50);
                font-weight: bold;
                font-size: 12px;
                letter-spacing: 0.8px;
                line-height: 16px;
                white-space: nowrap;
                display: inline-block;
                padding-right: 8px;
            }

            .terminal-input {
                background: transparent;
                border: none;
                color: inherit;
                font-family: inherit;
                font-size: inherit;
                padding: 0;
                margin: 0;
                outline: none;
                z-index: +1;
                letter-spacing: 0.8px;
                line-height: 16px;
                min-height: 16px;
                white-space: pre-wrap;
                word-break: break-all;
                display: inline;
                position: relative;
                caret-color: #808080;
            }

            .terminal-input-wrapper {
                display: inline;
                position: relative;
                overflow: visible;
            }

            .error-text {
                color: var(--terminal-error, #ff5555);
            }
        `);

        this.initializeEventListeners(window);
        
        // Show last login info
        const now = new Date();
        const systemSettings = this.system.settingsManager.getSettings().system;
        const dateOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            year: 'numeric',
            hour12: false,
            timeZone: systemSettings.timezone
        };
        const formattedDate = now.toLocaleString(systemSettings.language, dateOptions);
        
        this.print(window, `Last login: ${formattedDate} on ttys000\n\n`);
        
        // Delay creating the input line and focusing to avoid the initial keypress
        setTimeout(() => {
            this.createNewInputLine(window);
            const input = this.getTerminalInput(window);
            if (input) input.focus();
        }, 100);
    }

    initializeWindowState(window) {
        // Store all window-specific state in the window object
        window.terminalState = {
            history: [],
            historyIndex: -1,
            currentDirectory: '/',
            previousDirectory: null,
            isUsingScrollbar: false
        };
    }

    // Helper methods to access window-specific state
    getHistory(window) {
        return window.terminalState.history;
    }

    getHistoryIndex(window) {
        return window.terminalState.historyIndex;
    }

    setHistoryIndex(window, index) {
        window.terminalState.historyIndex = index;
    }

    getCurrentDirectory(window) {
        return window.terminalState.currentDirectory;
    }

    getPreviousDirectory(window) {
        return window.terminalState.previousDirectory;
    }

    setPreviousDirectory(window, dir) {
        window.terminalState.previousDirectory = dir;
    }

    setCurrentDirectory(window, dir) {
        window.terminalState.currentDirectory = dir;
    }

    // DOM element getters that are window-specific
    getTerminalElement(window) {
        return window.element.querySelector('.terminal');
    }

    getOutputElement(window) {
        return window.element.querySelector('.terminal-output');
    }

    getTerminalInput(window) {
        return window.element.querySelector('.terminal-input');
    }

    updateWindowTitle(window, cols, rows) {
        const formatDimension = (value) => {
            return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        };
        
        const currentDir = this.getCurrentDirectory(window);
        let displayName;
        
        if (currentDir === this.HOME) {
            displayName = this.username;
        } else {
            displayName = currentDir === '/' ? '/' : currentDir.split('/').filter(Boolean).pop();
        }
        
        const title = `${displayName} – -${this.shell} – ${formatDimension(cols)}×${formatDimension(rows)}`;
        window.setTitle(title);
    }

    createNewInputLine(window) {
        const output = this.getOutputElement(window);
        const inputLine = document.createElement('div');
        inputLine.className = 'terminal-input-line';
        const promptText = `${this.username}@omega ${this.getDisplayPath(window, this.getCurrentDirectory(window))} % `;
        
        const promptSpan = document.createElement('span');
        promptSpan.className = 'prompt';
        promptSpan.style.fontFamily = "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace";
        promptSpan.style.fontSize = '12px';
        promptSpan.textContent = promptText;

        const inputWrapper = document.createElement('span');
        inputWrapper.className = 'terminal-input-wrapper';

        const input = document.createElement('span');
        input.className = 'terminal-input';
        input.contentEditable = true;
        input.spellcheck = false;
        input.style.fontFamily = "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace";
        input.style.fontSize = '12px';

        inputWrapper.appendChild(input);
        inputLine.appendChild(promptSpan);
        inputLine.appendChild(inputWrapper);
        
        output.appendChild(inputLine);
        
        input.focus();
        this.initializeInputListeners(window, input);
    }

    initializeEventListeners(window) {
        const terminal = this.getTerminalElement(window);
        const output = this.getOutputElement(window);

        // Focus input when clicking anywhere in the terminal
        terminal.addEventListener('click', (e) => {
            const terminalRect = window.element.getBoundingClientRect();
            if (e.clientX >= terminalRect.left && 
                e.clientX <= terminalRect.right && 
                e.clientY >= terminalRect.top && 
                e.clientY <= terminalRect.bottom) {
                const input = this.getTerminalInput(window);
                if (input) input.focus();
            }
        });

        // Scroll snapping behavior
        output.addEventListener('mousedown', (e) => {
            const isClickNearScrollbar = (output.offsetWidth - e.offsetX) < 20;
            if (isClickNearScrollbar) {
                window.terminalState.isUsingScrollbar = true;
            }
        });
        
        // Use document instead of window for global events
        document.addEventListener('mouseup', () => {
            window.terminalState.isUsingScrollbar = false;
        });
        
        output.addEventListener('scroll', () => {
            if (window.terminalState.isUsingScrollbar) {
                const snapSize = 16;
                output.style.scrollBehavior = 'auto';
                output.scrollTop = Math.round(output.scrollTop / snapSize) * snapSize;
            }
        });
        
        let wheelTimeout;
        output.addEventListener('wheel', () => {
            output.style.scrollBehavior = 'smooth';
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                const snapSize = 16;
                output.scrollTop = Math.round(output.scrollTop / snapSize) * snapSize;
            }, 100);
        });
    }

    initializeInputListeners(window, input) {
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = input.textContent.trim();
                if (command) {
                    const history = this.getHistory(window);
                    history.push(command);
                    this.setHistoryIndex(window, history.length);
                    
                    const promptText = `${this.username}@omega ${this.getDisplayPath(window, this.getCurrentDirectory(window))} %`;
                    this.print(window, `${promptText} ${command}\n`);
                    
                    await this.executeCommand(window, command);
                    
                    input.parentElement.parentElement.remove();
                    this.createNewInputLine(window);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const history = this.getHistory(window);
                const historyIndex = this.getHistoryIndex(window);
                if (historyIndex > 0) {
                    this.setHistoryIndex(window, historyIndex - 1);
                    input.textContent = history[historyIndex - 1];
                    const range = document.createRange();
                    range.selectNodeContents(input);
                    range.collapse(false);
                    const selection = globalThis.window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const history = this.getHistory(window);
                const historyIndex = this.getHistoryIndex(window);
                if (historyIndex < history.length - 1) {
                    this.setHistoryIndex(window, historyIndex + 1);
                    input.textContent = history[historyIndex + 1];
                } else {
                    this.setHistoryIndex(window, history.length);
                    input.textContent = '';
                }
                const range = document.createRange();
                range.selectNodeContents(input);
                range.collapse(false);
                const selection = globalThis.window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }

    print(window, text, className = '', preserveIndentation = false) {
        const output = this.getOutputElement(window);
        const span = document.createElement('span');
        
        if (preserveIndentation) {
            span.textContent = text.replace(/^\n/, '');
        } else {
            span.textContent = text.replace(/^\s+/gm, '');
        }
        
        if (className) span.className = className;
        output.appendChild(span);
        output.scrollTop = output.scrollHeight;
    }

    clear(window) {
        const output = this.getOutputElement(window);
        output.innerHTML = '';
    }

    async executeCommand(window, command) {
        const [cmd, ...args] = command.split(' ');
        
        try {
            switch (cmd.toLowerCase()) {
                case 'clear':
                    this.clear(window);
                    break;
                case 'pwd':
                    this.print(window, this.getCurrentDirectory(window) + '\n');
                    break;
                case 'ls':
                    await this.listDirectory(window, this.resolvePath(window, args[0] || this.getCurrentDirectory(window)));
                    break;
                case 'cd':
                    await this.changeDirectory(window, this.resolvePath(window, args[0] || this.HOME));
                    break;
                case 'mkdir':
                    if (!args[0]) {
                        throw new Error('mkdir: missing operand');
                    }
                    await this.createDirectory(window, args[0]);
                    break;
                case 'touch':
                    if (!args[0]) {
                        throw new Error('touch: missing operand');
                    }
                    await this.createFile(window, args[0]);
                    break;
                case 'rm':
                    if (!args[0]) {
                        throw new Error('rm: missing operand');
                    }
                    await this.removeEntry(window, args[0]);
                    break;
                case 'cat':
                    if (!args[0]) {
                        throw new Error('cat: missing operand');
                    }
                    await this.catFile(window, args[0]);
                    break;
                case 'echo':
                    this.print(window, args.join(' ') + '\n');
                    break;
                case 'help':
                    this.showHelp(window);
                    break;
                case 'date':
                    const systemSettings = this.system.settingsManager.getSettings().system;
                    const dateOptions = {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                        timeZone: systemSettings.timezone
                    };
                    const now = new Date();
                    this.print(window, now.toLocaleString(systemSettings.language, dateOptions) + '\n');
                    break;
                case 'whoami':
                    this.print(window, this.username + '\n');
                    break;
                case 'hostname':
                    this.print(window, 'omega\n');
                    break;
                case 'uname':
                    if (args[0] === '-a') {
                        this.print(window, 'OmegaOS 1.0 omega browser js\n');
                    } else {
                        this.print(window, 'OmegaOS\n');
                    }
                    break;
                case 'ps':
                    this.print(window, '  PID TTY          TIME CMD\n  1 tty1     00:00:00 omega-shell\n');
                    break;
                default:
                    throw new Error(`Command not found: ${cmd}`);
            }
        } catch (error) {
            this.print(window, `${error.message}\n`, 'error-text');
        }
    }

    getDisplayPath(window, path) {
        const dirName = path === '/' ? '/' : path.split('/').filter(Boolean).pop();
        
        if (path === this.HOME) {
            return '~';
        }
        
        if (path.startsWith(this.HOME + '/')) {
            return dirName;
        }
        
        return dirName;
    }

    resolvePath(window, path) {
        if (!path) return this.getCurrentDirectory(window);
        if (path === '~') return this.HOME;
        if (path === '-') return this.getPreviousDirectory(window) || this.getCurrentDirectory(window);
        if (path.startsWith('~/')) return path.replace('~', this.HOME);
        
        if (path.startsWith('/')) return this.normalizePath(path);
        
        return this.normalizePath(this.joinPaths(this.getCurrentDirectory(window), path));
    }

    normalizePath(path) {
        const segments = path.split('/').filter(Boolean);
        const resultSegments = [];
        
        for (const segment of segments) {
            if (segment === '.') {
                continue;
            } else if (segment === '..') {
                if (resultSegments.length > 0) {
                    resultSegments.pop();
                }
            } else {
                resultSegments.push(segment);
            }
        }
        
        return '/' + resultSegments.join('/');
    }

    async listDirectory(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            const entries = await filesystem.readDirectory(resolvedPath);
            
            for (const entry of entries) {
                const prefix = entry.type === 'directory' ? 'd ' : '- ';
                this.print(window, prefix + entry.name + '\n');
            }
        } catch (error) {
            throw new Error(`Failed to list directory: ${error.message}`);
        }
    }

    async changeDirectory(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            
            if (path === '-' && !this.getPreviousDirectory(window)) {
                throw new Error('No previous directory');
            }
            
            await filesystem.readDirectory(resolvedPath);
            this.setPreviousDirectory(window, this.getCurrentDirectory(window));
            this.setCurrentDirectory(window, resolvedPath);
            
            if (path === '-') {
                this.print(window, this.getCurrentDirectory(window) + '\n');
            }

            // Update window title with new directory
            const rect = window.element.getBoundingClientRect();
            const cols = Math.floor((rect.width - 10) / window.gridWidth);
            const rows = Math.floor((rect.height - 32) / window.gridHeight);
            this.updateWindowTitle(window, cols, rows);
        } catch (error) {
            throw new Error(`Failed to change directory: ${error.message}`);
        }
    }

    async createDirectory(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            await filesystem.createDirectory(resolvedPath);
            this.print(window, `Created directory: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
    }

    async createFile(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            await filesystem.writeFile(resolvedPath, '');
            this.print(window, `Created file: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }

    async removeEntry(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            await filesystem.deleteEntry(resolvedPath);
            this.print(window, `Removed: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to remove entry: ${error.message}`);
        }
    }

    async catFile(window, path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(window, path);
            const content = await filesystem.readFile(resolvedPath);
            this.print(window, content + '\n');
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    showHelp(window) {
        const help = `Available commands:
    clear     Clear the terminal screen
    pwd       Print working directory
    ls        List directory contents
    cd        Change directory
    mkdir     Create a directory
    touch     Create a file
    rm        Remove a file or directory
    cat       Display file contents
    echo      Display a line of text
    help      Show this help message
    date      Show current date and time
    whoami    Print current user
    hostname  Show system hostname
    uname     Print system information
    ps        Report process status\n`;
        this.print(window, help, '', true);
    }

    joinPaths(...parts) {
        return '/' + parts.map(part => part.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
    }

    getTextWidth(text, element) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(element);
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0.8;
        const textWidth = context.measureText(text).width;
        return textWidth + (Math.max(0, text.length - 1) * letterSpacing);
    }
}

window.TerminalApp = TerminalApp; 