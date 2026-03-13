let placementMode = false;
const listeners = new Set();

export function setPlacementMode(value) {
  placementMode = value;
  listeners.forEach(fn => fn(placementMode));
}

export function isPlacementMode() {
  return placementMode;
}

export function onPlacementModeChange(fn) {
  listeners.add(fn);
}