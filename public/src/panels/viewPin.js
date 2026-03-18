import { onModeChange, getSelectedPin, Mode } from "../appState.js";
import { getOriginalPinColor } from "../map/pins.js";
import { Events } from "../constants.js";
import { makeDashedBorder } from "../ui/dashedBorder.js";

let panel    = null;
let headerEl = null;
let titleEl  = null;
let descEl   = null;
let closeBtn = null;
let editBtn  = null;

export async function initViewPinPanel() {
  const res  = await fetch("src/panels/viewPin.html");
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
    document.dispatchEvent(new CustomEvent(Events.SELECTION_CLOSE))
  );
  editBtn.addEventListener("click", () =>
    document.dispatchEvent(new CustomEvent(Events.SELECTION_EDIT))
  );

  // Cross-fade: fade out when edit transition starts (before mode changes)
  document.addEventListener(Events.EDITING_TRANSITION, () => {
    panel.classList.remove("visible");
  });

  panel.querySelector(".view-panel-photos").prepend(makeDashedBorder("view-panel-photos-border"));

  onModeChange(mode => {
    if (mode === Mode.SELECTION) {
      const pin   = getSelectedPin();
      const color = getOriginalPinColor(pin?.id) || pin?.textColor || "#78909c";
      titleEl.textContent             = pin?.name        || "Fără nume";
      descEl.textContent              = pin?.description || "";
      descEl.style.display            = pin?.description ? "block" : "none";
      headerEl.style.backgroundColor = color;
      panel.classList.add("visible");
    } else {
      panel.classList.remove("visible");
    }
  });
}
