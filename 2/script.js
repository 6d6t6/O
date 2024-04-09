// Declare offsetX and offsetY as global variables
let offsetX = 0;
let offsetY = 0;

document.addEventListener("DOMContentLoaded", function() {
    // Select the desktop and icons container
    const desktop = document.getElementById("desktop");
    const iconsContainer = document.getElementById("desktop-icons");
    const selectionBox = document.getElementById("selection-box");

    // Variable to store the currently selected icon
    let selectedIcon = null;

    // Variable to store whether the Shift key is pressed
    let shiftKeyPressed = false;

    // Define a data structure for programs and their logic
    const programs = [
        { name: "My Device", icon: "https://img.icons8.com/color/1500/monitor.png", code: function openMyDevice() { console.log('Opening My Device...'); } },
        { name: "Documents", icon: "https://img.icons8.com/color/1500/folder-invoices.png", code: function openDocuments() { console.log('Opening Documents...'); } },
        { name: "Internet", icon: "https://img.icons8.com/color/1500/geography.png", code: function openInternet() { console.log('Opening Internet...'); } },
        { name: "Task Manager", icon: "https://img.icons8.com/color/1500/heart-monitor.png", code: function openTaskManager() { console.log('Opening Task Manager...'); } },
        { name: "Terminal", icon: "https://img.icons8.com/color/1500/console.png", code: function openTerminal() { console.log('Opening Terminal...'); } },
        { name: "Trash", icon: "https://img.icons8.com/color/1500/trash.png", code: function openTrash() { console.log('Opening Trash...'); } },
        // Add more programs as needed
    ];

    const dockHeight = 50; // Adjust based on actual dock height

    // Function to handle icon click event
    function handleIconClick(icon, shiftKey, ctrlKey) {
        // Toggle the selection state of the clicked icon if Ctrl or Command key is pressed
        if (ctrlKey || (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            icon.classList.toggle("selected");
        } else {
            // Deselect all icons if Shift key is not pressed
            if (!shiftKey) {
                iconsContainer.querySelectorAll(".icon.selected").forEach(function(selected) {
                    selected.classList.remove("selected");
                });
            }
    
            // Handle shift-click selection
            if (shiftKey && selectedIcon) {
                const icons = Array.from(iconsContainer.querySelectorAll(".icon"));
                const startIndex = icons.indexOf(selectedIcon);
                const endIndex = icons.indexOf(icon);
                const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
                icons.slice(start, end + 1).forEach(function(icon) {
                    icon.classList.add("selected");
                });
            }
    
            // Select the clicked icon
            selectedIcon = icon;
            selectedIcon.classList.add("selected");
        }
    
        // Add your logic here for handling icon click event
    }
    
// Function to handle double click event on icons
function handleIconDoubleClick(icon) {
    icon.classList.add("active");

    const programName = icon.getAttribute("data-program-name");
    const programData = JSON.parse(localStorage.getItem(programName));
    if (programData) {
        openProgramWindow(programData);

        // Add icon to the dock with the same image as on the desktop
        const dock = document.getElementById("dock");
        const dockIcon = document.createElement("div");
        dockIcon.classList.add("dock-icon");
        dockIcon.style.backgroundImage = `url(${programData.icon})`; // Set the icon image
        dockIcon.addEventListener("click", function() {
            programWindow.style.display = "block";
            programWindow.classList.add("active");
            programWindow.classList.remove("minimized");
        });

        // Remove dock icon when program window is closed
        programWindow.addEventListener("close", function() {
            dock.removeChild(dockIcon);
        });

        dock.appendChild(dockIcon); // Add the dock icon
    } else {
        console.error("Program data not found for:", programName);
    }
}
    
    // Function to execute program logic based on program name
    function executeProgram(programName) {
        // Retrieve program data from localStorage
        const programData = JSON.parse(localStorage.getItem(programName));
        if (programData && programData.code) {
            // Execute the program logic
            eval(programData.code);
        } else {
            console.error("Program data not found for:", programName);
        }
    }
    
    // Add event listeners for single clicks on icons
    iconsContainer.addEventListener("click", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            // Determine whether Shift or Ctrl (or Command) key is pressed
            const shiftKey = event.shiftKey;
            const ctrlKey = navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey;
    
            // Handle single-click selection
            if (!shiftKey && !ctrlKey) {
                handleSingleClickSelection(icon);
            } else {
                // If Shift or Ctrl key is pressed, handle multiple selection
                handleIconClick(icon, shiftKey, ctrlKey);
            }
        }
    });
    
    // Add event listeners for double clicks on icons
    iconsContainer.addEventListener("dblclick", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            handleIconDoubleClick(icon);
        }
    });
    
    // Function to handle single click selection
    function handleSingleClickSelection(icon) {
        // Deselect all icons
        iconsContainer.querySelectorAll(".icon.selected").forEach(function(selected) {
            selected.classList.remove("selected");
        });
        // Select the clicked icon
        icon.classList.add("selected");
    }

    // Function to handle desktop click event (deselect icons)
    function handleDesktopClick() {
        if (selectedIcon) {
            selectedIcon.classList.remove("selected");
            selectedIcon = null;
        }
    }

    // Add event listener for desktop click
    desktop.addEventListener("click", handleDesktopClick);

    // Function to add an icon to the desktop
    function addIcon(iconSrc, iconName, programCode) {
        // Save program data to localStorage
        const programData = { name: iconName, icon: iconSrc, code: programCode.toString() };
        localStorage.setItem(iconName, JSON.stringify(programData));

        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon");
        iconContainer.setAttribute("data-program-name", iconName);
    
        const iconImage = document.createElement("img");
        iconImage.src = iconSrc;
        iconImage.alt = iconName;
        iconImage.draggable = false; // Disable image dragging
    
        const iconText = document.createElement("span");
        iconText.textContent = iconName;
    
        iconContainer.appendChild(iconImage);
        iconContainer.appendChild(iconText);
    
        // Calculate the position based on the number of existing icons
        const iconSize = 80; // Adjust as needed
        const margin = 24; // Adjust as needed
        const desktopRect = desktop.getBoundingClientRect();
        const columns = Math.floor((desktopRect.width - margin) / (iconSize + margin));
        const rows = Math.floor((desktopRect.height - dockHeight - margin) / (iconSize + margin));
        const existingIcons = iconsContainer.querySelectorAll(".icon").length;
        const col = Math.floor(existingIcons / rows);
        const row = existingIcons % rows;

        iconContainer.style.top = `${Math.max(row * (iconSize + margin), desktopRect.top)}px`;
        iconContainer.style.left = `${Math.max(col * (iconSize + margin), desktopRect.left)}px`;
    
        iconsContainer.appendChild(iconContainer);
    }

    // Add icons dynamically
    programs.forEach(program => {
        addIcon(program.icon, program.name, program.code);
    });

    // Variables to store the initial mouse position and the current mouse position during drag
    let initialX = 0;
    let initialY = 0;
    let currentX = 0;
    let currentY = 0;

    // Boolean variable to track whether the user is currently dragging to select icons
    let isDragging = false;

    // Function to add event listeners for mouse move and mouse up on the desktop
    function addDesktopEventListeners() {
        if (!desktop.dataset.desktopEventsAdded) {
            desktop.addEventListener("mousemove", handleDesktopMouseMove);
            desktop.addEventListener("mouseup", handleDesktopMouseUp);
            desktop.dataset.desktopEventsAdded = true;
        }
    }
    
    // Function to remove event listeners for mouse move and mouse up on the desktop
    function removeDesktopEventListeners() {
        desktop.removeEventListener("mousemove", handleDesktopMouseMove);
        desktop.removeEventListener("mouseup", handleDesktopMouseUp);
        delete desktop.dataset.desktopEventsAdded;
    }

    // Add event listener for mouse down on the desktop
    desktop.addEventListener("mousedown", handleDesktopMouseDown);
    
    // Function to handle mouse down event on the desktop (start of drag)
    function handleDesktopMouseDown(event) {
        // Check if the clicked element is an icon
        const clickedIcon = event.target.closest(".icon");
        if (!clickedIcon) {
            // Update initial mouse position
            initialX = event.clientX;
            initialY = event.clientY;
    
            // Update selection box position and size
            selectionBox.style.left = initialX + "px";
            selectionBox.style.top = initialY + "px";
            selectionBox.style.width = "0";
            selectionBox.style.height = "0";
    
            // Show the selection box
            selectionBox.style.display = "block";
    
            // Set isDragging to true
            isDragging = true;
    
            // Add event listeners for mouse move and mouse up on the desktop
            addDesktopEventListeners();
    
            // Prevent default behavior (e.g., text selection) when dragging
            event.preventDefault();
        }
    }
    
    // Add event listener for mouse down on the document (event delegation)
    document.addEventListener("mousedown", function(event) {
        // Check if the clicked element is an icon
        const icon = event.target.closest(".icon");
        if (icon) {
            // Start the drag operation
            startDrag(icon, event.clientX, event.clientY);
        }
    });
    
    // Function to start the drag operation
    function startDrag(icon, clientX, clientY) {
        // Calculate the offset between the cursor position and the top-left corner of the icon
        offsetX = clientX - parseInt(icon.style.left);
        offsetY = clientY - parseInt(icon.style.top);
    
        // Store the dragged icon
        draggedIcon = icon;
    
        // Update the z-index to bring the dragged icon to the front
        draggedIcon.style.zIndex = "999";
    
        // Disable text selection for the icon
        icon.style.userSelect = "none";
        icon.style.msUserSelect = "none";
        icon.style.webkitUserSelect = "none";
    
        // Add event listeners for mouse move and mouse up on the document level
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", endDrag);
    }
    
    // Function to move the icon to the cursor position
    function moveIconToCursor(clientX, clientY) {
        // Constrain the movement within the desktop area
        const desktopRect = desktop.getBoundingClientRect();
        const newX = Math.min(Math.max(clientX - offsetX, desktopRect.left), desktopRect.right - draggedIcon.offsetWidth);
        const newY = Math.min(Math.max(clientY - offsetY, desktopRect.top), desktopRect.bottom - draggedIcon.offsetHeight - dockHeight);
        
        draggedIcon.style.left = newX + "px";
        draggedIcon.style.top = newY + "px";
    }

    // Function to handle mouse move during drag
    function handleDrag(event) {
        const newX = event.clientX - offsetX;
        const newY = event.clientY - offsetY;

        // Update the position of the dragged icon
        draggedIcon.style.left = newX + "px";
        draggedIcon.style.top = newY + "px";
    }

    // Function to handle mouse up (end of drag)
    function endDrag() {
        // Remove event listeners for mouse move and mouse up
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", endDrag);

        // Snap the icon to the nearest grid spot
        const iconSize = 80; // Adjust as needed
        const margin = 24; // Adjust as needed
        const desktopRect = desktop.getBoundingClientRect();
        const columns = Math.floor((desktopRect.width - margin) / (iconSize + margin));
        const rows = Math.floor((desktopRect.height - dockHeight - margin) / (iconSize + margin));
        const maxValidX = (columns - 1) * (iconSize + margin) + desktopRect.left;
        const maxValidY = (rows - 1) * (iconSize + margin) + desktopRect.top;
        const snappedX = Math.round((parseInt(draggedIcon.style.left) - desktopRect.left) / (iconSize + margin)) * (iconSize + margin) + desktopRect.left;
        const snappedY = Math.round((parseInt(draggedIcon.style.top) - desktopRect.top) / (iconSize + margin)) * (iconSize + margin) + desktopRect.top;
        const adjustedSnappedX = Math.min(snappedX, maxValidX);
        const adjustedSnappedY = Math.min(snappedY, maxValidY);
        // Update icon position
        draggedIcon.style.left = `${Math.max(adjustedSnappedX, desktopRect.left)}px`;
        draggedIcon.style.top = `${Math.max(adjustedSnappedY, desktopRect.top)}px`;

        // Reset the z-index
        draggedIcon.style.zIndex = "auto";
    }

    // Function to handle mouse move event on the desktop (during drag)
    function handleDesktopMouseMove(event) {
        if (isDragging && draggedIcon) {
            const newX = event.clientX - offsetX;
            const newY = event.clientY - offsetY;
            draggedIcon.style.left = newX + "px";
            draggedIcon.style.top = newY + "px";
        }
    }

    // Function to handle mouse up event on the desktop (end of drag)
    function handleDesktopMouseUp() {
        if (isDragging) {
            isDragging = false;
            draggedIcon = null;
        }
    }

    // Function to handle mouse move event on the desktop (during drag)
    function handleDesktopMouseMove(event) {
        if (isDragging) {
            // Update current mouse position
            currentX = event.clientX;
            currentY = event.clientY;

            // Calculate selection box dimensions
            const width = Math.abs(currentX - initialX);
            const height = Math.abs(currentY - initialY);

            // Update selection box size and position
            selectionBox.style.width = width + "px";
            selectionBox.style.height = height + "px";
            selectionBox.style.left = Math.min(currentX, initialX) + "px";
            selectionBox.style.top = Math.min(currentY, initialY) + "px";

            // Highlight icons within the selection box
            highlightIconsWithinSelectionBox();
        }
    }

    // Add event listener for mouse move on the desktop
    desktop.addEventListener("mousemove", handleDesktopMouseMove);

    // Function to handle mouse up event on the desktop (end of drag)
    function handleDesktopMouseUp() {
        // Hide the selection box
        selectionBox.style.display = "none";

        // Reset isDragging to false
        isDragging = false;

        // Deselect any previously selected icon
        if (selectedIcon) {
            selectedIcon.classList.remove("selected");
            selectedIcon = null;
        }
    }

    // Function to highlight icons within the selection box
    function highlightIconsWithinSelectionBox() {
        const selectionRect = selectionBox.getBoundingClientRect();

        // Loop through all icons and check if they intersect with the selection box
        iconsContainer.querySelectorAll(".icon").forEach(function(icon) {
            const iconRect = icon.getBoundingClientRect();

            // Check if the icon intersects with the selection box
            const isIntersecting = !(iconRect.right < selectionRect.left || 
                                     iconRect.left > selectionRect.right || 
                                     iconRect.bottom < selectionRect.top || 
                                     iconRect.top > selectionRect.bottom);

            // Add/remove a CSS class to highlight the icon based on intersection
            if (isIntersecting) {
                icon.classList.add("selected");
            } else {
                icon.classList.remove("selected");
            }
        });
    }

    // Function to open programs as windows
    function openProgramWindow(programData) {
        const programWindow = document.createElement("div");
        programWindow.classList.add("program-window");

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        // Function to handle mouse down to enable window dragging
        function handleMouseDown(event) {
            isDragging = true;
            offsetX = event.clientX - programWindow.getBoundingClientRect().left;
            offsetY = event.clientY - programWindow.getBoundingClientRect().top;
            event.preventDefault(); // Prevent default to avoid any text selection
        }

        // Function to handle mouse move to handle window dragging
        function handleMouseMove(event) {
            if (isDragging) {
                programWindow.style.left = event.clientX - offsetX + "px";
                programWindow.style.top = event.clientY - offsetY + "px";
            }
        }

        // Function to handle mouse up to stop window dragging
        function handleMouseUp() {
            isDragging = false;
        }

        // Add event listeners for mouse down, move, and up
        programWindow.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        // create close, minimize, and maximize buttons
        const closeButton = createButton("Close", "close-button", function() {
            closeProgramWindow(programWindow, programData);
        });
        const minimizeButton = createButton("remove", "minimize-button", function() {
            programWindow.classList.add("minimized");
            programWindow.classList.remove("maximized");
        });
        const maximizeButton = createButton("expand_content", "maximize-button", function() {
            programWindow.classList.add("maximized");
            programWindow.classList.remove("minimized");
            const unmaximizeButton = createButton("collapse_content", "unmaximize-button", function() {
                programWindow.classList.remove("maximized");
                unmaximizeButton.parentNode.removeChild(unmaximizeButton);
            });
            programWindow.appendChild(unmaximizeButton);
        });

        // Append buttons to program window
        programWindow.appendChild(closeButton);
        programWindow.appendChild(minimizeButton);
        programWindow.appendChild(maximizeButton);

        // Create program content
        const programContent = document.createElement("div");
        programContent.textContent = "Program Content Here";
        programWindow.appendChild(programContent);
        
        // Append program window to desktop
        desktop.appendChild(programWindow);

        // Create dock icon
        const dockIcon = document.createElement("img");
        dockIcon.src = programData.icon;
        dockIcon.alt = programData.name;
        dockIcon.classList.add("dock-icon");
        dockIcon.style.width = "30px"; // Set the width
        dockIcon.style.height = "30px"; // Set the height

    // Add event listener to toggle window visibility and the "minimized" class
    dockIcon.addEventListener("click", function() {
        if (programWindow.classList.contains("minimized")) {
            programWindow.classList.remove("minimized");
        } else {
            programWindow.classList.add("minimized");
        }

    });

        // Append dock icon to dock
        dock.appendChild(dockIcon);
        // Store reference to dock icon in program data
        programData.dockIcon = dockIcon;

        return programWindow;
    }

    // Function to create a button element
    function createButton(text, className, clickHandler) {
        const button = document.createElement("button");
        button.textContent = text;
        button.classList.add(className);
        button.addEventListener("click", clickHandler);
        return button;
    }


    // Function to close program windows
    function closeProgramWindow(programWindow, programData) {
        programWindow.parentNode.removeChild(programWindow);
        // Remove dock icon
        if (programData.dockIcon) {
            programData.dockIcon.parentNode.removeChild(programData.dockIcon);
        }
    }

});
