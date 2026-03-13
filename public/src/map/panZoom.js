import { MAX_ZOOM, LABEL_ZOOM_THRESHOLD } from "../constants.js";
import { canPan, canZoom, getMode, onModeChange } from "../appState.js";

let limits = null;
let zoomTimeout = null;

// --- Cursor ---

function setCursor(state) {
  document.body.classList.remove("panning", "zoom-in", "zoom-out", "pin-mode");
  if (state) document.body.classList.add(state);
}

let previousZoom = null;

function onZoomCursor(panZoom) {
  const zoom = panZoom.getZoom();
  const direction =
    previousZoom === null || zoom > previousZoom ? "zoom-in" : "zoom-out";

  previousZoom = zoom;

  setCursor(direction);

  clearTimeout(zoomTimeout);
  zoomTimeout = setTimeout(() => {
    previousZoom = null;

    if (getMode() === "placing") setCursor("pin-mode");
    else setCursor(null);

  }, 150);
}

// --- Pan limits ---

function computeLimits(panZoom) {
  const sizes = panZoom.getSizes();

  const mapWidth = sizes.viewBox.width * sizes.realZoom;
  const mapHeight = sizes.viewBox.height * sizes.realZoom;

  limits = {
    left:   mapWidth  > sizes.width  ? 0                      : sizes.width  - mapWidth,
    right:  mapWidth  > sizes.width  ? sizes.width  - mapWidth : 0,
    top:    mapHeight > sizes.height ? 0                      : sizes.height - mapHeight,
    bottom: mapHeight > sizes.height ? sizes.height - mapHeight : 0,
  };
}

function clampPan(panZoom, oldPan, newPan) {
  if (!limits) return newPan;

  return {
    x: Math.max(limits.right, Math.min(limits.left, newPan.x)),
    y: Math.max(limits.bottom, Math.min(limits.top, newPan.y)),
  };
}

// --- Pin scaling ---

export function updatePinScale(panZoom) {
  const zoom = panZoom.getZoom();
  const scale = 1 / Math.min(zoom, MAX_ZOOM);

  document.querySelectorAll(".pin-content").forEach((el) => {
    el.setAttribute("transform", `scale(${scale})`);
  });
}

// --- Setup ---

export function setupPanZoom(svg) {

  svg.addEventListener("mousedown", () => {
    if (canPan()) setCursor("panning");
  });

  window.addEventListener("mouseup", () => {
    if (canPan()) setCursor(null);
  });

  onModeChange((mode) => {
    console.log("Mode:", mode);

    if (mode === "placing") setCursor("pin-mode");
    else setCursor(null);
  });

  let panZoom;

  panZoom = svgPanZoom(svg, {
    zoomEnabled: true,
    panEnabled: true,
    dblClickZoomEnabled: false,
    mouseWheelZoomEnabled: true,
    zoomScaleSensitivity: 0.2,
    fit: true,
    center: true,

    beforePan: (oldPan, newPan) => {
      console.log("beforePan called");
      console.log("oldPan:", oldPan);
      console.log("newPan:", newPan);
      console.log("canPan():", canPan());

      if (!canPan()) {
        console.log("Pan blocked by mode");
        return oldPan;
      }

      if (getMode() === "placing") {
        console.log("Pan allowed (no clamp)");
        return newPan;
      }

      const clamped = clampPan(panZoom, oldPan, newPan);
      console.log("Pan allowed:", clamped);
      return clamped;
    },

    onZoom: () => {
      const zoom = panZoom.getZoom();

      computeLimits(panZoom);
      updatePinScale(panZoom);
      onZoomCursor(panZoom);

      svg.classList.toggle("show-labels", zoom >= LABEL_ZOOM_THRESHOLD);

      panZoom.setMaxZoom(canZoom() ? MAX_ZOOM : 100);
    },
  });

  requestAnimationFrame(() => {
    panZoom.resize();
    panZoom.fit();
    panZoom.center();

    computeLimits(panZoom);

    panZoom.setMinZoom(panZoom.getZoom());
    panZoom.setMaxZoom(MAX_ZOOM);
  });

  return panZoom;
}