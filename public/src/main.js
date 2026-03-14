import { initSVG, loadPins, setOnPinClick, swapToSelectedType, restoreSelectedPinType } from "./map/pins.js";
import { initSVGCoords } from "./map/svgCoords.js";
import { setupPanZoom, flyToSelection, closeSelection } from "./map/camera.js";
import { initPinPlacement } from "./map/pinPlacement.js";
import { initPinArrows } from "./map/pinArrows.js";
import { initNewPinPanel, openPinForEdit } from "./editing/newPin.js";
import { initViewPinPanel } from "./selection/viewPin.js";
import { setMode, setSelectedPin, getSelectedPin, Mode } from "./appState.js";

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
      initNewPinPanel(svg, panZoom),
      initViewPinPanel(),
    ]);

    initPinPlacement(svg, panZoom);
    initPinArrows();

    // Clicking an existing pin: restore any previous selection, swap icon,
    // fly to right side, enter selection mode
    setOnPinClick(pin => {
      restoreSelectedPinType();
      setSelectedPin(pin);
      swapToSelectedType(pin);
      flyToSelection(svg, panZoom, { x: pin.x, y: pin.y }, () => {
        setMode(Mode.SELECTION);
      });
    });

    document.addEventListener("selection:close", () => closeSelection());
    document.addEventListener("selection:edit",  () => {
      const pin = getSelectedPin();
      if (!pin) return;
      restoreSelectedPinType();
      openPinForEdit(pin, svg, panZoom);
    });
  });