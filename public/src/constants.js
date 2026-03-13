// ----- tweakable limits -----
// adjust these values to fine-tune how close to the edge you can pan;
// negative values allow panning beyond the map's edge for padding
export const LIMIT_LEFT = 0;
export const LIMIT_RIGHT = -100;
export const LIMIT_TOP = 0;
export const LIMIT_BOTTOM = -80;
// initial vertical offset for centering the map (negative = shift up)
export const INITIAL_Y_OFFSET = -80;
// maximum zoom level (relative to initial fit)
export const MAX_ZOOM = 3;

export const LABEL_ZOOM_THRESHOLD = 1.5;
export const LABEL_STYLE = {
  lineHeight: 12,
  xOffset: -15,
  baseY: -8,
  maxWordsSingleLine: 3,
  maxWordsTwoLines: 4,
};

export const PLACEMENT_ZOOM_LEVEL = 10;