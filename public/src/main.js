import { initSVG, loadPins } from "./map/pins.js";
import { initSVGCoords } from "./map/svgCoords.js";
import { setupPanZoom } from "./map/panZoom.js";
import { initPinPlacement } from "./map/pinPlacement.js";

fetch("map.svg")
  .then(r => r.text())
  .then(async (svgText) => {
    const container = document.getElementById("map");
    container.innerHTML = svgText;

    const svg = container.querySelector("svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.removeAttribute("width");
    svg.removeAttribute("height");

    const panZoom = setupPanZoom(svg);

    initSVG(svg);
    initSVGCoords(svg);

    await loadPins();

    initPinPlacement(svg, panZoom);
  });