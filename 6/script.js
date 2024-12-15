let offsetX = 0;
let offsetY = 0;
let selectedIcon = null;
let isDragging = false;
let initialX = 0;
let initialY = 0;
let currentX = 0;
let currentY = 0;
let currentMenu = [];

// Add these variables for selection box functionality
let isSelecting = false; // To track if selection is active

function initializeIcons(iconsContainer, desktop, selectionBox) {
    const programs = [
        { name: "My Files", icon: "https://img.icons8.com/color/1500/folder-invoices--v1.png", scriptName: "myFiles.js", defaultWidth: 700, defaultHeight: 466, hasTitleBar: false, isResizable: true, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Go", action: () => console.log("Go clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Task Manager", icon: "https://img.icons8.com/color/1500/heart-monitor.png", scriptName: "taskManager.js", defaultWidth: 500, defaultHeight: 400, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Settings", icon: "https://img.icons8.com/color/1500/gear.png", scriptName: "settings.js", defaultWidth: 700, defaultHeight: 466, hasTitleBar: false, isResizable: true, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Calculator", icon: "https://img.icons8.com/color/1500/calculator.png", scriptName: "calculator.js", defaultWidth: 240, defaultHeight: 412, hasTitleBar: false, isResizable: false, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Convert", action: () => console.log("Convert clicked") },
            { label: "History", action: () => console.log("History clicked") },
            { label: "Speech", action: () => console.log("Speech clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Internet", icon: "https://img.icons8.com/color/1500/globe.png", scriptName: "internet.js", defaultWidth: 700, defaultHeight: 466, hasTitleBar: true, isResizable: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "History", action: () => console.log("History clicked") },
            { label: "Bookmarks", action: () => console.log("Bookmarks clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Write", icon: "https://img.icons8.com/color/1500/new-document.png", scriptName: "write.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Table", icon: "https://img.icons8.com/color/1500/new-spreadsheet.png", scriptName: "table.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "Insert", action: () => console.log("Insert clicked") },
            { label: "Format", action: () => console.log("Format clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Slide", icon: "https://img.icons8.com/color/1500/new-presentation.png", scriptName: "slide.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Terminal", icon: "https://img.icons8.com/color/1500/console.png", scriptName: "terminal.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "App Shop", icon: "https://img.icons8.com/color/1500/price-tag--v1.png", scriptName: "appShop.js", defaultWidth: 700, defaultHeight: 466, hasTitleBar: false, isResizable: false, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Designer", icon: "https://img.icons8.com/color/1500/design--v1.png", scriptName: "designer.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Notes", icon: "https://img.icons8.com/color/1500/notepad.png", scriptName: "notes.js", defaultWidth: 400, defaultHeight: 300, hasTitleBar: true, isResizable: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Weather", icon: "https://img.icons8.com/color/1500/partly-cloudy-day--v1.png", scriptName: "weather.js", defaultWidth: 580, defaultHeight: 320, hasTitleBar: false, isResizable: true, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Map", icon: "https://img.icons8.com/color/1500/map-marker--v1.png", scriptName: "map.js", defaultWidth: 780, defaultHeight: 520, hasTitleBar: false, isResizable: true, isOpaque: false, isSingleInstance: true, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Mall", icon: "https://img.icons8.com/color/1500/shopping-mall.png", scriptName: "mall.js", defaultWidth: 780, defaultHeight: 580, hasTitleBar: false, isResizable: true, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Discord", icon: "https://img.icons8.com/color/1500/discord--v2.png", scriptName: "discord.js", defaultWidth: 780, defaultHeight: 580, hasTitleBar: true, isResizable: true, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
        { name: "Help", icon: "https://img.icons8.com/color/1500/help--v1.png", scriptName: "help.js", defaultWidth: 700, defaultHeight: 466, hasTitleBar: false, isResizable: false, isOpaque: false, menu: [
            { label: "File", action: () => console.log("File clicked") },
            { label: "Edit", action: () => console.log("Edit clicked") },
            { label: "View", action: () => console.log("View clicked") },
            { label: "Window", action: () => console.log("Window clicked") },
            { label: "Help", action: () => console.log("Help clicked") },
        ] },
    ];

    programs.forEach(program => {
        localStorage.setItem(program.name, JSON.stringify(program));
        addIcon(program.icon, program.name, iconsContainer, desktop);
    });

    iconsContainer.addEventListener("click", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            const ctrlKey = navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey;
            handleIconClick(icon, ctrlKey, iconsContainer);
        } else {
            focusDesktop(); // Focus desktop if no icon is clicked
        }
    });

    iconsContainer.addEventListener("dblclick", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            handleIconDoubleClick(icon);
        }
    });

    document.addEventListener("mousedown", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            startDrag(icon, event.clientX, event.clientY);
        }
    });

    // Add event listeners for desktop interactions
    desktop.addEventListener("click", handleDesktopClick);
    desktop.addEventListener("mousedown", handleDesktopMouseDown);
}

function addIcon(iconSrc, iconName, iconsContainer, desktop) {
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon");
    iconContainer.setAttribute("data-program-name", iconName);
    // add tab index
    iconContainer.tabIndex = 0;

    const iconImage = document.createElement("img");
    iconImage.src = iconSrc;
    iconImage.alt = iconName;
    iconImage.draggable = false;

    const iconText = document.createElement("span");
    iconText.textContent = iconName;

    iconContainer.appendChild(iconImage);
    iconContainer.appendChild(iconText);

    const iconSize = 80;
    const margin = 24;
    const desktopRect = desktop.getBoundingClientRect();
    const columns = Math.floor((desktopRect.width - margin) / (iconSize + margin));
    const rows = Math.floor((desktopRect.height - 64 - margin) / (iconSize + margin));
    const existingIcons = iconsContainer.querySelectorAll(".icon").length;
    const col = Math.floor(existingIcons / rows);
    const row = existingIcons % rows;

    iconContainer.style.top = `${Math.max(row * (iconSize + margin), desktopRect.top)}px`;
    iconContainer.style.left = `${Math.max(col * (iconSize + margin), desktopRect.left)}px`;

    iconsContainer.appendChild(iconContainer);
}

function handleIconClick(icon, ctrlKey, iconsContainer) {
    if (ctrlKey) {
        icon.classList.toggle("selected");
    } else {
        iconsContainer.querySelectorAll(".icon.selected").forEach(function(selected) {
            selected.classList.remove("selected");
        });
        icon.classList.add("selected");
    }
}

function handleIconDoubleClick(icon) {
    // Remove 'active' class from any other icons
    const iconsContainer = document.getElementById("desktop-icons");
    iconsContainer.querySelectorAll(".icon.active").forEach(activeIcon => {
        activeIcon.classList.remove("active");
    });

    icon.classList.add("active");
    const programName = icon.getAttribute("data-program-name");
    console.log("Double clicked program:", programName);
    const programData = JSON.parse(localStorage.getItem(programName));
    if (programData) {
        openProgramWindow(programData);
    } else {
        console.error("Program data not found for:", programName);
    }
}

function startDrag(icon, clientX, clientY) {
    offsetX = clientX - parseInt(icon.style.left);
    offsetY = clientY - parseInt(icon.style.top);
    draggedIcon = icon;
    draggedIcon.style.zIndex = "999";
    icon.style.userSelect = "none";
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", endDrag);
}

function handleDrag(event) {
    const newX = event.clientX - offsetX;
    const newY = event.clientY - offsetY;
    draggedIcon.style.left = newX + "px";
    draggedIcon.style.top = newY + "px";
}

function endDrag() {
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", endDrag);
    draggedIcon.style.zIndex = "auto";

    // Snap to grid
    const gridSize = 80; // Define the grid size
    const margin = 24; // Define the margin
    const desktopRect = document.getElementById("desktop").getBoundingClientRect();

    // Calculate the nearest grid position
    const left = parseInt(draggedIcon.style.left);
    const top = parseInt(draggedIcon.style.top);
    const snappedLeft = Math.round((left - desktopRect.left) / (gridSize + margin)) * (gridSize + margin) + desktopRect.left;
    const snappedTop = Math.round((top - desktopRect.top) / (gridSize + margin)) * (gridSize + margin) + desktopRect.top;

    // Set the icon's position to the snapped position
    draggedIcon.style.left = `${snappedLeft}px`;
    draggedIcon.style.top = `${snappedTop}px`;
}

function executeProgram(programName) {
    const programData = JSON.parse(localStorage.getItem(programName));
    if (programData && programData.code) {
        eval(programData.code);
    } else {
        console.error("Program data not found for:", programName);
    }
} 

let windowOrder = [];

function handleDesktopClick() {
    if (selectedIcon) {
        selectedIcon.classList.remove("selected");
        selectedIcon = null;
    }
    focusDesktop(); // Call focusDesktop when the desktop is clicked
}

function focusDesktop() {
    const desktop = document.getElementById("desktop");
    desktop.querySelectorAll(".program-window").forEach(function(win) {
        win.classList.remove("focused");
    });
    desktop.classList.add("focused");

    // Define the desktop menu here
    const desktopMenu = [
        { label: "File", action: () => console.log("File clicked") },
        { label: "Edit", action: () => console.log("Edit clicked") },
        { label: "View", action: () => console.log("View clicked") },
        { label: "Go", action: () => console.log("Go clicked") },
        { label: "Window", action: () => console.log("Window clicked") },
        { label: "Help", action: () => console.log("Help clicked") },
    ];

    updateMenu(desktopMenu, "Desktop"); // Update the menu with the desktop menu
}

function initializeWindows(desktop) {
    desktop.addEventListener("mousedown", handleWindowClick);
    focusDesktop(); // Focus the desktop initially
}

function showDialog(message) {
    const dialog = document.createElement("div");
    dialog.classList.add("dialog");

    const dialogContent = document.createElement("div");
    dialogContent.classList.add("dialog-content");
    dialogContent.textContent = message;

    const controlButtons = document.createElement("div");
    controlButtons.classList.add("control-buttons");

    const closeButton = createButton("Close", "dialog-close-button", function() {
        dialog.remove();
    });

    controlButtons.appendChild(closeButton);
    dialogContent.appendChild(controlButtons);
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    
}

function openProgramWindow(programData) {
    // Check if the program is single instance and already open
    if (programData.isSingleInstance) {
        const existingWindow = document.querySelector(`.program-window[data-program-name="${programData.name}"]`);
        if (existingWindow) {
            // Show dialog
            showDialog(`${programData.name} is already open`);
            // Remove focus from all other windows
            const desktop = document.getElementById("desktop");
            desktop.querySelectorAll(".program-window").forEach(function(win) {
                win.classList.remove("focused");
            });

            // Bring the existing window to the front
            existingWindow.classList.add("focused");
            const index = windowOrder.indexOf(existingWindow);
            if (index > -1) {
                windowOrder.splice(index, 1);
                windowOrder.push(existingWindow);
                windowOrder.forEach((window, i) => {
                    window.style.zIndex = i + 1;
                });
            }

            // Unminimize the window if it is minimized
            if (existingWindow.classList.contains("minimized")) {
                existingWindow.classList.remove("minimized");
                existingWindow.classList.add("focused"); // Ensure it is focused after unminimizing
            }

            return existingWindow; // Return the existing window if it's already open
        }
    }

    const programWindow = document.createElement("div");
    programWindow.classList.add("program-window");
    programWindow.setAttribute("data-program-name", programData.name);
    programWindow.isMaximized = false;
    programWindow.isResizable = programData.isResizable !== false;

    // Set the default size of the window
    programWindow.style.width = programData.defaultWidth + "px";
    programWindow.style.height = programData.defaultHeight + "px";

    // Append the window to the desktop to calculate its dimensions
    const desktop = document.getElementById("desktop");
    desktop.appendChild(programWindow);

    // Calculate the center position
    const desktopRect = desktop.getBoundingClientRect();
    const left = (desktopRect.width - programWindow.offsetWidth) / 2 + desktopRect.left;
    const top = (desktopRect.height - programWindow.offsetHeight) / 2 + desktopRect.top;

    programWindow.style.left = `${left}px`;
    programWindow.style.top = `${top}px`;

    // Add the window to the order and set z-index
    windowOrder.push(programWindow);
    programWindow.style.zIndex = windowOrder.length;

    programWindow.style.backgroundColor = programData.isOpaque === false ? "#232323cc" : "#232323";
    // backdrop filter
    programWindow.style.backdropFilter = programData.isOpaque === false ? "blur(64px) saturate(3.2)" : "none";

    // Create title bar only if the program opts for it
    if (programData.hasTitleBar !== false) {
        const titleBar = document.createElement("div");
        titleBar.classList.add("title-bar");
        titleBar.textContent = programData.name;

        titleBar.addEventListener("dblclick", function() {
            if (programWindow.isMaximized) {
                programWindow.classList.remove("maximized");
                programWindow.isMaximized = false;
            } else {
                programWindow.classList.add("maximized");
                programWindow.isMaximized = true;
            }
            toggleMaximizeButton();
        });

        programWindow.appendChild(titleBar);
    }

    // Add resize handle if the window is resizable
    if (programWindow.isResizable) {
        const resizeHandle = document.createElement("div");
        resizeHandle.classList.add("resize-handle");
        programWindow.appendChild(resizeHandle);

        resizeHandle.addEventListener("mousedown", function(event) {
            event.preventDefault();
            startResize(event, programWindow);
        });
    }

    const controlButtons = document.createElement("div");
    controlButtons.classList.add("control-buttons");

    const closeButton = createButton("CLOSE", "close-button", function() {
        closeProgramWindow(programWindow, programData);
    });
    const minimizeButton = createButton("REMOVE", "minimize-button", function() {
        programWindow.classList.add("minimized");
        programWindow.classList.remove("focused");
    });
    const maximizeButton = createButton("EXPAND_CONTENT", "maximize-button", function() {
        programWindow.classList.add("maximized");
        programWindow.classList.remove("minimized");
        programWindow.isMaximized = true;
        toggleMaximizeButton();
    });
    const unmaximizeButton = createButton("COLLAPSE_CONTENT", "unmaximize-button", function() {
        programWindow.classList.remove("maximized");
        programWindow.isMaximized = false;
        toggleMaximizeButton();
    });

    function toggleMaximizeButton() {
        if (programWindow.isMaximized) {
            controlButtons.replaceChild(unmaximizeButton, maximizeButton);
        } else {
            controlButtons.replaceChild(maximizeButton, unmaximizeButton);
        }
    }

    controlButtons.appendChild(minimizeButton);
    controlButtons.appendChild(maximizeButton);
    controlButtons.appendChild(closeButton);
    programWindow.appendChild(controlButtons);

    // Add program content
    const programContent = document.createElement("div");
    programContent.classList.add("program-content");
    programContent.style.overflow = "auto";
    programContent.style.height = programData.hasTitleBar === false ? "100%" : "100%";
    programContent.style.borderRadius = programData.hasTitleBar === false ? "12px" : "0 0 12px 12px";
    programContent.style.display = "none"; // Hide initially
    programContent.textContent = "Loading...";
    programContent.style.paddingTop = programData.hasTitleBar === false ? "0" : "38px";

    // BOOKMARK 1 *

    programWindow.appendChild(programContent);

    // Trigger the open animation
    requestAnimationFrame(() => {
        programWindow.classList.add("open");
    });

    const maxZIndex = Array.from(desktop.querySelectorAll(".program-window"))
        .reduce((maxZ, window) => Math.max(maxZ, parseInt(window.style.zIndex || 0)), 0);
    programWindow.style.zIndex = maxZIndex + 1;

    focusWindow(programWindow);

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function handleMouseDown(event) {
        if (programWindow.isMaximized) {
            return; // Prevent dragging if maximized
        }
        // Check if the clicked element is a draghandle or within a draghandle
        if (event.target.closest(".draghandle") || event.target.closest(".title-bar")) {
            isDragging = true;
            programWindow.classList.add("moving");
            offsetX = event.clientX - programWindow.getBoundingClientRect().left;
            offsetY = event.clientY - programWindow.getBoundingClientRect().top;
            //removed: event.preventDefault();
        }
    }

    function handleMouseMove(event) {
        if (isDragging && !programWindow.isMaximized) {
            const newTop = event.clientY - offsetY;
            const menuBarHeight = document.getElementById("menu-bar").offsetHeight;
            programWindow.style.left = event.clientX - offsetX + "px";
            programWindow.style.top = Math.max(newTop, menuBarHeight + 2) + "px"; // Prevent going above menu bar
        }
    }

    function handleMouseUp() {
        isDragging = false;
        programWindow.classList.remove("moving"); // Remove moving class when dragging ends
    }

    // Add event listeners using capture phase
    programWindow.addEventListener("mousedown", handleMouseDown, true); // Capture phase

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    const dockIcon = document.createElement("img");
    dockIcon.src = programData.icon;
    dockIcon.alt = programData.name;
    dockIcon.classList.add("dock-icon");
    dockIcon.style.width = "46px";
    dockIcon.style.height = "46px";

    dockIcon.addEventListener("click", function() {
        if (programWindow.classList.contains("minimized")) {
            programWindow.classList.remove("minimized");
            if (programWindow.isMaximized) {
                programWindow.classList.add("maximized");
            } else {
                programWindow.classList.remove("maximized");
            }
            focusWindow(programWindow);

            // Move the window to the top of the stack
            const index = windowOrder.indexOf(programWindow);
            if (index > -1) {
                windowOrder.splice(index, 1);
                windowOrder.push(programWindow);
                windowOrder.forEach((window, i) => {
                    window.style.zIndex = i + 1;
                });
            }
        } else {
            if (!programWindow.classList.contains("focused")) {
                focusWindow(programWindow);
                const index = windowOrder.indexOf(programWindow);
                if (index > -1) {
                    windowOrder.splice(index, 1);
                    windowOrder.push(programWindow);
                    windowOrder.forEach((window, i) => {
                        window.style.zIndex = i + 1;
                    });
                }
            } else {
                programWindow.classList.add("minimized");
                programWindow.classList.remove("focused");
            }
        }
    });

    const dockIcons = document.getElementById("dockIcons");
    dockIcons.appendChild(dockIcon);
    programData.dockIcon = dockIcon;

    // Load the specific program script
    const script = document.createElement("script");
    script.src = `programs/${programData.scriptName}`;
    script.onload = function() {
        const content = window[`open${programData.name.replace(" ", "")}`]();
        programContent.innerHTML = ""; // Clear loading text
        programContent.appendChild(content);
        
        // Show the program content after a short delay
        setTimeout(() => {
            programContent.style.display = "block"; // Show the content
        }, 150); // Adjust the delay as needed
    };
    document.body.appendChild(script);

    // Define the menu for this program
    programData.menu = [
        { label: "File", action: () => console.log("File clicked") },
        { label: "Edit", action: () => console.log("Edit clicked") },
        { label: "View", action: () => console.log("View clicked") },
    ];

    return programWindow;
}

function closeProgramWindow(programWindow, programData) {
    programWindow.classList.add("close"); // Add close class for animation

    // Wait for the animation to finish before removing the window
    programWindow.addEventListener("transitionend", function() {
        programWindow.parentNode.removeChild(programWindow);
        if (programData.dockIcon) {
            programData.dockIcon.parentNode.removeChild(programData.dockIcon);
        }
        focusDesktop();
    }, { once: true }); // Ensure the event listener is removed after execution
}

function focusWindow(window) {
    const desktop = document.getElementById("desktop");
    desktop.querySelectorAll(".program-window").forEach(function(win) {
        win.classList.remove("focused");
    });

    window.classList.add("focused");

    const programName = window.getAttribute("data-program-name");
    console.log("Focusing on program:", programName); // Debugging line
    const programData = JSON.parse(localStorage.getItem(programName));
    console.log("Retrieved program data:", programData); // Debugging line
    if (programData && programData.menu) {
        console.log("Updating menu with:", programData.menu); // Debugging line
        updateMenu(programData.menu, programName); // Pass program name to updateMenu
    } else {
        console.error("No menu data found for:", programName); // Debugging line
        updateMenu([]); // Clear menu if no program data
    }
}

function handleWindowClick(event) {
    const clickedWindow = event.target.closest(".program-window");
    if (clickedWindow) {
        const desktop = document.getElementById("desktop");
        desktop.querySelectorAll(".program-window").forEach(function(window) {
            window.classList.remove("focused");
        });

        clickedWindow.classList.add("focused");

        const index = windowOrder.indexOf(clickedWindow);
        if (index > -1) {
            windowOrder.splice(index, 1);
        }
        windowOrder.push(clickedWindow);

        windowOrder.forEach((window, i) => {
            window.style.zIndex = i + 1;
        });

        focusWindow(clickedWindow); // Call focusWindow to update the menu
    }
} 

function createButton(text, className, clickHandler) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add(className);
    button.addEventListener("click", clickHandler);
    return button;
}

function handleDesktopClick() {
    if (selectedIcon) {
        selectedIcon.classList.remove("selected");
        selectedIcon = null;
    }
}

function handleDesktopMouseDown(event) {
    const clickedIcon = event.target.closest(".icon");
    const clickedWindow = event.target.closest(".program-window");
    const clickedDock = event.target.closest("#dock");
    if (!clickedIcon && !clickedWindow && !clickedDock) {
        initialX = event.clientX;
        initialY = event.clientY;

        const selectionBox = document.getElementById("selection-box");
        selectionBox.style.left = initialX + "px";
        selectionBox.style.top = initialY + "px";
        selectionBox.style.width = "0";
        selectionBox.style.height = "0";
        selectionBox.style.display = "block";

        isDragging = true;
        isSelecting = true; // Start selection
        addDesktopEventListeners();

        event.preventDefault();
    }
}

function addDesktopEventListeners() {
    const desktop = document.getElementById("desktop");
    if (!desktop.dataset.desktopEventsAdded) {
        desktop.addEventListener("mousemove", handleDesktopMouseMove);
        desktop.addEventListener("mouseup", handleDesktopMouseUp);
        desktop.dataset.desktopEventsAdded = true;
    }
}

function removeDesktopEventListeners() {
    const desktop = document.getElementById("desktop");
    desktop.removeEventListener("mousemove", handleDesktopMouseMove);
    desktop.removeEventListener("mouseup", handleDesktopMouseUp);
    delete desktop.dataset.desktopEventsAdded;
}

function handleDesktopMouseMove(event) {
    if (isDragging) {
        currentX = event.clientX;
        currentY = event.clientY;

        const selectionBox = document.getElementById("selection-box");
        const width = Math.abs(currentX - initialX);
        const height = Math.abs(currentY - initialY);

        selectionBox.style.width = width + "px";
        selectionBox.style.height = height + "px";
        selectionBox.style.left = Math.min(currentX, initialX) + "px";
        selectionBox.style.top = Math.min(currentY, initialY) + "px";

        highlightIconsWithinSelectionBox();
    }
}

function handleDesktopMouseUp() {
    if (isDragging) {
        isDragging = false;
        const selectionBox = document.getElementById("selection-box");
        selectionBox.classList.add("fade-out");

        setTimeout(() => {
            selectionBox.style.display = "none";
            selectionBox.classList.remove("fade-out");
        }, 100);
    }
}

function highlightIconsWithinSelectionBox() {
    const selectionBox = document.getElementById("selection-box");
    const selectionRect = selectionBox.getBoundingClientRect();
    const iconsContainer = document.getElementById("desktop-icons");

    iconsContainer.querySelectorAll(".icon").forEach(function(icon) {
        const iconRect = icon.getBoundingClientRect();
        const isIntersecting = !(iconRect.right < selectionRect.left || 
                                 iconRect.left > selectionRect.right || 
                                 iconRect.bottom < selectionRect.top || 
                                 iconRect.top > selectionRect.bottom);

        if (isIntersecting) {
            icon.classList.add("selected");
        } else {
            icon.classList.remove("selected");
        }
    });
} 

function startResize(event, programWindow) {
    const initialWidth = programWindow.offsetWidth;
    const initialHeight = programWindow.offsetHeight;
    const initialMouseX = event.clientX;
    const initialMouseY = event.clientY;

    function resize(event) {
        const newWidth = initialWidth + (event.clientX - initialMouseX);
        const newHeight = initialHeight + (event.clientY - initialMouseY);
        programWindow.style.width = newWidth + "px";
        programWindow.style.height = newHeight + "px";
    }

    function stopResize() {
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
    }

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
}

function updateMenu(menuItems, programName) {
    const menuList = document.getElementById("menu-items");
    if (!menuList) {
        console.error("Menu list element not found");
        return; // Exit if the menu list is not found
    }
    menuList.innerHTML = ""; // Clear existing menu items

    // Create a menu item for the program name
    const programNameItem = document.createElement("li");
    programNameItem.textContent = programName; // Set the program name
    programNameItem.classList.add("program-name"); // Optional: add a class for styling
    menuList.appendChild(programNameItem);

    // Add the menu items
    menuItems.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.label;
        li.onclick = item.action; // Assign the action to the click event
        menuList.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const bootScreen = document.getElementById("boot-screen");
    const progressBar = document.getElementById("progress-bar");
    const setupWizard = document.getElementById("setup-wizard");
    const signInScreen = document.getElementById("sign-in-screen");
    const finishSetupButton = document.getElementById("finish-setup");
    const folderAccessButton = document.getElementById("folder-access-button");
    const signInButton = document.getElementById("sign-in-button");

    // Simulate loading process
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(loadingInterval);
            // Add a delay before hiding the boot screen
            setTimeout(() => {
                bootScreen.style.display = "none";
                checkUserSetup();
            }, 100); // after boot time
        }
    }, 100); // boot time

    function checkUserSetup() {
        const userSetupComplete = localStorage.getItem("userSetupComplete");
        const username = localStorage.getItem("username");
        const storedPassword = localStorage.getItem("password");

        if (!userSetupComplete) {
            setupWizard.style.display = "block"; // Show setup wizard for new users
            updateMenu([{ label: "", action: () => {} }], "Setup Wizard"); // Update menu for setup wizard
        } else {
            signInScreen.style.display = "block"; // Show sign-in screen for returning users
            document.getElementById("sign-in-username").value = username; // Pre-fill username
            updateMenu([], ""); // Clear menu when showing sign-in screen

            // Check if a password is set and show/hide the password field accordingly
            const passwordField = document.getElementById("sign-in-password");
            if (storedPassword) {
                passwordField.style.display = "block"; // Show password field
            } else {
                passwordField.style.display = "none"; // Hide password field
            }
        }
    }

    finishSetupButton.addEventListener("click", async () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value; // New password input
        if (username) {
            localStorage.setItem("username", username);
            if (password) {
                const hashedPassword = hashPassword(password); // Hash the password
                localStorage.setItem("password", hashedPassword); // Store hashed password
            }
            localStorage.setItem("userSetupComplete", true);
            setupWizard.style.display = "none";

            // Only request home folder permission if it hasn't been set
            if (!window.homeFolderHandle) {
                await requestHomeFolderPermission();
            }
            
            initializeDesktop();
        } else {
            alert("Please enter a username.");
        }
    });

    signInButton.addEventListener("click", async () => {
        const username = document.getElementById("sign-in-username").value;
        const storedUsername = localStorage.getItem("username");
        const storedPassword = localStorage.getItem("password");

        if (username === storedUsername) {
            const password = document.getElementById("sign-in-password").value; // New password input
            if (storedPassword) {
                const { salt, hashed } = JSON.parse(storedPassword);
                const hashedInput = btoa(password + salt); // Hash input password with stored salt
                if (hashedInput === hashed) {
                    signInScreen.style.display = "none";
                    await requestHomeFolderPermission();
                    initializeDesktop();
                } else {
                    alert("Incorrect password.");
                }
            } else {
                signInScreen.style.display = "none";
                await requestHomeFolderPermission();
                initializeDesktop();
            }
        } else {
            alert("Username not found.");
        }
    });

    folderAccessButton.addEventListener("click", async () => {
        const handle = await window.showDirectoryPicker();
        const folderName = handle.name; // Get the folder name
        console.log("Selected folder:", folderName);
        
        // Update the button text to show the selected folder
        folderAccessButton.textContent = `Selected Folder: ${folderName}`;
    });

    async function requestHomeFolderPermission() {
        const handle = await window.showDirectoryPicker();
        window.homeFolderHandle = handle;
        return handle;
    }

    async function initializeDesktop() {
        const desktop = document.getElementById("desktop");
        const iconsContainer = document.getElementById("desktop-icons");
        const selectionBox = document.getElementById("selection-box");
        desktop.style.display = "block"; // Show the desktop

        // Request file access if not already granted
        if (!window.homeFolderHandle) {
            window.homeFolderHandle = await requestHomeFolderPermission();
        }

        // Initialize default folders
        await initializeDefaultFolders(window.homeFolderHandle);

        // Call existing initialization functions
        initializeIcons(iconsContainer, desktop, selectionBox);
        initializeWindows(desktop);
    }

    async function initializeDefaultFolders(homeFolderHandle) {
        const defaultFolders = ['Desktop', 'Documents', 'Downloads', 'Music', 'Photos', 'Programs', 'Trash', 'Videos'];
        for (const folderName of defaultFolders) {
            try {
                await homeFolderHandle.getDirectoryHandle(folderName, { create: true });
            } catch (error) {
                console.error(`Error creating folder ${folderName}:`, error);
            }
        }
    }
});

function updateClock() {
    const dateElement = document.getElementById("date");
    const timeElement = document.getElementById("time");
    const now = new Date();

    // Format the date
    const optionsDate = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = now.toLocaleString('en-US', optionsDate).replace(/,/g, '');
    
    // Format the time
    const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
    const formattedTime = now.toLocaleString('en-US', optionsTime);

    // Update the elements
    dateElement.textContent = formattedDate;
    timeElement.textContent = formattedTime;
}

// Call the updateClock function every second
setInterval(updateClock, 1000);
updateClock(); // Initial call to display the clock immediately 

function updateBatteryStatus() {
    const batteryElement = document.getElementById('battery');
    const batteryPercentageElement = document.getElementById('battery-percentage');
    const batteryProgress = document.getElementById('battery-progress');
    const chargingOverlay = document.getElementById('charging-overlay');

    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            const batteryLevel = Math.round(battery.level * 100); // Round to nearest whole number

            // Update the progress bar width
            batteryProgress.style.width = `${batteryLevel}%`;

            // Update the battery percentage text
            batteryPercentageElement.textContent = `${batteryLevel}%`;

            // Show or hide the charging overlay
            if (battery.charging) {
                chargingOverlay.classList.add('active');
                batteryProgress.style.opacity = 0.25;
            } else {
                chargingOverlay.classList.remove('active');
                batteryProgress.style.opacity = 1;

                // Change the color of the battery progress based on the level
                if (batteryLevel < 25) {
                    batteryProgress.style.backgroundColor = '#ff0000'; // Red
                } else {
                    batteryProgress.style.backgroundColor = '#fff'; // Default color
                }
            }
        });
    } else {
        // Hide the battery element if the device does not support battery status
        batteryElement.style.display = 'none';
    }
}

// Call the updateBatteryStatus function every 10 seconds
setInterval(updateBatteryStatus, 10000);
updateBatteryStatus(); // Initial call to display the battery status immediately

function updateWifiStatus() {
    const wifiIcon = document.getElementById('wifi-icon');
    const strengthIcon = wifiIcon.querySelector('.strength-icon');

    if (navigator.connection) {
        const connection = navigator.connection;
        const wifiStrength = connection.effectiveType; // Get the effective type of the connection

        // Clear previous strength icon
        strengthIcon.innerHTML = '';

        // Determine the icon to show based on the connection type
        let icon;
        if (connection.type === 'none') {
            strengthIcon.innerHTML = '<i class="material-symbols-rounded">wifi_off</i>';
        } else if (wifiStrength === '4g') {
            strengthIcon.innerHTML = '<i class="material-symbols-rounded">wifi</i>'; // Excellent
        } else if (wifiStrength === '3g') {
            strengthIcon.innerHTML = '<i class="material-symbols-rounded">wifi_2_bar</i>'; // Good
        } else {
            strengthIcon.innerHTML = '<i class="material-symbols-rounded">wifi_1_bar</i>'; // Poor
        }
    } else {
        // Fallback if navigator.connection is not available
        strengthIcon.innerHTML = '<i class="material-symbols-rounded">wifi_off</i>';
    }
}

// Call the updateWifiStatus function initially and set an interval to update it
updateWifiStatus();
setInterval(updateWifiStatus, 10000); // Update every 10 seconds

// New function to hash the password
function hashPassword(password) {
    const salt = generateSalt(); // Generate a salt
    const hashed = btoa(password + salt); // Simple hash (for demonstration)
    return JSON.stringify({ salt, hashed }); // Store both salt and hashed password
}

// New function to generate a salt
function generateSalt() {
    return Math.random().toString(36).substring(2, 15); // Simple salt generation
}
