let mode = "browse";
const listeners = new Set();

export function setMode(nextMode) {
  mode = nextMode;
  listeners.forEach(fn => fn(mode));
}

export function getMode() {
  return mode;
}

export function onModeChange(fn) {
  listeners.add(fn);
}


// --- permissions derived from mode ---

export function canPan() {
  return mode !== "editing";
}

export function canZoom() {
  return mode !== "editing";
}

export function canPlacePin() {
  return mode === "placing";
}

export function isEditing() {
  return mode === "editing";
}