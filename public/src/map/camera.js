import {
  MAX_ZOOM, PLACEMENT_ZOOM_LEVEL, LABEL_ZOOM_THRESHOLD, PIN_FOCUS_X,
} from "../constants.js";
import { canInteract, isFlying, getMode, getActivePin, getSelectedPin, activePinNew, onModeChange, Mode, setMode } from "../appState.js";
import { deletePin, restoreSelectedPinType } from "./pins.js";

let limits = null;
let zoomCursorTimer = null;
let previousZoom = null;

let _svg     = null;
let _panZoom = null;

// ─── Cursor ───────────────────────────────────────────────────────────────────

function setCursor(state) {
  document.body.classList.remove("panning", "zoom-in", "zoom-out", "pin-mode");
  if (state) document.body.classList.add(state);
}

function onZoomCursor(panZoom) {
  const zoom = panZoom.getZoom();
  setCursor(previousZoom === null || zoom > previousZoom ? "zoom-in" : "zoom-out");
  previousZoom = zoom;

  clearTimeout(zoomCursorTimer);
  zoomCursorTimer = setTimeout(() => {
    previousZoom = null;
    setCursor(getMode() === Mode.PLACING ? "pin-mode" : null);
  }, 150);
}

// ─── Pan limits ───────────────────────────────────────────────────────────────

function computeLimits(panZoom) {
  const { viewBox, realZoom, width, height } = panZoom.getSizes();
  const mapW = viewBox.width  * realZoom;
  const mapH = viewBox.height * realZoom;

  limits = {
    left:   mapW > width  ? 0            : width  - mapW,
    right:  mapW > width  ? width  - mapW : 0,
    top:    mapH > height ? 0            : height - mapH,
    bottom: mapH > height ? height - mapH : 0,
  };
}

function clampPan(_oldPan, newPan) {
  if (!limits) return newPan;
  return {
    x: Math.max(limits.right, Math.min(limits.left,  newPan.x)),
    y: Math.max(limits.bottom, Math.min(limits.top,  newPan.y)),
  };
}

// ─── Pin scaling ──────────────────────────────────────────────────────────────

export function updatePinScale(panZoom) {
  const zoom  = panZoom.getZoom();
  const scale = 1 / Math.min(zoom, MAX_ZOOM);
  document.querySelectorAll(".pin-content").forEach(el =>
    el.setAttribute("transform", `scale(${scale})`)
  );
}

// ─── Shared easing ────────────────────────────────────────────────────────────

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Core animation primitive ─────────────────────────────────────────────────

function animateCamera(panZoom, targetZoom, targetPan, duration, onComplete) {
  const startZoom = panZoom.getZoom();
  const startPan  = panZoom.getPan();
  let startTime   = null;

  function tick(now) {
    if (!startTime) startTime = now;
    const t     = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(t);

    panZoom.zoom(startZoom + (targetZoom - startZoom) * eased);
    panZoom.pan({
      x: startPan.x + (targetPan.x - startPan.x) * eased,
      y: startPan.y + (targetPan.y - startPan.y) * eased,
    });

    if (t < 1) { requestAnimationFrame(tick); return; }
    onComplete();
  }

  requestAnimationFrame(tick);
}

// ─── Fly-in ───────────────────────────────────────────────────────────────────
// targetZoom defaults to PLACEMENT_ZOOM_LEVEL.
// Pass a custom value (e.g. current zoom) to fly without zooming.

export function flyTo(svg, panZoom, svgPoint, onComplete, targetZoom = PLACEMENT_ZOOM_LEVEL) {
  const viewport       = svg.querySelector(".svg-pan-zoom_viewport");
  const initialFitZoom = viewport.getScreenCTM().a / panZoom.getZoom();
  const targetScale    = targetZoom * initialFitZoom;

  const targetPan = {
    x: (svg.clientWidth * PIN_FOCUS_X) - svgPoint.x * targetScale,
    y:  svg.clientHeight / 2           - svgPoint.y * targetScale,
  };

  setMode(Mode.FLYING);
  panZoom.disablePan();
  panZoom.disableZoom();
  panZoom.disableMouseWheelZoom();
  panZoom.setMaxZoom(Infinity);

  animateCamera(panZoom, targetZoom, targetPan, 600, () => {
    panZoom.enablePan();
    panZoom.enableZoom();
    panZoom.setMaxZoom(MAX_ZOOM);
    updatePinScale(panZoom);
    onComplete();
  });
}

// ─── Fly-to-selection ─────────────────────────────────────────────────────────
// Same as flyTo but places pin on the RIGHT side (mirrored PIN_FOCUS_X),
// preserves current zoom level, and re-enables pan/zoom after landing.

export function flyToSelection(svg, panZoom, svgPoint, onComplete) {
  const currentZoom    = panZoom.getZoom();
  const viewport       = svg.querySelector(".svg-pan-zoom_viewport");
  const initialFitZoom = viewport.getScreenCTM().a / currentZoom;
  const targetScale    = currentZoom * initialFitZoom;

  // Mirror PIN_FOCUS_X to the right side
  const targetPan = {
    x: (svg.clientWidth * (1 - PIN_FOCUS_X)) - svgPoint.x * targetScale,
    y:  svg.clientHeight / 2                 - svgPoint.y * targetScale,
  };

  setMode(Mode.FLYING);
  panZoom.disablePan();
  panZoom.disableZoom();
  panZoom.disableMouseWheelZoom();
  panZoom.setMaxZoom(Infinity);

  animateCamera(panZoom, currentZoom, targetPan, 600, () => {
    panZoom.enablePan();
    panZoom.enableZoom();
    panZoom.enableMouseWheelZoom();  // re-enable — selection allows pan/zoom
    panZoom.setMaxZoom(MAX_ZOOM);
    updatePinScale(panZoom);
    onComplete();
  });
}

// ─── Fly-out ──────────────────────────────────────────────────────────────────

export function flyOut(svgPoint) {
  const svg     = _svg;
  const panZoom = _panZoom;
  if (!svg || !panZoom) return;

  const viewport       = svg.querySelector(".svg-pan-zoom_viewport");
  const initialFitZoom = viewport.getScreenCTM().a / panZoom.getZoom();
  const targetScale    = MAX_ZOOM * initialFitZoom;

  const targetPan = {
    x: svg.clientWidth  / 2 - svgPoint.x * targetScale,
    y: svg.clientHeight / 2 - svgPoint.y * targetScale,
  };

  setMode(Mode.FLYING);
  panZoom.disablePan();
  panZoom.disableZoom();
  panZoom.disableMouseWheelZoom();
  panZoom.setMaxZoom(Infinity);

  animateCamera(panZoom, MAX_ZOOM, targetPan, 500, () => {
    panZoom.enablePan();
    panZoom.enableZoom();
    panZoom.enableMouseWheelZoom();
    panZoom.setMaxZoom(MAX_ZOOM);
    computeLimits(panZoom);
    updatePinScale(panZoom);
    setMode(Mode.BROWSE);
  });
}

// ─── Close selection ──────────────────────────────────────────────────────────

export function closeSelection() {
  if (getMode() !== Mode.SELECTION) return;
  restoreSelectedPinType();
  setMode(Mode.BROWSE);
}

// ─── Close editing ────────────────────────────────────────────────────────────

export function closeEditing(keep = false) {
  if (getMode() !== Mode.EDITING) return;
  const pin = getActivePin();
  if (!keep && activePinNew() && pin) deletePin(pin.id);
  if (pin) {
    flyOut({ x: pin.x, y: pin.y });
  } else {
    setMode(Mode.BROWSE);
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupPanZoom(svg) {
  _svg = svg;

  const clickOutside = document.createElement("div");
  clickOutside.id = "click-outside-overlay";
  clickOutside.style.cssText = `
    position: fixed; inset: 0;
    z-index: 5;
    display: none;
    cursor: default;
  `;
  document.body.appendChild(clickOutside);
  clickOutside.addEventListener("click", () => closeEditing());

  svg.addEventListener("wheel", e => {
    if (!canInteract()) e.preventDefault();
  }, { passive: false });

  svg.addEventListener("mousedown", () => { if (canInteract()) setCursor("panning"); });
  window.addEventListener("mouseup", () => { if (canInteract()) setCursor(null); });

  onModeChange(mode => {
    if (mode === Mode.PLACING) setCursor("pin-mode");
    else setCursor(null);
    if (mode === Mode.BROWSE || mode === Mode.PLACING) panZoom.enableMouseWheelZoom();
    if (mode === Mode.EDITING) panZoom.disableMouseWheelZoom();
    clickOutside.style.display = mode === Mode.EDITING ? "block" : "none";
  });

  const panZoom = svgPanZoom(svg, {
    zoomEnabled: true,
    panEnabled: true,
    dblClickZoomEnabled: false,
    mouseWheelZoomEnabled: true,
    zoomScaleSensitivity: 0.2,
    fit: true,
    center: true,

    beforePan(oldPan, newPan) {
      if (oldPan.x === newPan.x && oldPan.y === newPan.y) return newPan;
      if (isFlying()) return newPan;
      if (!canInteract()) return oldPan;
      return clampPan(oldPan, newPan);
    },

    onZoom() {
      computeLimits(panZoom);
      updatePinScale(panZoom);
      onZoomCursor(panZoom);
      svg.classList.toggle("show-labels", panZoom.getZoom() >= LABEL_ZOOM_THRESHOLD);
    },
  });

  _panZoom = panZoom;

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