class TerminalApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.history = [];
        this.historyIndex = -1;
        this.currentDirectory = '/';
    }

    async onInitialize(window) {
        this.window = window;

        window.setContent(`
            <div class="terminal">
                <div id="output" class="terminal-output"></div>
                <div class="terminal-input-line">
                    <span class="prompt">$</span>
                    <input type="text" id="input" class="terminal-input" autofocus>
                </div>
            </div>
        `);

        window.addStyles(`
            .terminal {
                height: 100%;
                background: var(--terminal-bg, #1a1a1a);
                color: var(--terminal-text, #f0f0f0);
                padding: 16px;
                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                display: flex;
                flex-direction: column;
            }

            .terminal-output {
                flex: 1;
                overflow-y: auto;
                white-space: pre-wrap;
                margin-bottom: 16px;
            }

            .terminal-input-line {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .prompt {
                color: var(--terminal-prompt, #4CAF50);
            }

            .terminal-input {
                flex: 1;
                background: transparent;
                border: none;
                color: inherit;
                font-family: inherit;
                font-size: inherit;
                padding: 0;
                margin: 0;
            }

            .terminal-input:focus {
                outline: none;
            }

            .error-text {
                color: var(--terminal-error, #ff5555);
            }
        `);

        this.initializeEventListeners();
        this.print('Welcome to OmegaOS Terminal\n');
        this.print('Type "help" for a list of commands\n\n');
    }

    initializeEventListeners() {
        const input = this.window.querySelector('#input');
        
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    await this.executeCommand(command);
                    input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.value = '';
                }
            }
        });

        // Focus input when clicking anywhere in the terminal
        this.window.querySelector('.terminal').addEventListener('click', () => {
            input.focus();
        });
    }

    async executeCommand(command) {
        this.print(`$ ${command}\n`);
        
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
                    await this.listDirectory(args[0] || this.currentDirectory);
                    break;
                case 'cd':
                    await this.changeDirectory(args[0] || '/');
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
                default:
                    throw new Error(`Command not found: ${cmd}`);
            }
        } catch (error) {
            this.print(`${error.message}\n`, 'error-text');
        }
    }

    print(text, className = '') {
        const output = this.window.querySelector('#output');
        const span = document.createElement('span');
        span.textContent = text;
        if (className) span.className = className;
        output.appendChild(span);
        output.scrollTop = output.scrollHeight;
    }

    clear() {
        const output = this.window.querySelector('#output');
        output.innerHTML = '';
    }

    async listDirectory(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const entries = await filesystem.readDirectory(path);
            
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
            const newPath = path.startsWith('/') ? path : this.joinPaths(this.currentDirectory, path);
            await filesystem.readDirectory(newPath); // Verify directory exists
            this.currentDirectory = newPath;
        } catch (error) {
            throw new Error(`Failed to change directory: ${error.message}`);
        }
    }

    async createDirectory(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const fullPath = path.startsWith('/') ? path : this.joinPaths(this.currentDirectory, path);
            await filesystem.createDirectory(fullPath);
            this.print(`Created directory: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
    }

    async createFile(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const fullPath = path.startsWith('/') ? path : this.joinPaths(this.currentDirectory, path);
            await filesystem.writeFile(fullPath, '');
            this.print(`Created file: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }

    async removeEntry(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const fullPath = path.startsWith('/') ? path : this.joinPaths(this.currentDirectory, path);
            await filesystem.deleteEntry(fullPath);
            this.print(`Removed: ${path}\n`);
        } catch (error) {
            throw new Error(`Failed to remove entry: ${error.message}`);
        }
    }

    async catFile(path) {
        try {
            const filesystem = await this.requestFileSystem();
            const fullPath = path.startsWith('/') ? path : this.joinPaths(this.currentDirectory, path);
            const content = await filesystem.readFile(fullPath);
            this.print(content + '\n');
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    showHelp() {
        const help = `
Available commands:
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
`;
        this.print(help);
    }

    joinPaths(...parts) {
        return '/' + parts.map(part => part.replace(/^\/|\/$/g, '')).filter(Boolean).join('/');
    }
}

window.TerminalApp = TerminalApp; 