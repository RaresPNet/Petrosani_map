import { initSVG, loadPins, setOnPinClick } from "./map/pins.js";
import { initSVGCoords } from "./map/svgCoords.js";
import { setupPanZoom, flyTo } from "./map/camera.js";
import { initPinPlacement } from "./map/pinPlacement.js";
import { initPinArrows } from "./map/pinArrows.js";
import { initNewPinPanel } from "./editing/newPin.js";
import { setMode, Mode } from "./appState.js";

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
    initPinArrows();

    // Clicking an existing pin flies to it and opens the edit panel
    setOnPinClick(pin => {
      flyTo(svg, panZoom, { x: pin.x, y: pin.y }, () => setMode(Mode.EDITING));
    });
  });