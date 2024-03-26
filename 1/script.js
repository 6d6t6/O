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
});
