import { ICONS } from "./icons.js";
import { LABEL_STYLE } from "../constants.js";
import { fetchPins } from "./api/client.js";

// ----- pin model -----

export class Pin {
  constructor({ id, name, description, type, x, y }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.x = x;
    this.y = y;
  }

  get icon() {
    return ICONS[this.type]?.icon || ICONS.tree.icon;
  }

  get textColor() {
    return ICONS[this.type]?.textColor || '#000';
  }
}

// ----- shared SVG refs -----

let svgElement = null;
let pinLayer = null;

export function initSVG(svg) {
  svgElement = svg;
  pinLayer = svg.querySelector("#pin-layer");
}

// ----- render -----

export function renderPin(pin) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", `translate(${pin.x}, ${pin.y})`);

  const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
  content.classList.add("pin-content");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");
  icon.setAttribute("href", pin.icon);
  icon.setAttribute("width", 24);
  icon.setAttribute("height", 24);
  icon.setAttribute("x", -12);
  icon.setAttribute("y", -24);

  const label = makeLabel(pin);

  content.appendChild(icon);
  content.appendChild(label);
  group.appendChild(content);
  pinLayer.appendChild(group);
}

function makeLabel(pin) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

  label.classList.add("pin-label");
  label.style.setProperty("--label-color", pin.textColor);

  label.setAttribute("y", LABEL_STYLE.baseY);

  const words = pin.name.split(" ");
  let lines = [];

  if (words.length <= LABEL_STYLE.maxWordsSingleLine) {
    lines = [words.join(" ")];
  } else if (words.length <= LABEL_STYLE.maxWordsTwoLines) {
    const mid = Math.ceil(words.length / 2);
    lines = [
      words.slice(0, mid).join(" "),
      words.slice(mid).join(" "),
    ];
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
    tspan.setAttribute("x", LABEL_STYLE.xOffset);
    tspan.setAttribute("dy", i === 0 ? offset : LABEL_STYLE.lineHeight);
    label.appendChild(tspan);
  });

  return label;
}

// ----- load & render pins from DB -----

export async function loadPins() {
  const pins = await fetchPins();
  pins.map(data => new Pin(data)).forEach(renderPin);
}

// ----- pin placement mode (dev/testing) -----

function showNotification(text) {
  const el = document.getElementById("pin-notification");
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}

export function initPinMode() {
  let pinMode = false;

  const coordLabel = document.createElement("div");
  coordLabel.id = "coord-label";
  document.body.appendChild(coordLabel);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "p") return;
    pinMode = !pinMode;
    showNotification(pinMode ? "Pin placement mode ON" : "Pin placement mode OFF");
  });

  svgElement.addEventListener("click", (e) => {
    if (!pinMode) return;
    const point = getSVGPoint(e);
    const iconTypes = Object.keys(ICONS);
    const randomType = iconTypes[Math.floor(Math.random() * iconTypes.length)];

    const pin = new Pin({
      id: crypto.randomUUID(),
      name: "test pin",
      description: "test",
      type: randomType,
      x: point.x,
      y: point.y,
    });

    renderPin(pin);
  });

  svgElement.addEventListener("mousemove", (e) => {
    if (!pinMode) {
      coordLabel.style.display = "none";
      return;
    }
    const point = getSVGPoint(e);
    coordLabel.style.display = "block";
    coordLabel.style.left = `${e.clientX + 16}px`;
    coordLabel.style.top = `${e.clientY}px`;
    coordLabel.textContent = `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
  });
}