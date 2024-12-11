// OMEGA OS - Main Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Create core system instances
        window.omegaOS = new OmegaOS();
        window.omegaOS.auth = new AuthSystem();
        window.omegaOS.filesystem = null;  // Will be initialized later
        window.omegaOS.windowManager = null;  // Will be initialized later
        window.omegaOS.menuBar = null;  // Will be initialized later
        window.omegaOS.dock = null;  // Will be initialized later
        window.omegaOS.appSystem = null;  // Will be initialized later

        // Wait for all core scripts to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize OS
        await window.omegaOS.init();
    } catch (error) {
        console.error('Failed to initialize OMEGA OS:', error);
    }
}); 