class FileSystem {
    constructor() {
        this.rootHandle = null;
        this.currentDirectory = null;
    }

    async initialize(handle) {
        try {
            if (!handle) {
                throw new Error('No filesystem handle provided');
            }

            // Verify we have access
            const permissionStatus = await handle.queryPermission({ mode: 'readwrite' });
            if (permissionStatus !== 'granted') {
                // Try to request permission again
                const newPermissionStatus = await handle.requestPermission({ mode: 'readwrite' });
                if (newPermissionStatus !== 'granted') {
                    throw new Error('File system access denied');
                }
            }

            this.rootHandle = handle;
            this.currentDirectory = handle;

            // Create default directories
            await this.ensureDefaultDirectories();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize filesystem:', error);
            throw error;
        }
    }

    async ensureDefaultDirectories() {
        const defaultDirs = ['Desktop', 'Documents', 'Downloads', 'Applications', 'Photos', 'Videos', 'Trash'];
        
        for (const dir of defaultDirs) {
            try {
                await this.createDirectory(dir);
            } catch (error) {
                console.warn(`Failed to create ${dir} directory:`, error);
            }
        }
    }

    async getDirectoryHandle(path) {
        if (path === '/') {
            return this.rootHandle;
        }

        const parts = path.split('/').filter(Boolean);
        let currentHandle = this.rootHandle;

        for (const part of parts) {
            try {
                currentHandle = await currentHandle.getDirectoryHandle(part);
            } catch (error) {
                throw new Error(`Directory not found: ${path}`);
            }
        }

        return currentHandle;
    }

    async readDirectory(path) {
        try {
            const dirHandle = await this.getDirectoryHandle(path);
            const entries = [];
            
            for await (const entry of dirHandle.values()) {
                entries.push({
                    name: entry.name,
                    type: entry.kind,
                    handle: entry
                });
            }
            
            // Sort entries: directories first, then files, both alphabetically
            return entries.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === 'directory' ? -1 : 1;
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    }

    async createDirectory(path) {
        try {
            const parts = path.split('/').filter(Boolean);
            const dirName = parts.pop();
            const parentPath = parts.length ? '/' + parts.join('/') : '/';
            
            const parentHandle = await this.getDirectoryHandle(parentPath);
            return await parentHandle.getDirectoryHandle(dirName, { create: true });
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    async readFile(path) {
        try {
            const parts = path.split('/').filter(Boolean);
            const fileName = parts.pop();
            const dirPath = parts.length ? '/' + parts.join('/') : '/';
            
            const dirHandle = await this.getDirectoryHandle(dirPath);
            const fileHandle = await dirHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async writeFile(path, contents) {
        try {
            const parts = path.split('/').filter(Boolean);
            const fileName = parts.pop();
            const dirPath = parts.length ? '/' + parts.join('/') : '/';
            
            const dirHandle = await this.getDirectoryHandle(dirPath);
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(contents);
            await writable.close();
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    async deleteEntry(path) {
        try {
            const parts = path.split('/').filter(Boolean);
            const name = parts.pop();
            const dirPath = parts.length ? '/' + parts.join('/') : '/';
            
            const dirHandle = await this.getDirectoryHandle(dirPath);
            await dirHandle.removeEntry(name, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
            throw error;
        }
    }

    async moveEntry(oldPath, newPath) {
        try {
            // For now, implement move as copy + delete
            await this.copyEntry(oldPath, newPath);
            await this.deleteEntry(oldPath);
            return true;
        } catch (error) {
            console.error('Error moving entry:', error);
            throw error;
        }
    }

    async copyEntry(sourcePath, destPath) {
        try {
            const sourceContent = await this.readFile(sourcePath);
            await this.writeFile(destPath, sourceContent);
            return true;
        } catch (error) {
            console.error('Error copying entry:', error);
            throw error;
        }
    }
}

window.FileSystem = FileSystem; 