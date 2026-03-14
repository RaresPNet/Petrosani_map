import { ICONS } from "./icons.js";
import { LABEL_STYLE } from "../constants.js";
import { fetchPins } from "./api/client.js";
import { onModeChange, getActivePin, getSelectedPin, setActivePin, setSelectedPin, Mode, getMode } from "../appState.js";

// ─── Pin model ────────────────────────────────────────────────────────────────

export class Pin {
  constructor({ id, name, description, type, x, y }) {
    this.id          = id;
    this.name        = name;
    this.description = description;
    this.type        = type;
    this.x           = x;
    this.y           = y;
  }

  get icon()      { return ICONS[this.type]?.icon      || ICONS.normal.icon; }
  get textColor() { return ICONS[this.type]?.textColor || "#78909c"; }
}

// ─── Type cycling ─────────────────────────────────────────────────────────────

const TYPE_KEYS = Object.keys(ICONS).filter(k => k !== "selected");

export function cycleType(pin, direction) {
  const idx = TYPE_KEYS.indexOf(pin.type);
  pin.type  = TYPE_KEYS[(idx + direction + TYPE_KEYS.length) % TYPE_KEYS.length];
}

// ─── Shared SVG refs ──────────────────────────────────────────────────────────

let svgElement  = null;
let pinLayer    = null;
let dimOverlay  = null;
let activeGroup = null;

// Set by initPinInteraction — called when an existing pin is clicked
let onPinClick = null;
export function setOnPinClick(fn) { onPinClick = fn; }

export function initSVG(svg) {
  svgElement = svg;
  pinLayer   = svg.querySelector("#pin-layer");
  console.log('[initSVG] pin-layer has', pinLayer.children.length, 'existing children');

  dimOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  dimOverlay.setAttribute("id",     "dim-overlay");
  dimOverlay.setAttribute("x",      "-10000");
  dimOverlay.setAttribute("y",      "-10000");
  dimOverlay.setAttribute("width",  "30000");
  dimOverlay.setAttribute("height", "30000");
  dimOverlay.setAttribute("fill",   "rgba(0,0,0,0.45)");
  dimOverlay.style.opacity       = "0";
  dimOverlay.style.transition    = "opacity 600ms ease";
  dimOverlay.style.pointerEvents = "none";
  pinLayer.parentNode.insertBefore(dimOverlay, pinLayer);

  onModeChange(mode => {
    if (mode === Mode.EDITING) {
      const pin   = getActivePin();
      activeGroup = pin ? pinLayer.querySelector(`[data-pin-id="${pin.id}"]`) : null;
      dimOverlay.style.opacity = "1";
      if (activeGroup) activeGroup.classList.add("pin-active");
    } else {
      dimOverlay.style.opacity = "0";
      if (activeGroup) activeGroup.classList.remove("pin-active");
      activeGroup = null;
    }
  });
}

// ─── Selection type swap ──────────────────────────────────────────────────────
// When a pin is selected, its icon swaps to 'selected'. The original type is
// stored as a data attribute on the group so it can be restored on deselect.

export function swapToSelectedType(pin) {
  const group = pinLayer.querySelector(`[data-pin-id="${pin.id}"]`);
  if (!group) return;
  // Guard: if already swapped, don't overwrite the stored original
  if (!group.hasAttribute("data-original-type")) {
    group.setAttribute("data-original-type",  pin.type);
    group.setAttribute("data-original-color", pin.textColor);
  }
  pin.type = "selected";
  updatePinVisual(pin);
}

export function restoreSelectedPinType() {
  const pin = getSelectedPin();
  if (!pin) return;
  const group = pinLayer.querySelector(`[data-pin-id="${pin.id}"]`);
  if (!group) return;
  const originalType = group.getAttribute("data-original-type");
  if (originalType) {
    pin.type = originalType;
    updatePinVisual(pin);
    group.removeAttribute("data-original-type");
    group.removeAttribute("data-original-color");
  }
}

// Returns the pre-selection textColor for a given pin id (used by viewPin panel)
export function getOriginalPinColor(pinId) {
  const group = pinLayer?.querySelector(`[data-pin-id="${pinId}"]`);
  return group?.getAttribute("data-original-color") || null;
}

export function deletePin(id) {
  const group = pinLayer.querySelector(`[data-pin-id="${id}"]`);
  if (group) group.remove();
}

export function updatePinVisual(pin) {
  const group = pinLayer.querySelector(`[data-pin-id="${pin.id}"]`);
  if (!group) return;
  const content = group.querySelector(".pin-content");
  const icon    = content.querySelector("image");
  if (icon) icon.setAttribute("href", pin.icon);
  const label = content.querySelector(".pin-label");
  if (label) label.style.setProperty("--label-color", pin.textColor);
}

export function updatePinLabel(pin) {
  const group = pinLayer.querySelector(`[data-pin-id="${pin.id}"]`);
  if (!group) return;
  const content  = group.querySelector(".pin-content");
  const oldLabel = content.querySelector(".pin-label");
  if (oldLabel) oldLabel.remove();
  if (pin.name.trim()) content.appendChild(makeLabel(pin));
}

// ─── Render ───────────────────────────────────────────────────────────────────

function svgEl(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

export function renderPin(pin, isNew = false) {
  const group = svgEl("g");
  group.setAttribute("transform",   `translate(${pin.x}, ${pin.y})`);
  group.setAttribute("data-pin-id",  pin.id);

  const content = svgEl("g");
  content.classList.add("pin-content");

  const icon = svgEl("image");
  icon.setAttribute("href",   pin.icon);
  icon.setAttribute("width",  24);
  icon.setAttribute("height", 24);
  icon.setAttribute("x", -12);
  icon.setAttribute("y", -24);

  content.appendChild(icon);
  if (pin.name) content.appendChild(makeLabel(pin));
  group.appendChild(content);
  pinLayer.appendChild(group);

  // Existing pins (loaded from DB) get hover + click interaction
  if (!isNew) attachPinInteraction(group, pin);
}

export function attachPinInteraction(group, pin) {
  group.classList.add("pin-interactive");

  let dragStartX = 0, dragStartY = 0;
  group.addEventListener("mousedown", e => { dragStartX = e.clientX; dragStartY = e.clientY; });
  group.addEventListener("click", e => {
    const m = getMode();
    if (m !== Mode.BROWSE && m !== Mode.SELECTION) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.sqrt(dx * dx + dy * dy) > 4) return;  // was a drag, not a click
    e.stopPropagation();
    if (onPinClick) onPinClick(pin);
  });
}

function makeLabel(pin) {
  const label = svgEl("text");
  label.classList.add("pin-label");
  label.style.setProperty("--label-color", pin.textColor);
  label.setAttribute("y", LABEL_STYLE.baseY);

  const words = pin.name.trim().split(/\s+/);
  let lines;

  if (words.length <= LABEL_STYLE.maxWordsSingleLine) {
    lines = [words.join(" ")];
  } else if (words.length <= LABEL_STYLE.maxWordsTwoLines) {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  } else {
    const third = Math.ceil(words.length / 3);
    lines = [
      words.slice(0, third).join(" "),
      words.slice(third, third * 2).join(" "),
      words.slice(third * 2).join(" "),
    ];
  }

  const offset = -((lines.length - 1) * LABEL_STYLE.lineHeight) / 2;
  lines.forEach((text, i) => {
    const tspan = svgEl("tspan");
    tspan.textContent = text;
    tspan.setAttribute("x",  LABEL_STYLE.xOffset);
    tspan.setAttribute("dy", i === 0 ? offset : LABEL_STYLE.lineHeight);
    label.appendChild(tspan);
  });

  return label;
}

// ─── Load pins from DB ────────────────────────────────────────────────────────

export async function loadPins() {
  const pins = await fetchPins();
  console.log('[loadPins] loaded', pins.length, 'pins from DB');
  pins.forEach(pin => console.log(`  [pin] "${pin.name}" (${pin.type}) @ ${pin.x.toFixed(1)}, ${pin.y.toFixed(1)}`));
  pins.forEach(pin => renderPin(pin, false));
}