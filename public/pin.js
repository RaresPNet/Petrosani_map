// ----- icon registry -----
export const ICONS = Object.freeze({
  camera: {
    icon: './photos/icons/camera.ico',
    textColor: '#f708ff'
  },
  church: {
    icon: './photos/icons/church.ico',
    textColor: '#7a2e2e'
  },
  hospital: {
    icon: './photos/icons/hospital.ico',
    textColor: '#b00020'
  },
  museum: {
    icon: './photos/icons/museum.ico',
    textColor: '#5a3e85'
  },
  pharmacy: {
    icon: './photos/icons/pharmacy.ico',
    textColor: '#1f8a4c'
  },
  restaurant: {
    icon: './photos/icons/restaurant.ico',
    textColor: '#b35c00'
  },
  school: {
    icon: './photos/icons/school.ico',
    textColor: '#2c5aa0'
  },
  shop: {
    icon: './photos/icons/shop.ico',
    textColor: '#6b4f2a'
  },
  stadium: {
    icon: './photos/icons/stadium.ico',
    textColor: '#0b6e4f'
  },
  train: {
    icon: './photos/icons/train.ico',
    textColor: '#444'
  },
  tree: {
    icon: './photos/icons/tree.ico',
    textColor: '#2f7d32'
  }
});

// ----- pin model -----
export class Pin {

  constructor({ id, name, type, x, y }) {
    this.id = id;
    this.name = name;
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

// ----- pin placement system -----
let svgElement = null;
let viewport = null;
let pinMode = false;
let pinLayer = null;
// initialize after SVG map loads
export function initPinPlacement(svg) {

  svgElement = svg;
  viewport = svg.querySelector('.svg-pan-zoom_viewport');
  pinLayer = svg.querySelector('#pin-layer');

  document.addEventListener("keydown", (e) => {
    if (e.key === "p") {
      pinMode = !pinMode;
      console.log("Pin placement:", pinMode ? "ON" : "OFF");
    }
  });

  svg.addEventListener("click", (e) => {

    if (!pinMode) return;

    const point = getSVGPoint(e);

    const pin = new Pin({
      id: crypto.randomUUID(),
      name: "test pin",
      type: "camera",
      x: point.x,
      y: point.y
    });

    renderPin(pin);

  });
}

// convert mouse → SVG coordinates
function getSVGPoint(event) {

  const pt = svgElement.createSVGPoint();

  pt.x = event.clientX;
  pt.y = event.clientY;

  // use viewport transform, not svg
  return pt.matrixTransform(
    viewport.getScreenCTM().inverse()
  );
}

// draw pin on map
function renderPin(pin) {

  const group = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );

  // position on map
  group.setAttribute(
    "transform",
    `translate(${pin.x}, ${pin.y})`
  );

  const content = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );

  content.classList.add("pin-content");

  const icon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "image"
  );

  icon.setAttribute("href", pin.icon);
  icon.setAttribute("width", 24);
  icon.setAttribute("height", 24);
  icon.setAttribute("x", -12);
  icon.setAttribute("y", -24);

  const label = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );

  label.textContent = pin.name;
  label.setAttribute("y", 6);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", "10");
  label.setAttribute("fill", pin.textColor);

  content.appendChild(icon);
  content.appendChild(label);

  group.appendChild(content);

  pinLayer.appendChild(group);
}