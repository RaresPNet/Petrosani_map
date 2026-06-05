// ─── Custom event names ───────────────────────────────────────────────────────
export const Events = Object.freeze({
  SELECTION_CLOSE:    "selection:close",
  SELECTION_EDIT:     "selection:edit",
  EDITING_TRANSITION: "editing:transition-start",
});

// ─── Zoom ─────────────────────────────────────────────────────────────────────
// Maximum zoom during normal browsing (relative to initial fit).
export const MAX_ZOOM = 12;
// Zoom level the camera settles at after a pin fly-in (may exceed MAX_ZOOM).
export const PLACEMENT_ZOOM_LEVEL = 10;

// ─── Pin focus ────────────────────────────────────────────────────────────────
// Horizontal screen position the pin lands on after fly-in (fraction of width).
// 5/16 leaves the right half free for the editing panel.
export const PIN_FOCUS_X = 5 / 16;

// ─── Labels ───────────────────────────────────────────────────────────────────
export const LABEL_ZOOM_THRESHOLD  = 1.5;
export const STREET_ZOOM_THRESHOLD    = 2.4;  // 20% of MAX_ZOOM
export const STREET_HI_ZOOM_THRESHOLD = 9.6;  // 80% of MAX_ZOOM
export const LABEL_STYLE = {
  lineHeight:         18,
  xOffset:           -14,
  baseY:             -10,
  maxWordsSingleLine:  3,
  maxWordsTwoLines:    4,
};