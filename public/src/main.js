import { initPinPlacement } from "./map/pins.js";
import { INITIAL_Y_OFFSET } from "./constants.js";
import { setupPanZoom, updatePinScale } from "./map/panZoom.js";

fetch("map.svg")
  .then(r => r.text())
  .then(svgText => {
    const container = document.getElementById("map");
    container.innerHTML = svgText;

    const svg = container.querySelector("svg");

    const pinLayer = svg.querySelector("#pin-layer");

    const panZoom = setupPanZoom(svg);

    // initial positioning
    panZoom.resize();
    panZoom.fit();
    panZoom.center();

    // manual vertical adjustment
    panZoom.pan({ x: 0, y: INITIAL_Y_OFFSET });

    // lock minimum zoom to initial fit
    const startZoom = panZoom.getZoom();
    panZoom.setMinZoom(startZoom);

    // initialize pin placement after SVG is ready
    initPinPlacement(svg);

    // disable page scrolling
    document.body.style.overflow = 'hidden';

    updatePinScale(panZoom);
  });

