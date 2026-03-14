import { ICONS } from "./icons.js";
import { LABEL_STYLE } from "../constants.js";
import { fetchPins } from "./api/client.js";
import { onModeChange, getActivePin, Mode } from "../appState.js";

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

  get icon()      { return ICONS[this.type]?.icon      || ICONS.tree.icon; }
  get textColor() { return ICONS[this.type]?.textColor || "#000"; }
}

// ─── Shared SVG refs ──────────────────────────────────────────────────────────

let svgElement  = null;
let pinLayer    = null;
let dimOverlay  = null;
let activeGroup = null;

export function initSVG(svg) {
  svgElement = svg;
  pinLayer   = svg.querySelector("#pin-layer");

  dimOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  dimOverlay.setAttribute("id", "dim-overlay");
  dimOverlay.setAttribute("x", "-10000");
  dimOverlay.setAttribute("y", "-10000");
  dimOverlay.setAttribute("width",  "30000");
  dimOverlay.setAttribute("height", "30000");
  dimOverlay.setAttribute("fill", "rgba(0,0,0,0.45)");
  dimOverlay.style.opacity       = "0";
  dimOverlay.style.transition    = "opacity 600ms ease";
  dimOverlay.style.pointerEvents = "none";
  pinLayer.parentNode.insertBefore(dimOverlay, pinLayer);

  onModeChange(mode => {
    if (mode === Mode.EDITING) {
      const pin = getActivePin();
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




// ─── Label update — called live as the user types ─────────────────────────────

export function updatePinLabel(pin) {
  const group = pinLayer.querySelector(`[data-pin-id="${pin.id}"]`);
  if (!group) { console.warn('[updatePinLabel] group not found for pin', pin.id); return; }
  const content  = group.querySelector(".pin-content");
  const oldLabel = content.querySelector(".pin-label");
  if (oldLabel) oldLabel.remove();
  if (pin.name.trim()) content.appendChild(makeLabel(pin));
}

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderPin(pin) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", `translate(${pin.x}, ${pin.y})`);
  group.setAttribute("data-pin-id", pin.id);

  const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
  content.classList.add("pin-content");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");
  icon.setAttribute("href",   pin.icon);
  icon.setAttribute("width",  24);
  icon.setAttribute("height", 24);
  icon.setAttribute("x", -12);
  icon.setAttribute("y", -24);

  content.appendChild(icon);
  // Only render label if there's a name — placeholder text stays in the panel
  if (pin.name) content.appendChild(makeLabel(pin));
  group.appendChild(content);
  pinLayer.appendChild(group);
}

function makeLabel(pin) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
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
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
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
  pins.map(data => new Pin(data)).forEach(renderPin);
}