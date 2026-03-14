import { Pin, renderPin } from "./pins.js";
import { getSVGPoint } from "./svgCoords.js";
import { setMode, getMode, canPlacePin, setActivePin, Mode } from "../appState.js";
import { flyTo } from "./camera.js";

// ─── Notification ─────────────────────────────────────────────────────────────

function showNotification(text) {
  const el = document.getElementById("pin-notification");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}

// ─── Coord label ──────────────────────────────────────────────────────────────

function createCoordLabel() {
  const el = document.createElement("div");
  el.id = "coord-label";
  document.body.appendChild(el);
  return el;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initPinPlacement(svg, panZoom) {
  const coordLabel = createCoordLabel();

  // 'p' only toggles placement from browse — ignored in flying/editing
  document.addEventListener("keydown", e => {
    if (e.key !== "p") return;
    if (getMode() === Mode.BROWSE) {
      setMode(Mode.PLACING);
      showNotification("Pin placement mode ON");
    } else if (getMode() === Mode.PLACING) {
      setMode(Mode.BROWSE);
      showNotification("Pin placement mode OFF");
    }
  });

  // Drop a pin on click, then fly the camera to it
  svg.addEventListener("click", e => {
    if (!canPlacePin()) return;

    const svgPoint = getSVGPoint(e);
    const pin = new Pin({
      id:          crypto.randomUUID(),
      name:        "",
      description: "",
      type:        "normal",
      x:           svgPoint.x,
      y:           svgPoint.y,
    });

    renderPin(pin, true);
    setActivePin(pin, true);                        // true = new pin
    flyTo(svg, panZoom, svgPoint, () => setMode(Mode.EDITING));
  });

  // Coord readout while hovering in placement mode
  svg.addEventListener("mousemove", e => {
    if (!canPlacePin()) {
      coordLabel.style.display = "none";
      return;
    }
    const point = getSVGPoint(e);
    coordLabel.style.display = "block";
    coordLabel.style.left    = `${e.clientX + 16}px`;
    coordLabel.style.top     = `${e.clientY}px`;
    coordLabel.textContent   = `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
  });
}