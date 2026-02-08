window.onload = function() {
    const svgElement = document.getElementById('harta-svg');

    // Wait for the SVG to load fully
    svgElement.addEventListener('load', function() {
        const panZoomMap = svgPanZoom('#harta-svg', {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true
        });

        // Manual Zoom Controls
        document.getElementById('zoom-in').onclick = () => panZoomMap.zoomIn();
        document.getElementById('zoom-out').onclick = () => panZoomMap.zoomOut();

        // Load CSS from external file
        const svgDoc = svgElement.contentDocument;
        const link = svgDoc.createElement("link");
        link.rel = "stylesheet";
        link.href = "../style.css";
        svgDoc.head.appendChild(link);
    });
};