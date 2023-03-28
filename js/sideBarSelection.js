/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function toggleGraph() {
    document.getElementById("graph-selection").hidden = false;
    document.getElementById("color-selection").hidden = true;
}

function toggleColor() {
    document.getElementById("graph-selection").hidden = true;
    document.getElementById("color-selection").hidden = false;
}