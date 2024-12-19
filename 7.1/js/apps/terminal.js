class TerminalApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.history = [];
        this.historyIndex = -1;
        this.currentDirectory = '/';
        this.previousDirectory = null;
        const currentUser = system.auth?.getCurrentUser();
        this.username = currentUser?.username || system.username || 'user';
        this.HOME = '/';
        this.shell = 'xosh'; // Our shell name (Omega OS shell)
    }

    async onInitialize(window) {
        // Enable grid-based resizing for terminal windows
        window.useGridResize = true;
        window.gridWidth = 8;  // Width of monospace character
        window.gridHeight = 16; // Height of monospace character
        window.element.setAttribute('data-grid-resize', 'true');

        this.window = window;

         // Set initial window dimensions to 80x24 characters
         const cols = 80;
         const rows = 24;
         const contentWidth = cols * window.gridWidth;
         const contentHeight = rows * window.gridHeight;
         
         // Set window size using style properties
         window.element.style.width = `${contentWidth}px`;
         window.element.style.height = `${contentHeight}px`;
         
         // Set initial window title
        this.updateWindowTitle(cols, rows);

        // Listen for terminal resize events
        window.element.addEventListener('terminalResize', (e) => {
            const { cols, rows } = e.detail;
            this.updateWindowTitle(cols, rows);
        });

        window.setContent(`
            <div class="terminal">
                <div class="terminal-content-wrapper">
                    <div class="terminal-edge left-edge"></div>
                    <div id="output" class="terminal-output" style="font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 12px; word-break: break-all; letter-spacing: 0.8px; line-height: 16px;"></div>
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
                padding: 0 2px 0 0;
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

        this.initializeEventListeners();
        
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
        
        this.print(`Last login: ${formattedDate} on ttys000\n\n`);
        
        // Delay creating the input line and focusing to avoid the initial keypress
        setTimeout(() => {
            this.createNewInputLine();
            const input = this.window.querySelector('#input');
            if (input) input.focus();
        }, 100);
    }

    updateWindowTitle(cols, rows) {
        // Format dimensions based on whether they are integers or decimals
        const formatDimension = (value) => {
            return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        };
        const title = `${this.username} – -${this.shell} – ${formatDimension(cols)}×${formatDimension(rows)}`;
        this.window.setTitle(title);
    }

    createNewInputLine() {
        const output = this.window.querySelector('#output');
        const inputLine = document.createElement('div');
        inputLine.className = 'terminal-input-line';
        const promptText = `${this.username}@omega ${this.getDisplayPath(this.currentDirectory)} % `;
        
        // Create elements separately to ensure proper layout
        const promptSpan = document.createElement('span');
        promptSpan.className = 'prompt';
        promptSpan.style.fontFamily = "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace";
        promptSpan.style.fontSize = '12px';
        promptSpan.textContent = promptText;

        const inputWrapper = document.createElement('span');
        inputWrapper.className = 'terminal-input-wrapper';

        const input = document.createElement('span');
        input.id = 'input';
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
        this.initializeInputListeners(input);
    }

    initializeEventListeners() {
        // Focus input when clicking anywhere in the terminal, but only if the click is within bounds
        this.window.querySelector('.terminal').addEventListener('click', (e) => {
            // Check if the click is within the terminal window bounds
            const terminalRect = this.window.element.getBoundingClientRect();
            if (e.clientX >= terminalRect.left && 
                e.clientX <= terminalRect.right && 
                e.clientY >= terminalRect.top && 
                e.clientY <= terminalRect.bottom) {
                const input = this.window.querySelector('#input');
                if (input) input.focus();
            }
        });

        // Add scroll snapping behavior
        const output = this.window.querySelector('.terminal-output');
        let isUsingScrollbar = false;
        
        // Detect scrollbar interaction
        output.addEventListener('mousedown', (e) => {
            const isClickNearScrollbar = (output.offsetWidth - e.offsetX) < 20;
            if (isClickNearScrollbar) {
                isUsingScrollbar = true;
            }
        });
        
        window.addEventListener('mouseup', () => {
            isUsingScrollbar = false;
        });
        
        // Handle scrolling
        output.addEventListener('scroll', () => {
            if (isUsingScrollbar) {
                // Immediate snapping for scrollbar
                const snapSize = 16;
                output.style.scrollBehavior = 'auto';
                output.scrollTop = Math.round(output.scrollTop / snapSize) * snapSize;
            }
        });
        
        // Smooth scrolling for wheel/gesture
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

    initializeInputListeners(input) {
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = input.textContent.trim();
                if (command) {
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    
                    // Print the command with its prompt
                    const promptText = `${this.username}@omega ${this.getDisplayPath(this.currentDirectory)} %`;
                    this.print(`${promptText} ${command}\n`);
                    
                    await this.executeCommand(command);
                    
                    // Remove the old input line
                    input.parentElement.parentElement.remove();
                    
                    // Create a new input line
                    this.createNewInputLine();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.textContent = this.history[this.historyIndex];
                    // Move cursor to end
                    const range = document.createRange();
                    range.selectNodeContents(input);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.textContent = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.textContent = '';
                }
                // Move cursor to end
                const range = document.createRange();
                range.selectNodeContents(input);
                range.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }

    print(text, className = '', preserveIndentation = false) {
        const output = this.window.querySelector('#output');
        const span = document.createElement('span');
        
        if (preserveIndentation) {
            // For help text and other formatted output, just trim the first newline
            span.textContent = text.replace(/^\n/, '');
        } else {
            // For command outputs, remove all leading whitespace from each line
            span.textContent = text.replace(/^\s+/gm, '');
        }
        
        if (className) span.className = className;
        output.appendChild(span);
        output.scrollTop = output.scrollHeight;
    }

    clear() {
        const output = this.window.querySelector('#output');
        output.innerHTML = '';
    }

    async executeCommand(command) {
        const [cmd, ...args] = command.split(' ');
        
        try {
            switch (cmd.toLowerCase()) {
                case 'clear':
                    this.clear();
                    break;
                case 'pwd':
                    this.print(this.currentDirectory + '\n');
                    break;
                case 'ls':
                    await this.listDirectory(this.resolvePath(args[0] || this.currentDirectory));
                    break;
                case 'cd':
                    await this.changeDirectory(this.resolvePath(args[0] || this.HOME));
                    break;
                case 'mkdir':
                    if (!args[0]) {
                        throw new Error('mkdir: missing operand');
                    }
                    await this.createDirectory(args[0]);
                    break;
                case 'touch':
                    if (!args[0]) {
                        throw new Error('touch: missing operand');
                    }
                    await this.createFile(args[0]);
                    break;
                case 'rm':
                    if (!args[0]) {
                        throw new Error('rm: missing operand');
                    }
                    await this.removeEntry(args[0]);
                    break;
                case 'cat':
                    if (!args[0]) {
                        throw new Error('cat: missing operand');
                    }
                    await this.catFile(args[0]);
                    break;
                case 'echo':
                    this.print(args.join(' ') + '\n');
                    break;
                case 'help':
                    this.showHelp();
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
                    this.print(now.toLocaleString(systemSettings.language, dateOptions) + '\n');
                    break;
                case 'whoami':
                    this.print(this.username + '\n');
                    break;
                case 'hostname':
                    this.print('omega\n');
                    break;
                case 'uname':
                    if (args[0] === '-a') {
                        this.print('OmegaOS 1.0 omega browser js\n');
                    } else {
                        this.print('OmegaOS\n');
                    }
                    break;
                case 'ps':
                    this.print('  PID TTY          TIME CMD\n  1 tty1     00:00:00 omega-shell\n');
                    break;
                default:
                    throw new Error(`Command not found: ${cmd}`);
            }
        } catch (error) {
            this.print(`${error.message}\n`, 'error-text');
        }
    }

    getDisplayPath(path) {
        // Get just the current directory name
        const dirName = path === '/' ? '/' : path.split('/').filter(Boolean).pop();
        
        // If we're in the home directory, show ~
        if (path === this.HOME) {
            return '~';
        }
        
        // If we're in a subdirectory of home, show ~/rest/of/path
        if (path.startsWith(this.HOME + '/')) {
            return dirName;
        }
        
        // For all other paths, just show the current directory name
        return dirName;
    }

    resolvePath(path) {
        if (!path) return this.currentDirectory;
        if (path === '~') return this.HOME;
        if (path === '-') return this.previousDirectory || this.currentDirectory;
        if (path.startsWith('~/')) return path.replace('~', this.HOME);
        
        // Handle absolute paths
        if (path.startsWith('/')) return this.normalizePath(path);
        
        // Handle relative paths
        return this.normalizePath(this.joinPaths(this.currentDirectory, path));
    }

    normalizePath(path) {
        // Split path into segments and handle . and ..
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

    async listDirectory(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            const entries = await filesystem.readDirectory(resolvedPath);
            
            for (const entry of entries) {
                const prefix = entry.type === 'directory' ? 'd ' : '- ';
                this.print(prefix + entry.name + '\n');
            }
        } catch (error) {
            throw new Error(`Failed to list directory: ${error.message}`);
        }
    }

    async changeDirectory(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            
            // Special case for cd -
            if (path === '-' && !this.previousDirectory) {
                throw new Error('No previous directory');
            }
            
            await filesystem.readDirectory(resolvedPath); // Verify directory exists
            this.previousDirectory = this.currentDirectory;
            this.currentDirectory = resolvedPath;
            
            if (path === '-') {
                // Show the directory we changed to, like real bash
                this.print(this.currentDirectory + '\n');
            }
        } catch (error) {
            throw new Error(`Failed to change directory: ${error.message}`);
        }
    }

    async createDirectory(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            await filesystem.createDirectory(resolvedPath);
            this.print(`Created directory: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
    }

    async createFile(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            await filesystem.writeFile(resolvedPath, '');
            this.print(`Created file: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }

    async removeEntry(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            await filesystem.deleteEntry(resolvedPath);
            this.print(`Removed: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to remove entry: ${error.message}`);
        }
    }

    async catFile(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const resolvedPath = this.resolvePath(path);
            const content = await filesystem.readFile(resolvedPath);
            this.print(content + '\n');
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    showHelp() {
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
        this.print(help, '', true);
    }

    joinPaths(...parts) {
        return '/' + parts.map(part => part.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
    }

    getTextWidth(text, element) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(element);
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0.8; // Default to 0.8px if not set
        const textWidth = context.measureText(text).width;
        // Add letter spacing for each character gap (one less than the number of characters)
        return textWidth + (Math.max(0, text.length - 1) * letterSpacing);
    }
}

window.TerminalApp = TerminalApp; 