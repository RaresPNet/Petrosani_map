import { onModeChange, getActivePin, activePinNew, Mode } from "../appState.js";
import { updatePinLabel, deletePin } from "../map/pins.js";
import { closeEditing } from "../map/camera.js";
import { createPin, updatePin, deletePin as deletePinFromDB } from "../map/api/client.js";

let panel     = null;
let titleEl   = null;
let descEl    = null;
let saveBtn   = null;
let closeBtn  = null;
let deleteBtn = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initNewPinPanel() {
  const res  = await fetch("src/editing/newPin.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  panel     = document.getElementById("new-pin-panel");
  titleEl   = panel.querySelector(".panel-title");
  descEl    = panel.querySelector(".panel-description");
  saveBtn   = panel.querySelector(".panel-save");
  closeBtn  = panel.querySelector(".panel-close");
  deleteBtn = panel.querySelector(".panel-delete");

  // Live-sync title → pin label on the map
  titleEl.addEventListener("input", () => {
    const pin = getActivePin();
    if (!pin) return;
    pin.name = titleEl.value;
    updatePinLabel(pin);
  });

  // Save / update
  saveBtn.addEventListener("click", async () => {
    const pin = getActivePin();
    if (!pin) return;
    pin.name        = titleEl.value;
    pin.description = descEl.value;
    try {
      if (activePinNew()) {
        await createPin(pin);
      } else {
        await updatePin(pin.id, { name: pin.name, description: pin.description, type: pin.type });
      }
    } catch (err) {
      console.error("[save] failed:", err);
      return;
    }
    closeEditing(true);
  });

  // X: discard — new pin gets deleted, existing pin changes are dropped
  closeBtn.addEventListener("click", () => closeEditing(false));

  // Delete: remove from DB and SVG
  deleteBtn.addEventListener("click", async () => {
    const pin = getActivePin();
    if (!pin) return;
    try {
      await deletePinFromDB(pin.id);
    } catch (err) {
      console.error("[delete] failed:", err);
      return;
    }
    deletePin(pin.id);
    closeEditing(true);   // keep=true so closeEditing doesn't try to delete again
  });

  onModeChange(mode => {
    if (mode === Mode.EDITING) {
      const pin  = getActivePin();
      const isNew = activePinNew();
      titleEl.value = pin?.name        || "";
      descEl.value  = pin?.description || "";
      panel.classList.toggle("panel--new",      isNew);
      panel.classList.toggle("panel--existing", !isNew);
      saveBtn.textContent = isNew ? "Salvează" : "Actualizează";
      panel.classList.add("visible");
      titleEl.focus();
    } else {
      panel.classList.remove("visible");
    }
  });
}