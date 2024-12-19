# OMEGA OS Developer Guide

## Introduction
This guide will help you create applications for OMEGA OS. OMEGA OS applications are web-based and use modern web technologies (HTML, CSS, JavaScript).

## Application Structure
An OMEGA OS application consists of two main parts:
1. Application Manifest
2. Application Code

### Application Manifest
The manifest is a JSON file that describes your application. Here's an example:

```json
{
    "id": "myapp",
    "name": "My App",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "A description of your app",
    "icon": "path/to/icon.svg",
    "permissions": ["filesystem", "notifications"],
    "defaultWindow": {
        "width": 800,
        "height": 600,
        "resizable": true,
        "frame": true
    }
}
```

### Application Code
Your application code should extend the `OmegaApp` class. Here's a template:

```javascript
class MyApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        // Initialize your app state here
    }

    async onInitialize(window) {
        // Set up your app's UI
        window.setContent(`
            <div class="myapp">
                <!-- Your app's HTML here -->
            </div>
        `);

        // Add your app's styles
        window.addStyles(`
            .myapp {
                /* Your app's CSS here */
            }
        `);

        // Initialize event listeners
        this.initializeEventListeners(window);
    }

    initializeEventListeners(window) {
        // Set up your event listeners here
    }

    // Add any additional methods your app needs
}

// Register your app with the system
window.MyApp = MyApp;
```

## Available APIs

### Window API
- `window.setContent(html)`: Set the window's content
- `window.addStyles(css)`: Add styles to the window
- `window.setTitle(title)`: Set the window's title
- `window.showPrompt(title, message)`: Show a prompt dialog
- `window.showError(title, message)`: Show an error dialog

### System API
- `this.system.showNotification(title, message, options)`: Show a system notification
- `this.system.requestPermission(permission)`: Request a system permission
- `this.system.filesystem`: Access the filesystem API

### Filesystem API
- `filesystem.readDirectory(path)`: List directory contents
- `filesystem.readFile(path)`: Read a file
- `filesystem.writeFile(path, data)`: Write to a file
- `filesystem.createDirectory(path)`: Create a directory
- `filesystem.delete(path)`: Delete a file or directory

## Best Practices

1. **Performance**
   - Use efficient DOM operations
   - Minimize resource usage
   - Clean up resources in onCleanup()

2. **UI/UX**
   - Follow system design guidelines
   - Use system color variables for consistency
   - Support both light and dark themes
   - Make your app responsive

3. **Security**
   - Request only necessary permissions
   - Validate all user input
   - Handle errors gracefully

4. **Code Organization**
   - Keep your code modular
   - Use meaningful variable and function names
   - Comment complex logic
   - Follow JavaScript best practices

## Example Application

Here's a complete example of a simple note-taking app:

```javascript
class NotesApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
        this.notes = [];
        this.currentNote = null;
    }

    async onInitialize(window) {
        window.setContent(`
            <div class="notes-app">
                <div class="sidebar">
                    <div class="toolbar">
                        <button id="new-note">New Note</button>
                    </div>
                    <div id="notes-list"></div>
                </div>
                <div class="editor">
                    <textarea id="note-content"></textarea>
                </div>
            </div>
        `);

        window.addStyles(`
            .notes-app {
                display: grid;
                grid-template-columns: 200px 1fr;
                height: 100%;
                background: var(--window-bg);
                color: var(--text-color);
            }

            .sidebar {
                border-right: 1px solid var(--border-color);
                display: flex;
                flex-direction: column;
            }

            .toolbar {
                padding: 8px;
                border-bottom: 1px solid var(--border-color);
            }

            #notes-list {
                flex: 1;
                overflow-y: auto;
            }

            .note-item {
                padding: 8px;
                cursor: pointer;
            }

            .note-item:hover {
                background: var(--hover-bg);
            }

            .note-item.active {
                background: var(--active-bg);
            }

            .editor {
                padding: 16px;
            }

            #note-content {
                width: 100%;
                height: 100%;
                background: transparent;
                border: none;
                color: inherit;
                font-family: inherit;
                resize: none;
            }

            #note-content:focus {
                outline: none;
            }
        `);

        await this.loadNotes();
        this.initializeEventListeners(window);
    }

    async loadNotes() {
        try {
            const filesystem = await this.requestFileSystem();
            const notesDir = '/Documents/Notes';
            
            // Create notes directory if it doesn't exist
            try {
                await filesystem.createDirectory(notesDir);
            } catch (e) {
                // Directory might already exist
            }

            const entries = await filesystem.readDirectory(notesDir);
            this.notes = entries.filter(entry => entry.kind === 'file');
            this.updateNotesList();
        } catch (error) {
            this.system.showError('Error', 'Failed to load notes');
        }
    }

    updateNotesList() {
        const list = window.querySelector('#notes-list');
        list.innerHTML = '';

        for (const note of this.notes) {
            const item = document.createElement('div');
            item.className = 'note-item';
            item.textContent = note.name;
            if (this.currentNote === note.name) {
                item.classList.add('active');
            }
            list.appendChild(item);
        }
    }

    initializeEventListeners(window) {
        const newNoteBtn = window.querySelector('#new-note');
        const notesList = window.querySelector('#notes-list');
        const noteContent = window.querySelector('#note-content');

        newNoteBtn.addEventListener('click', async () => {
            const name = await window.showPrompt('New Note', 'Enter note name:');
            if (name) {
                await this.createNote(name);
            }
        });

        notesList.addEventListener('click', async (e) => {
            const item = e.target.closest('.note-item');
            if (item) {
                await this.openNote(item.textContent);
            }
        });

        noteContent.addEventListener('input', () => {
            this.saveCurrentNote();
        });
    }

    async createNote(name) {
        try {
            const filesystem = await this.requestFileSystem();
            const path = `/Documents/Notes/${name}.txt`;
            await filesystem.writeFile(path, '');
            this.notes.push({ name: `${name}.txt`, kind: 'file' });
            this.updateNotesList();
            await this.openNote(`${name}.txt`);
        } catch (error) {
            this.system.showError('Error', 'Failed to create note');
        }
    }

    async openNote(name) {
        try {
            const filesystem = await this.requestFileSystem();
            const path = `/Documents/Notes/${name}`;
            const content = await filesystem.readFile(path);
            const noteContent = window.querySelector('#note-content');
            noteContent.value = content;
            this.currentNote = name;
            this.updateNotesList();
        } catch (error) {
            this.system.showError('Error', 'Failed to open note');
        }
    }

    async saveCurrentNote() {
        if (!this.currentNote) return;

        try {
            const filesystem = await this.requestFileSystem();
            const path = `/Documents/Notes/${this.currentNote}`;
            const content = window.querySelector('#note-content').value;
            await filesystem.writeFile(path, content);
        } catch (error) {
            this.system.showError('Error', 'Failed to save note');
        }
    }
}

window.NotesApp = NotesApp;
```

## Publishing Your App

To publish your app:

1. Create a directory for your app in the `js/apps` directory
2. Add your app's manifest file
3. Add your app's JavaScript file
4. Add your app's icon to the `assets/icons` directory
5. Register your app in the system by adding it to the default apps list

## Testing Your App

1. Load your app's script in `index.html`
2. Register your app with the system
3. Test all functionality thoroughly
4. Test with different window sizes
5. Test with both light and dark themes
6. Test error handling
7. Test performance with large data sets

## Support

If you need help developing your app, you can:
1. Check the API documentation
2. Look at the core apps for examples
3. File an issue on the repository
4. Contact the OMEGA OS team 