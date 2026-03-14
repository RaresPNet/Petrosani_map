import { onModeChange, getSelectedPin, Mode } from "../appState.js";
import { getOriginalPinColor } from "../map/pins.js";

let panel    = null;
let headerEl = null;
let titleEl  = null;
let descEl   = null;
let closeBtn = null;
let editBtn  = null;

export async function initViewPinPanel() {
  const res  = await fetch("src/selection/viewPin.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  panel    = document.getElementById("view-pin-panel");
  headerEl = panel.querySelector(".view-panel-header");
  titleEl  = panel.querySelector(".view-panel-title");
  descEl   = panel.querySelector(".view-panel-description");
  closeBtn = panel.querySelector(".view-panel-close");
  editBtn  = panel.querySelector(".view-panel-edit");

  // Route close/edit through document events to avoid double-module issues
  closeBtn.addEventListener("click", () =>
    document.dispatchEvent(new CustomEvent("selection:close"))
  );
  editBtn.addEventListener("click", () =>
    document.dispatchEvent(new CustomEvent("selection:edit"))
  );

  // Cross-fade: fade out when edit transition starts (before mode changes)
  document.addEventListener("editing:transition-start", () => {
    panel.classList.remove("visible");
  });

  // Inject SVG dashed border onto photo placeholder
  const photosEl  = panel.querySelector(".view-panel-photos");
  const svgNS     = "http://www.w3.org/2000/svg";
  const borderSvg = document.createElementNS(svgNS, "svg");
  borderSvg.setAttribute("class", "view-panel-photos-border");
  borderSvg.setAttribute("aria-hidden", "true");
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "1");
  rect.setAttribute("y", "1");
  rect.setAttribute("width",  "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("rx", "10");
  rect.setAttribute("ry", "10");
  rect.setAttribute("fill",             "none");
  rect.setAttribute("stroke",           "#8ab4cc");
  rect.setAttribute("stroke-width",     "1.5");
  rect.setAttribute("stroke-dasharray", "16 6");
  borderSvg.appendChild(rect);
  photosEl.prepend(borderSvg);

  onModeChange(mode => {
    if (mode === Mode.SELECTION) {
      const pin   = getSelectedPin();
      const color = getOriginalPinColor(pin?.id) || pin?.textColor || "#78909c";
      titleEl.textContent          = pin?.name        || "Fără nume";
      descEl.textContent           = pin?.description || "";
      descEl.style.display         = pin?.description ? "block" : "none";
      headerEl.style.backgroundColor = color;
      panel.classList.add("visible");
    } else {
      panel.classList.remove("visible");
    }
  });
}