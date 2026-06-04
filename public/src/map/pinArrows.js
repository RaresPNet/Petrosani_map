import { setArrowHandlers } from "./pins.js";
import { cycleType, updatePinVisual, updatePinLabel } from "./pins.js";

function svgEl(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }

// Module-level so camera.js can hit-test and trigger them
let prevArrow    = null;
let nextArrow    = null;
let prevTrigger  = null;
let nextTrigger  = null;

export function getArrowHit(clientX, clientY) {
  for (const [arrow, which] of [[prevArrow, "prev"], [nextArrow, "next"]]) {
    if (!arrow) continue;
    const r = arrow.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom)
      return which;
  }
  return null;
}

export function triggerArrow(which) {
  if (which === "prev") prevTrigger?.();
  if (which === "next") nextTrigger?.();
}

function pulse(arrow) {
  // Animate the inner <g> (not the outer which holds the SVG transform attribute)
  // so the CSS scale animation doesn't clobber the translate positioning.
  const inner = arrow.querySelector(".pin-type-arrow-inner");
  inner.classList.remove("pin-type-arrow--pulsing");
  void inner.getBoundingClientRect();
  inner.classList.add("pin-type-arrow--pulsing");
  inner.addEventListener("animationend", () => inner.classList.remove("pin-type-arrow--pulsing"), { once: true });
}

function makeArrow(direction, toU) {
  // Outer <g>: holds the SVG position transform — never animated
  const outer = svgEl("g");
  outer.classList.add("pin-type-arrow-svg",
    direction === -1 ? "pin-type-arrow--prev" : "pin-type-arrow--next");

  // Icon in pin-content coords: x ∈ [-13, 12], y ∈ [-29, 0], centre y = -14.5
  // Move up by 85% of arrow height (52px) above icon centre
  const xPos = direction === -1 ? -13 - toU(30) : 12 + toU(30);
  const yPos = -14.5 - toU(52 * 0.2);   // -14.5 is pin-content units, not px
  outer.setAttribute("transform", `translate(${xPos}, ${yPos})`);

  // Inner <g>: holds visuals and receives the pulse animation
  const inner = svgEl("g");
  inner.classList.add("pin-type-arrow-inner");

  // Transparent hit area (32 × 52 screen px)
  const hit = svgEl("rect");
  hit.setAttribute("x",      `${toU(-16)}`);
  hit.setAttribute("y",      `${toU(-26)}`);
  hit.setAttribute("width",  `${toU(32)}`);
  hit.setAttribute("height", `${toU(52)}`);
  hit.setAttribute("fill",   "transparent");

  // Chevron (28 × 44 screen px)
  const hw = toU(14), hh = toU(22);
  const poly = svgEl("polyline");
  poly.setAttribute("points",
    direction === -1 ? `${hw},${-hh} ${-hw * 0.6},0 ${hw},${hh}`
                     : `${-hw},${-hh} ${hw * 0.6},0 ${-hw},${hh}`);
  poly.setAttribute("fill",            "none");
  poly.setAttribute("stroke",          "white");
  poly.setAttribute("stroke-width",    `${toU(7)}`);
  poly.setAttribute("stroke-linecap",  "round");
  poly.setAttribute("stroke-linejoin", "round");

  inner.appendChild(hit);
  inner.appendChild(poly);
  outer.appendChild(inner);
  return outer;
}

export function initPinArrows() {
  setArrowHandlers(
    (group, pin) => {
      const content = group.querySelector(".pin-content");
      if (!content) return;

      // Compute current px-per-pin-content-unit so arrows appear the right screen size
      const ctm = content.getScreenCTM();
      const pxPerUnit = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b);
      const toU = px => px / pxPerUnit;

      prevArrow = makeArrow(-1, toU);
      nextArrow = makeArrow(+1, toU);

      function makeHandler(arrow, delta) {
        return () => {
          cycleType(pin, delta);
          updatePinVisual(pin);
          updatePinLabel(pin);
          document.dispatchEvent(new CustomEvent("pin-type-changed", { detail: pin }));
          pulse(arrow);
        };
      }

      prevTrigger = makeHandler(prevArrow, -1);
      nextTrigger = makeHandler(nextArrow, +1);

      content.appendChild(prevArrow);
      content.appendChild(nextArrow);
    },
    (_group) => {
      prevArrow?.remove();   nextArrow?.remove();
      prevArrow  = null;     nextArrow  = null;
      prevTrigger = null;    nextTrigger = null;
    }
  );
}
