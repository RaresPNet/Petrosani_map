import { Pin, renderPin } from "./pins.js";
import { getSVGPoint, svgPointToScreen } from "./svgCoords.js";
import { setMode, getMode, canPlacePin } from "../appState.js";
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

  // --- toggle placement mode ---

  document.addEventListener("keydown", (e) => {
    if (e.key !== "p") return;

    const next = getMode() === "placing" ? "browse" : "placing";
    setMode(next);

    showNotification(
      next === "placing"
        ? "Pin placement mode ON"
        : "Pin placement mode OFF"
    );
  });

  // --- place pin ---

  svg.addEventListener("click", (e) => {
    if (!canPlacePin()) return;

    const point = getSVGPoint(e);

    const pin = new Pin({
      id: crypto.randomUUID(),
      name: "Introduceți numele locației",
      description: "",
      type: "normal",
      x: point.x,
      y: point.y,
    });

    const startZoom = panZoom.getZoom();
    const targetZoom = PLACEMENT_ZOOM_LEVEL;

    const duration = 500;
    const startTime = performance.now();

    let pinRendered = false;

    function animate(time) {
      const t = Math.min((time - startTime) / duration, 1);

      const eased =
        t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const zoom = startZoom + (targetZoom - startZoom) * eased;

      const screenPoint = svgPointToScreen(point.x, point.y);
      panZoom.zoomAtPoint(zoom, screenPoint);

      // render pin late in the animation
      if (!pinRendered && t > 0.6) {
        renderPin(pin);
        pinRendered = true;
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (!pinRendered) renderPin(pin);
        setMode("editing");
      }
    }

    requestAnimationFrame(animate);
  });

  // --- coordinate helper while placing ---

  svg.addEventListener("mousemove", (e) => {
    if (!canPlacePin()) {
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