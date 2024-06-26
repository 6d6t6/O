// Declare offsetX and offsetY as global variables
let offsetX = 0;
let offsetY = 0;

// IndexedDB Functions
let db; // Variable to hold the IndexedDB database instance

// Open the IndexedDB database
function openDatabase() {
    const request = indexedDB.open('FileSystemDB', 1);

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.errorCode);
    };

    request.onupgradeneeded = function(event) {
        const db = event.target.result;

        // Create an object store for files
        if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files', { keyPath: 'path' });
            filesStore.createIndex('name', 'name', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB opened successfully!');
    };
}

// Function to add file contents to IndexedDB
function addFileToIndexedDB(name, path, content) {
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    const file = { name, path, content };
    const request = store.add(file);

    request.onsuccess = function(event) {
        console.log('File added to IndexedDB successfully!');
    };

    request.onerror = function(event) {
        console.error('Error adding file to IndexedDB:', event.target.error);
    };
}

// Function to retrieve file contents from IndexedDB
function getFileFromIndexedDB(path, callback) {
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const request = store.get(path);

    request.onsuccess = function(event) {
        const file = event.target.result;
        if (file) {
            console.log('File retrieved from IndexedDB successfully!');
            callback(file.content);
        } else {
            console.error('File not found in IndexedDB.');
            callback(null);
        }
    };

    request.onerror = function(event) {
        console.error('Error retrieving file from IndexedDB:', event.target.error);
        callback(null);
    };
}

// Document Ready Function
document.addEventListener("DOMContentLoaded", function() {
    // Call openDatabase function when the document is loaded
    openDatabase();

    // Select the desktop and icons container
    const desktop = document.getElementById("desktop");
    const iconsContainer = document.getElementById("desktop-icons");
    const selectionBox = document.getElementById("selection-box");

    // Variable to store the currently selected icon
    let selectedIcon = null;

    // Variable to store whether the Shift key is pressed
    let shiftKeyPressed = false;

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
        // Add the "active" class to the double-clicked icon
        icon.classList.add("active");

        // Add your logic here for handling icon double click event
        console.log("Icon double-clicked:", icon.textContent); // Example: Log the icon's text content
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
    function addIcon(iconSrc, iconName) {
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon");

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
        const maxIconsPerColumn = Math.floor(iconsContainer.offsetHeight / (iconSize + margin));
        const existingIcons = iconsContainer.querySelectorAll(".icon").length;
        const col = Math.floor(existingIcons / maxIconsPerColumn);
        const row = existingIcons % maxIconsPerColumn;

        iconContainer.style.top = row * (iconSize + margin) + "px";
        iconContainer.style.left = col * (iconSize + margin) + "px";

        iconsContainer.appendChild(iconContainer);
    }

    // Add icons dynamically
    addIcon("https://img.icons8.com/color/1500/monitor.png", "My Device");
    addIcon("https://img.icons8.com/color/1500/folder-invoices.png", "Documents");
    addIcon("https://img.icons8.com/color/1500/geography.png", "Internet");
    addIcon("https://img.icons8.com/color/1500/heart-monitor.png", "Task Manager");
    addIcon("https://img.icons8.com/color/1500/console.png", "Terminal");
    addIcon("https://img.icons8.com/color/1500/trash.png", "Trash");
    // Add more icons as needed

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
        const newY = Math.min(Math.max(clientY - offsetY, desktopRect.top), desktopRect.bottom - draggedIcon.offsetHeight);

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
        const snappedX = Math.round(parseInt(draggedIcon.style.left) / (iconSize + margin)) * (iconSize + margin);
        const snappedY = Math.round(parseInt(draggedIcon.style.top) / (iconSize + margin)) * (iconSize + margin);

        draggedIcon.style.left = snappedX + "px";
        draggedIcon.style.top = snappedY + "px";

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
        const boxRect = selectionBox.getBoundingClientRect();
        const icons = Array.from(iconsContainer.querySelectorAll(".icon"));

        icons.forEach(function(icon) {
            const iconRect = icon.getBoundingClientRect();
            const isIntersecting = !(
                boxRect.right < iconRect.left ||
                boxRect.left > iconRect.right ||
                boxRect.bottom < iconRect.top ||
                boxRect.top > iconRect.bottom
            );

            if (isIntersecting) {
                icon.classList.add("selected");
            } else {
                icon.classList.remove("selected");
            }
        });
    }

    // Add event listener for keydown event
    document.addEventListener("keydown", function(event) {
        // Set shiftKeyPressed to true if the Shift key is pressed
        if (event.shiftKey) {
            shiftKeyPressed = true;
        }
    });

    // Add event listener for keyup event
    document.addEventListener("keyup", function(event) {
        // Set shiftKeyPressed to false if the Shift key is released
        if (!event.shiftKey) {
            shiftKeyPressed = false;
        }
    });

    // Add event listener for contextmenu event on the desktop (right-click)
    desktop.addEventListener("contextmenu", function(event) {
        // Prevent the default context menu from appearing
        event.preventDefault();

        // Add your custom context menu logic here
        console.log("Right-clicked on the desktop");
    });
});
