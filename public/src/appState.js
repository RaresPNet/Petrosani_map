// ─── Mode enum ───────────────────────────────────────────────────────────────
// browse   — normal map interaction (pan, zoom, no pin placement)
// placing  — 'p' pressed, crosshair cursor, next click drops a pin
// flying   — camera animating to the dropped pin, all input locked
// editing  — pin centred on screen, input locked, detail panel open

export const Mode = Object.freeze({
  BROWSE:   "browse",
  PLACING:  "placing",
  FLYING:   "flying",
  EDITING:  "editing",
});

let mode = Mode.BROWSE;
const listeners = [];
document.body.classList.add(`mode-${Mode.BROWSE}`);

export function getMode()    { return mode; }

export function setMode(next) {
  if (next === mode) return;
  const prev = mode;
  mode = next;
  if (prev === Mode.EDITING) activePin = null;
  // Keep body class in sync so CSS can scope styles to current mode
  document.body.classList.remove(...Object.values(Mode).map(m => `mode-${m}`));
  document.body.classList.add(`mode-${next}`);
  listeners.forEach(fn => fn(mode));
}

export function onModeChange(fn) {
  listeners.push(fn);
}

// ─── Active pin ───────────────────────────────────────────────────────────────
// Stored here so modules that can't share a singleton (different import paths)
// can all read/write the same pin reference.

let activePin   = null;
let activePinIsNew = false;
export const getActivePin      = ()      => activePin;
export const activePinNew      = ()      => activePinIsNew;
export const setActivePin      = (pin, isNew = false) => {
  activePin      = pin;
  activePinIsNew = isNew;
};

// ─── Predicates ───────────────────────────────────────────────────────────────
// Import these instead of string-comparing getMode() at call sites.

export const canInteract  = () => mode === Mode.BROWSE || mode === Mode.PLACING;
export const canPlacePin  = () => mode === Mode.PLACING;
export const isFlying     = () => mode === Mode.FLYING;
export const isEditing    = () => mode === Mode.EDITING;