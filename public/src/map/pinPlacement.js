import { Pin, renderPin } from "./pins.js";
import { getSVGPoint } from "./svgCoords.js";
import { setPlacementMode, isPlacementMode } from "../appState.js";
import { PLACEMENT_ZOOM_LEVEL } from "../constants.js";

function showNotification(text) {
  const el = document.getElementById("pin-notification");
  if (!el) return;

  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}

export function initPinPlacement(svg, panZoom) {

  const coordLabel = document.createElement("div");
  coordLabel.id = "coord-label";
  document.body.appendChild(coordLabel);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "p") return;

    const next = !isPlacementMode();
    setPlacementMode(next);

    showNotification(next ? "Pin placement mode ON" : "Pin placement mode OFF");
  });

  svg.addEventListener("click", (e) => {
    if (!isPlacementMode()) return;

    const point = getSVGPoint(e);

    const pin = new Pin({
      id: crypto.randomUUID(),
      name: "Introduceți numele locației",
      description: "",
      type: "normal",
      x: point.x,
      y: point.y,
    });

    renderPin(pin);

    const startZoom = panZoom.getZoom();
    const targetZoom = PLACEMENT_ZOOM_LEVEL;

    const duration = 400;
    const startTime = performance.now();

    const screenPoint = {
      x: e.clientX,
      y: e.clientY,
    };

    function animate(time) {
      const t = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      const zoom = startZoom + (targetZoom - startZoom) * eased;

      panZoom.zoomAtPoint(zoom, screenPoint);

      if (t < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });

  svg.addEventListener("mousemove", (e) => {
    if (!isPlacementMode()) {
      coordLabel.style.display = "none";
      return;
    }

    const point = getSVGPoint(e);

    coordLabel.style.display = "block";
    coordLabel.style.left = `${e.clientX + 16}px`;
    coordLabel.style.top = `${e.clientY}px`;
    coordLabel.textContent = `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
  });
}