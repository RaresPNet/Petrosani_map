import { initPinPlacement } from "./map/pins.js";
import { setupPanZoom } from "./map/panZoom.js";

fetch("map.svg")
  .then(r => r.text())
  .then(svgText => {
    const container = document.getElementById("map");
    container.innerHTML = svgText;

    const svg = container.querySelector("svg");

    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    setupPanZoom(svg);
    initPinPlacement(svg);
  });