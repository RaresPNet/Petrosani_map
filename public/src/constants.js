// ─── Zoom ─────────────────────────────────────────────────────────────────────
// Maximum zoom during normal browsing (relative to initial fit).
export const MAX_ZOOM = 4;
// Zoom level the camera settles at after a pin fly-in (may exceed MAX_ZOOM).
export const PLACEMENT_ZOOM_LEVEL = 10;

// ─── Labels ───────────────────────────────────────────────────────────────────
export const LABEL_ZOOM_THRESHOLD = 1.5;
export const LABEL_STYLE = {
  lineHeight:        12,
  xOffset:          -15,
  baseY:             -8,
  maxWordsSingleLine: 3,
  maxWordsTwoLines:   4,
};