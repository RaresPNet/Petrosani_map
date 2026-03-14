// ─── Mode enum ────────────────────────────────────────────────────────────────
// browse    — normal map interaction (pan, zoom, no pin placement)
// placing   — 'p' pressed, crosshair cursor, click to drop pin
// flying    — camera animating, all input locked
// selection — pin selected, left panel visible, can still pan/zoom
// editing   — right panel open, input locked, type arrows visible

export const Mode = Object.freeze({
  BROWSE:    "browse",
  PLACING:   "placing",
  FLYING:    "flying",
  SELECTION: "selection",
  EDITING:   "editing",
});

let mode = Mode.BROWSE;
const listeners = [];
document.body.classList.add(`mode-${Mode.BROWSE}`);

export function getMode() { return mode; }

export function setMode(next) {
  const prev = mode;
  // Allow SELECTION→SELECTION so switching pins re-fires listeners
  if (next === mode && next !== Mode.SELECTION) return;
  mode = next;
  if (prev === Mode.EDITING)                                          activePin    = null;
  if (prev === Mode.SELECTION && next !== Mode.FLYING)                selectedPin  = null;
  document.body.classList.remove(...Object.values(Mode).map(m => `mode-${m}`));
  document.body.classList.add(`mode-${next}`);
  listeners.forEach(fn => fn(mode));
}

export function onModeChange(fn) { listeners.push(fn); }

// ─── Active pin (being edited — new or existing) ──────────────────────────────

let activePin         = null;
let activePinIsNew    = false;
let activePinSnapshot = null;

export const getActivePin = ()             => activePin;
export const activePinNew = ()             => activePinIsNew;
export const setActivePin = (pin, isNew = false) => {
  activePin         = pin;
  activePinIsNew    = isNew;
  // Snapshot original values so edits can be reverted on discard
  activePinSnapshot = isNew ? null : { name: pin.name, description: pin.description, type: pin.type };
};

export function revertActivePin() {
  if (!activePin || !activePinSnapshot) return;
  activePin.name        = activePinSnapshot.name;
  activePin.description = activePinSnapshot.description;
  activePin.type        = activePinSnapshot.type;
}

// ─── Selected pin (being viewed) ──────────────────────────────────────────────

let selectedPin = null;

export const getSelectedPin = ()    => selectedPin;
export const setSelectedPin = (pin) => { selectedPin = pin; };

// ─── Predicates ───────────────────────────────────────────────────────────────

export const canInteract  = () => mode === Mode.BROWSE || mode === Mode.PLACING || mode === Mode.SELECTION;
export const canPlacePin  = () => mode === Mode.PLACING;
export const isFlying     = () => mode === Mode.FLYING;
export const isEditing    = () => mode === Mode.EDITING;
export const isSelecting  = () => mode === Mode.SELECTION;