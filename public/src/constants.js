// ─── Zoom ─────────────────────────────────────────────────────────────────────
// Maximum zoom during normal browsing (relative to initial fit).
export const MAX_ZOOM = 3;
// Zoom level the camera settles at after a pin fly-in (may exceed MAX_ZOOM).
export const PLACEMENT_ZOOM_LEVEL = 10;

// ─── Pin focus ────────────────────────────────────────────────────────────────
// Horizontal screen position the pin lands on after fly-in (fraction of width).
// 5/16 leaves the right half free for the editing panel.
export const PIN_FOCUS_X = 5 / 16;

// ─── Labels ───────────────────────────────────────────────────────────────────
export const LABEL_ZOOM_THRESHOLD = 1.5;
export const LABEL_STYLE = {
  lineHeight:        12,
  xOffset:          -15,
  baseY:             -8,
  maxWordsSingleLine: 3,
  maxWordsTwoLines:   4,
};