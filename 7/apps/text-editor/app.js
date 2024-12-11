class TextEditorApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.currentFile = null;
        this.unsavedChanges = false;
    }

    async onInitialize(window) {
        // Create UI
        const content = window.element.querySelector('.window-content');
        content.innerHTML = `
            <div class="text-editor">
                <div class="toolbar">
                    <button class="toolbar-btn" data-action="new">New</button>
                    <button class="toolbar-btn" data-action="open">Open</button>
                    <button class="toolbar-btn" data-action="save">Save</button>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-btn" data-action="undo">Undo</button>
                    <button class="toolbar-btn" data-action="redo">Redo</button>
                    <div class="toolbar-separator"></div>
                    <select class="font-family">
                        <option value="monospace">Monospace</option>
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                    </select>
                    <select class="font-size">
                        ${[12, 14, 16, 18, 20, 24].map(size => 
                            `<option value="${size}">${size}px</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="editor-container">
                    <textarea class="editor" spellcheck="true"></textarea>
                </div>
                <div class="status-bar">
                    <span class="file-name">Untitled</span>
                    <span class="cursor-position">Ln 1, Col 1</span>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .text-editor {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #fff;
            }

            .toolbar {
                padding: 8px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                gap: 4px;
                align-items: center;
            }

            .toolbar-btn {
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f5f5f5;
                cursor: pointer;
            }

            .toolbar-btn:hover {
                background: #e5e5e5;
            }

            .toolbar-separator {
                width: 1px;
                height: 20px;
                background: #e0e0e0;
                margin: 0 8px;
            }

            .editor-container {
                flex: 1;
                position: relative;
                overflow: hidden;
            }

            .editor {
                width: 100%;
                height: 100%;
                padding: 16px;
                border: none;
                resize: none;
                font-family: monospace;
                font-size: 14px;
                line-height: 1.5;
                tab-size: 4;
            }

            .editor:focus {
                outline: none;
            }

            .status-bar {
                padding: 4px 8px;
                background: #f5f5f5;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #666;
            }

            select {
                padding: 4px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
        `;
        window.element.appendChild(style);

        // Get elements
        this.editor = content.querySelector('.editor');
        this.fileName = content.querySelector('.file-name');
        this.cursorPosition = content.querySelector('.cursor-position');

        // Add event listeners
        this.setupEventListeners(content);
    }

    setupEventListeners(content) {
        // Toolbar actions
        content.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleToolbarAction(btn.dataset.action);
            });
        });

        // Font controls
        content.querySelector('.font-family').addEventListener('change', (e) => {
            this.editor.style.fontFamily = e.target.value;
        });

        content.querySelector('.font-size').addEventListener('change', (e) => {
            this.editor.style.fontSize = `${e.target.value}px`;
        });

        // Editor events
        this.editor.addEventListener('input', () => {
            this.unsavedChanges = true;
            this.updateWindowTitle();
        });

        this.editor.addEventListener('keydown', (e) => {
            // Handle tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;
                this.editor.value = this.editor.value.substring(0, start) + '    ' + this.editor.value.substring(end);
                this.editor.selectionStart = this.editor.selectionEnd = start + 4;
            }
        });

        // Update cursor position
        this.editor.addEventListener('keyup', () => this.updateCursorPosition());
        this.editor.addEventListener('click', () => this.updateCursorPosition());
        this.editor.addEventListener('select', () => this.updateCursorPosition());
    }

    async handleToolbarAction(action) {
        switch (action) {
            case 'new':
                if (this.unsavedChanges) {
                    const save = await this.system.showDialog('Save Changes?', 
                        'Do you want to save changes before creating a new file?',
                        ['Save', 'Don\'t Save', 'Cancel']
                    );
                    if (save === 'Save') {
                        await this.handleToolbarAction('save');
                    } else if (save === 'Cancel') {
                        return;
                    }
                }
                this.newFile();
                break;

            case 'open':
                try {
                    const fileHandle = await window.showOpenFilePicker({
                        types: [
                            {
                                description: 'Text Files',
                                accept: {
                                    'text/*': ['.txt', '.md', '.js', '.css', '.html']
                                }
                            }
                        ]
                    });
                    await this.openFile(fileHandle[0]);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error opening file:', error);
                    }
                }
                break;

            case 'save':
                if (this.currentFile) {
                    await this.saveFile();
                } else {
                    await this.saveFileAs();
                }
                break;

            case 'undo':
                this.editor.focus();
                document.execCommand('undo');
                break;

            case 'redo':
                this.editor.focus();
                document.execCommand('redo');
                break;
        }
    }

    async openFile(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            this.editor.value = content;
            this.currentFile = fileHandle;
            this.fileName.textContent = fileHandle.name;
            this.unsavedChanges = false;
            this.updateWindowTitle();
        } catch (error) {
            console.error('Error reading file:', error);
            this.system.showNotification('Error', 'Failed to open file');
        }
    }

    async saveFile() {
        try {
            const writable = await this.currentFile.createWritable();
            await writable.write(this.editor.value);
            await writable.close();
            this.unsavedChanges = false;
            this.updateWindowTitle();
            this.system.showNotification('Success', 'File saved successfully');
        } catch (error) {
            console.error('Error saving file:', error);
            this.system.showNotification('Error', 'Failed to save file');
        }
    }

    async saveFileAs() {
        try {
            const fileHandle = await window.showSaveFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt']
                        }
                    }
                ]
            });
            this.currentFile = fileHandle;
            this.fileName.textContent = fileHandle.name;
            await this.saveFile();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error saving file:', error);
                this.system.showNotification('Error', 'Failed to save file');
            }
        }
    }

    newFile() {
        this.editor.value = '';
        this.currentFile = null;
        this.fileName.textContent = 'Untitled';
        this.unsavedChanges = false;
        this.updateWindowTitle();
    }

    updateCursorPosition() {
        const text = this.editor.value.substring(0, this.editor.selectionStart);
        const lines = text.split('\n');
        const currentLine = lines.length;
        const currentColumn = lines[lines.length - 1].length + 1;
        this.cursorPosition.textContent = `Ln ${currentLine}, Col ${currentColumn}`;
    }

    updateWindowTitle() {
        const title = this.currentFile ? this.currentFile.name : 'Untitled';
        this.windows.forEach(window => {
            window.setTitle(`${title}${this.unsavedChanges ? ' *' : ''} - Text Editor`);
        });
    }

    onCleanup() {
        // Handle cleanup if needed
    }
}

// Register the app class
window.TextEditorApp = TextEditorApp; 