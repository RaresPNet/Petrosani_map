import { onModeChange, getActivePin, Mode } from "../appState.js";
import { updatePinLabel } from "../map/pins.js";

let panel   = null;
let titleEl = null;
let descEl  = null;
let saveBtn = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initNewPinPanel() {
  const res  = await fetch("src/editing/newPin.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  panel   = document.getElementById("new-pin-panel");
  titleEl = panel.querySelector(".panel-title");
  descEl  = panel.querySelector(".panel-description");
  saveBtn = panel.querySelector(".panel-save");

  // Live-sync title → pin label on the map
  titleEl.addEventListener("input", () => {
    const pin = getActivePin();
    if (!pin) return;
    pin.name = titleEl.value;
    updatePinLabel(pin);
  });

  saveBtn.addEventListener("click", () => {
    const pin = getActivePin();
    if (!pin) return;
    pin.name        = titleEl.value;
    pin.description = descEl.value;
    console.log("[pin]", pin);
  });

  onModeChange(mode => {
    if (mode === Mode.EDITING) {
      const pin     = getActivePin();
      titleEl.value = pin?.name        || "";
      descEl.value  = pin?.description || "";
      panel.classList.add("visible");
      titleEl.focus();
    } else {
      panel.classList.remove("visible");
    }
  });
}