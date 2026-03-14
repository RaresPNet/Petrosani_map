import { initSVG, loadPins } from "./map/pins.js";
import { initSVGCoords } from "./map/svgCoords.js";
import { setupPanZoom } from "./map/camera.js";
import { initPinPlacement } from "./map/pinPlacement.js";
import { initNewPinPanel } from "./editing/newPin.js";

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

    await Promise.all([
      loadPins(),
      initNewPinPanel(),
    ]);

    initPinPlacement(svg, panZoom);
  });