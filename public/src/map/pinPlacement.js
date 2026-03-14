import { Pin, renderPin } from "./pins.js";
import { getSVGPoint } from "./svgCoords.js";
import { setMode, getMode, canPlacePin, Mode } from "../appState.js";
import { flyTo } from "./panZoom.js";

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

  // Toggle placement mode with 'p'
  document.addEventListener("keydown", e => {
    if (e.key !== "p") return;
    const next = getMode() === Mode.PLACING ? Mode.BROWSE : Mode.PLACING;
    setMode(next);
    showNotification(next === Mode.PLACING ? "Pin placement mode ON" : "Pin placement mode OFF");
  });

  // Drop a pin on click, then fly the camera to it
  svg.addEventListener("click", e => {
    if (!canPlacePin()) return;

    const svgPoint = getSVGPoint(e);
    const pin = new Pin({
      id:          crypto.randomUUID(),
      name:        "Introduceți numele locației",
      description: "",
      type:        "normal",
      x:           svgPoint.x,
      y:           svgPoint.y,
    });

    renderPin(pin); // pin appears immediately; camera flies to it next

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