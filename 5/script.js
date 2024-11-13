let offsetX = 0;
let offsetY = 0;
let selectedIcon = null;
let isDragging = false;
let initialX = 0;
let initialY = 0;
let currentX = 0;
let currentY = 0;

function initializeIcons(iconsContainer, desktop, selectionBox) {
    const programs = [
        { name: "My Files", icon: "https://img.icons8.com/color/1500/folder-invoices--v1.png" },
        { name: "Task Manager", icon: "https://img.icons8.com/color/1500/heart-monitor.png" },
        { name: "Settings", icon: "https://img.icons8.com/color/1500/gear.png" },
        { name: "Calculator", icon: "https://img.icons8.com/color/1500/calculator.png" },
        { name: "Notes", icon: "https://img.icons8.com/color/1500/notepad.png" },
        { name: "Weather", icon: "https://img.icons8.com/color/1500/partly-cloudy-day--v1.png" },
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
}

function addIcon(iconSrc, iconName, iconsContainer, desktop) {
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon");
    iconContainer.setAttribute("data-program-name", iconName);

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
    const rows = Math.floor((desktopRect.height - 50 - margin) / (iconSize + margin));
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
    icon.classList.add("active");
    const programName = icon.getAttribute("data-program-name");
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

function initializeWindows(desktop) {
    desktop.addEventListener("mousedown", handleWindowClick);
}

function openProgramWindow(programData) {
    const programWindow = document.createElement("div");
    programWindow.classList.add("program-window");
    programWindow.isMaximized = false;

    windowOrder.push(programWindow);
    programWindow.style.zIndex = windowOrder.length;

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

    programWindow.appendChild(titleBar);
    programWindow.appendChild(controlButtons);

    // Load program content dynamically
    const programContent = document.createElement("div");
    programContent.textContent = "Loading...";
    programWindow.appendChild(programContent);

    const desktop = document.getElementById("desktop");
    desktop.appendChild(programWindow);

    const maxZIndex = Array.from(desktop.querySelectorAll(".program-window"))
        .reduce((maxZ, window) => Math.max(maxZ, parseInt(window.style.zIndex || 0)), 0);
    programWindow.style.zIndex = maxZIndex + 1;

    focusWindow(programWindow);

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function handleMouseDown(event) {
        if (programWindow.isMaximized) {
            return;
        }
        isDragging = true;
        offsetX = event.clientX - programWindow.getBoundingClientRect().left;
        offsetY = event.clientY - programWindow.getBoundingClientRect().top;
        event.preventDefault();
    }

    function handleMouseMove(event) {
        if (isDragging && !programWindow.isMaximized) {
            programWindow.style.left = event.clientX - offsetX + "px";
            programWindow.style.top = event.clientY - offsetY + "px";
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    programWindow.addEventListener("mousedown", handleMouseDown);
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
        } else {
            if (!programWindow.classList.contains("focused")) {
                focusWindow(programWindow);
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
    script.src = `programs/${programData.name.replace(" ", "").toLowerCase()}.js`;
    script.onload = function() {
        const content = window[`open${programData.name.replace(" ", "")}`]();
        programContent.innerHTML = ""; // Clear loading text
        programContent.appendChild(content);
    };
    document.body.appendChild(script);

    return programWindow;
}

function closeProgramWindow(programWindow, programData) {
    programWindow.parentNode.removeChild(programWindow);
    if (programData.dockIcon) {
        programData.dockIcon.parentNode.removeChild(programData.dockIcon);
    }
}

function focusWindow(window) {
    const desktop = document.getElementById("desktop");
    desktop.querySelectorAll(".program-window").forEach(function(win) {
        win.classList.remove("focused");
    });

    window.classList.add("focused");

    const index = windowOrder.indexOf(window);
    if (index > -1) {
        windowOrder.splice(index, 1);
    }
    windowOrder.push(window);

    windowOrder.forEach((win, i) => {
        win.style.zIndex = i + 1;
    });
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

document.addEventListener("DOMContentLoaded", function() {
    const desktop = document.getElementById("desktop");
    const iconsContainer = document.getElementById("desktop-icons");
    const selectionBox = document.getElementById("selection-box");

    // Initialize icon and window management
    initializeIcons(iconsContainer, desktop, selectionBox);
    initializeWindows(desktop);

    // Add event listeners for desktop interactions
    desktop.addEventListener("click", handleDesktopClick);
    desktop.addEventListener("mousedown", handleDesktopMouseDown);
}); 
