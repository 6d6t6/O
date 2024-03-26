document.addEventListener("DOMContentLoaded", function() {
    // Select the desktop and icons container
    const desktop = document.getElementById("desktop");
    const iconsContainer = document.getElementById("desktop-icons");

    // Variable to store the currently selected icon
    let selectedIcon = null;

    // Function to handle icon click event
    function handleIconClick(icon) {
        // Deselect the previously selected icon
        if (selectedIcon) {
            selectedIcon.classList.remove("selected");
        }

        // Select the clicked icon
        selectedIcon = icon;
        selectedIcon.classList.add("selected");

        // Add your logic here for handling icon click event
    }

    // Add event listeners for icon clicks
    iconsContainer.addEventListener("click", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            handleIconClick(icon);
        }
    });

    // Function to handle double click event on icons
    function handleIconDoubleClick(icon) {
        // Add your logic here for handling icon double click event
    }

    // Add event listeners for double clicks on icons
    iconsContainer.addEventListener("dblclick", function(event) {
        const icon = event.target.closest(".icon");
        if (icon) {
            handleIconDoubleClick(icon);
        }
    });

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
    
        const iconText = document.createElement("span");
        iconText.textContent = iconName;
    
        iconContainer.appendChild(iconImage);
        iconContainer.appendChild(iconText);
    
        // Calculate the position based on the number of existing icons
        const iconSize = 80; // Adjust as needed
        const margin = 8; // Adjust as needed
        const maxIconsPerColumn = Math.floor(iconsContainer.offsetHeight / (iconSize + margin));
        const existingIcons = iconsContainer.querySelectorAll(".icon").length;
        const col = Math.floor(existingIcons / maxIconsPerColumn);
        const row = existingIcons % maxIconsPerColumn;
    
        iconContainer.style.top = row * (iconSize + margin) + "px";
        iconContainer.style.left = col * (iconSize + margin) + "px";
    
        iconsContainer.appendChild(iconContainer);
    }

    // Add icons dynamically
    addIcon("gfx/icons/internet.svg", "Internet");
    addIcon("gfx/icons/internet.svg", "Document");
    addIcon("gfx/icons/internet.svg", "Document");
    addIcon("gfx/icons/internet.svg", "Document");
    addIcon("gfx/icons/internet.svg", "Document");
    // Add more icons as needed
});

document.addEventListener("DOMContentLoaded", function() {
    // Select the desktop, icons container, and selection box
    const desktop = document.getElementById("desktop");
    const iconsContainer = document.getElementById("desktop-icons");
    const selectionBox = document.getElementById("selection-box");

    // Variables to store the initial mouse position and the current mouse position during drag
    let initialX = 0;
    let initialY = 0;
    let currentX = 0;
    let currentY = 0;

    // Boolean variable to track whether the user is currently dragging to select icons
    let isDragging = false;

    // Function to handle mouse down event on an icon (start of drag)
    function handleIconMouseDown(event) {
        draggedIcon = event.target.closest(".icon");
        if (draggedIcon) {
            initialX = event.clientX;
            initialY = event.clientY;
            const iconRect = draggedIcon.getBoundingClientRect();
            offsetX = initialX - iconRect.left;
            offsetY = initialY - iconRect.top;
            isDragging = true;
            event.preventDefault(); // Prevent default behavior (e.g., text selection) when dragging
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
        const iconRect = icon.getBoundingClientRect();
        const offsetX = clientX - iconRect.left;
        const offsetY = clientY - iconRect.top;
    
        // Update the z-index to bring the dragged icon to the front
        icon.style.zIndex = "999";
    
        // Add event listeners for mouse move and mouse up on the document level
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", endDrag);
    
        // Function to handle mouse move during drag
        function handleDrag(event) {
            const newX = event.clientX - offsetX;
            const newY = event.clientY - offsetY;
        
            // Calculate snapped position to grid
            const iconSize = 80; // Adjust as needed
            const margin = 8; // Adjust as needed
            const snappedX = Math.round(newX / (iconSize + margin)) * (iconSize + margin);
            const snappedY = Math.round(newY / (iconSize + margin)) * (iconSize + margin);
        
            icon.style.left = snappedX + "px";
            icon.style.top = snappedY + "px";
        }
    
        // Function to handle mouse up (end of drag)
        function endDrag() {
            // Remove event listeners for mouse move and mouse up
            document.removeEventListener("mousemove", handleDrag);
            document.removeEventListener("mouseup", endDrag);
    
            // Reset the z-index
            icon.style.zIndex = "auto";
        }
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
    
    // Add event listener for mouse move on the desktop
    desktop.addEventListener("mousemove", handleDesktopMouseMove);
    
    // Function to handle mouse up event on the desktop (end of drag)
    function handleDesktopMouseUp() {
        if (isDragging) {
            isDragging = false;
            draggedIcon = null;
        }
    }
    
    // Add event listener for mouse up on the desktop
    desktop.addEventListener("mouseup", handleDesktopMouseUp);


    // Function to handle mouse down event on the desktop (start of drag)
    function handleDesktopMouseDown(event) {
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

        // Prevent default behavior (e.g., text selection) when dragging
        event.preventDefault();
    }

    // Add event listener for mouse down on the desktop
    desktop.addEventListener("mousedown", handleDesktopMouseDown);

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

    // Add event listener for mouse up on the desktop
    desktop.addEventListener("mouseup", handleDesktopMouseUp);

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
});
