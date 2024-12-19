// OMEGA OS - Main Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Create auth system first
        const authSystem = new AuthSystem();
        
        // Create core system instance with auth system
        window.omegaOS = new OmegaOS();
        window.omegaOS.auth = authSystem;
        
        // Initialize other components that will be initialized later
        window.omegaOS.filesystem = null;
        window.omegaOS.windowManager = null;
        window.omegaOS.menuBar = null;
        window.omegaOS.dock = null;
        window.omegaOS.appSystem = null;
        window.omegaOS.contextMenuManager = null;
        window.omegaOS.desktop = null;

        // Wait for all core scripts to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize OS
        await window.omegaOS.init();
    } catch (error) {
        console.error('Failed to initialize OMEGA OS:', error);
    }
}); 