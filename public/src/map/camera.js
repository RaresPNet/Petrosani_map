import {
  MAX_ZOOM, PLACEMENT_ZOOM_LEVEL, LABEL_ZOOM_THRESHOLD, PIN_FOCUS_X
} from "../constants.js";
import { canInteract, isFlying, getMode, onModeChange, Mode, setMode } from "../appState.js";

let limits = null;
let zoomCursorTimer = null;
let previousZoom = null;

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
  const scale = 1 / Math.min(panZoom.getZoom(), MAX_ZOOM);
  document.querySelectorAll(".pin-content").forEach(el =>
    el.setAttribute("transform", `scale(${scale})`)
  );
}

// ─── Fly-in animation ─────────────────────────────────────────────────────────
// Owned here because it is purely a camera operation.
// pinPlacement.js calls this after rendering the pin.
//
// panZoom.getZoom() is relative to the initial fit zoom, not absolute pixels.
// The actual pixel scale is: getZoom() * initialFitZoom.
// We read initialFitZoom from the viewport CTM so the pan formula uses
// the real scale, matching the coordinate space of getSVGPoint().
//
// To place svgPoint at screen position (tx, ty) at targetZoom:
//   targetPan = (tx, ty) - svgPoint * targetScale
// where targetScale = PLACEMENT_ZOOM_LEVEL * initialFitZoom (pixels/SVGunit)
//
// The pin is placed at (width/4, height/2) — left-centre — to leave room
// for the editing panel that will appear on the right.

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function flyTo(svg, panZoom, svgPoint, onComplete) {
  const startZoom = panZoom.getZoom();
  const startPan  = panZoom.getPan();

  const viewport        = svg.querySelector(".svg-pan-zoom_viewport");
  const initialFitZoom  = viewport.getScreenCTM().a / panZoom.getZoom();
  const targetScale     = PLACEMENT_ZOOM_LEVEL * initialFitZoom;

  // Place pin at left-centre: x = width/4, y = height/2
  const targetPan = {
    x: svg.clientWidth * PIN_FOCUS_X - svgPoint.x * targetScale,
    y: svg.clientHeight / 2 - svgPoint.y * targetScale,
  };

  const duration = 600;
  let startTime  = null;

  setMode(Mode.FLYING);
  panZoom.disablePan();
  panZoom.disableZoom();
  panZoom.disableMouseWheelZoom();
  panZoom.setMaxZoom(Infinity);

  function tick(now) {
    if (!startTime) startTime = now;
    const t     = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(t);

    // zoom() first, then pan() — zoom() adjusts pan to keep screen centre
    // fixed, pan() immediately overwrites with our target position.
    panZoom.zoom(startZoom + (PLACEMENT_ZOOM_LEVEL - startZoom) * eased);
    panZoom.pan({
      x: startPan.x + (targetPan.x - startPan.x) * eased,
      y: startPan.y + (targetPan.y - startPan.y) * eased,
    });

    if (t < 1) { requestAnimationFrame(tick); return; }

    panZoom.enablePan();
    panZoom.enableZoom();
    // Mousewheel stays disabled — onModeChange re-enables it on browse/placing.
    panZoom.setMaxZoom(MAX_ZOOM);
    updatePinScale(panZoom);
    onComplete();
  }

  requestAnimationFrame(tick);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupPanZoom(svg) {
  // Trackpad pinch-to-zoom fires as a wheel event with ctrlKey=true in most
  // browsers, bypassing svgPanZoom's disableMouseWheelZoom(). Block it at the
  // DOM level when interaction is not allowed.
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
      // Zoom-induced beforePan: svgPanZoom fires this on every wheel zoom to
      // adjust for cursor-relative zoom. No pan delta — pass through unchanged.
      if (oldPan.x === newPan.x && oldPan.y === newPan.y) return newPan;

      // Animation-driven pan: programmatic pan() also goes through beforePan.
      // Let it through — disablePan() only blocks user drag events.
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