import { MAX_ZOOM } from "../constants.js";

let limits = null;
let isZooming = false;
let zoomTimeout = null;
let isPinMode = false;

// --- Cursor ---

function setCursor(state) {
  document.body.classList.remove("panning", "zoom-in", "zoom-out", "pin-mode");
  if (state) document.body.classList.add(state);
}

let previousZoom = null;

function onZoomCursor(panZoom) {
  const zoom = panZoom.getZoom();
  const direction = previousZoom === null || zoom > previousZoom ? "zoom-in" : "zoom-out";
  previousZoom = zoom;

  setCursor(direction);
  clearTimeout(zoomTimeout);
  zoomTimeout = setTimeout(() => {
    previousZoom = null;
    setCursor(isPinMode ? "pin-mode" : null);
  }, 300);
}

// --- Pin mode toggle ---

window.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    isPinMode = !isPinMode;
    setCursor(isPinMode ? "pin-mode" : null);
  }
});

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

// --- Pin scale ---

export function updatePinScale(panZoom) {
  const zoom = panZoom.getZoom();
  const scale = 1 / zoom;

  document.querySelectorAll(".pin-content").forEach((el) => {
    el.setAttribute("transform", `scale(${scale})`);
  });
}

// --- Setup ---

export function setupPanZoom(svg) {
  // Pan cursor events
  svg.addEventListener("mousedown", () => {
    if (!isPinMode) setCursor("panning");
  });
  window.addEventListener("mouseup", () => {
    if (!isPinMode) setCursor(null);
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

    beforePan: (oldPan, newPan) => clampPan(panZoom, oldPan, newPan),

    onZoom: () => {
      computeLimits(panZoom);
      updatePinScale(panZoom);
      onZoomCursor(panZoom);
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