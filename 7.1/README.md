# OMEGA OS

OMEGA OS is a web-based operating system that runs entirely in your browser. It provides a macOS-like experience with support for custom applications, file system access, and a modern user interface.

## Features

- Modern, macOS-inspired user interface
- Window management system with drag, resize, minimize, and maximize
- File system access using the File System Access API
- Custom application support with sandboxed environment
- Dock with app management and animations
- Context menus and keyboard shortcuts
- Notification system
- Theme support

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/omega-os.git
cd omega-os
```

2. Start a local server:
```bash
python -m http.server 8000
# or
npx serve
```

3. Open your browser and navigate to `http://localhost:8000`

## Building Apps for OMEGA OS

### App Structure

Apps in OMEGA OS follow a simple structure:

```
apps/
  your-app/
    manifest.json
    app.js
    assets/
      icon.svg
      ...
```

### App Manifest

Create a `manifest.json` file for your app:

```json
{
    "id": "your-app",
    "name": "Your App",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Description of your app",
    "icon": "assets/icon.svg",
    "entry": "app.js",
    "permissions": ["filesystem", "notifications"],
    "defaultWindow": {
        "width": 800,
        "height": 600,
        "resizable": true,
        "frame": true
    }
}
```

### App Implementation

Create your app by extending the `OmegaApp` class:

```javascript
class YourApp extends OmegaApp {
    constructor(system, manifest) {
        super(system, manifest);
    }

    async onInitialize(window) {
        // Set up your app's UI and functionality
        const content = window.element.querySelector('.window-content');
        content.innerHTML = `
            <div class="your-app">
                <!-- Your app's HTML -->
            </div>
        `;

        // Add your app's styles
        const style = document.createElement('style');
        style.textContent = `
            .your-app {
                /* Your app's styles */
            }
        `;
        window.element.appendChild(style);

        // Initialize your app
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add your event listeners
    }

    onCleanup() {
        // Clean up resources when app is closed
    }
}

// Register your app
window.YourApp = YourApp;
```

### Available APIs

#### System APIs

- `this.system.filesystem`: Access the file system
- `this.system.showNotification(title, message, options)`: Show system notifications
- `this.system.showDialog(title, message, buttons)`: Show system dialogs
- `this.system.requestPermission(permission)`: Request system permissions

#### Window Management

- `this.createWindow(options)`: Create a new window
- `window.setTitle(title)`: Update window title
- `window.minimize()`: Minimize window
- `window.maximize()`: Maximize window
- `window.restore()`: Restore window
- `window.close()`: Close window

#### Inter-Process Communication

- `this.sendMessage(windowId, channel, data)`: Send message to specific window
- `this.broadcast(channel, data)`: Send message to all windows

### Example Apps

Check out these example apps in the repository:

1. Text Editor: A simple text editor with file system access
2. Terminal: A terminal emulator
3. Settings: System settings app
4. Calculator: Basic calculator app

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by macOS and modern web technologies
- Built with vanilla JavaScript, HTML, and CSS
- Uses the File System Access API for file system operations 