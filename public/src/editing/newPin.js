import { onModeChange, getActivePin, activePinNew, setActivePin, Mode, setMode } from "../appState.js";
import { updatePinLabel, deletePin, attachPinInteraction } from "../map/pins.js";
import { closeEditing, flyTo } from "../map/camera.js";
import { createPin, updatePin, deletePin as deletePinFromDB } from "../map/api/client.js";

let panel       = null;
let headerTitle = null;
let titleEl     = null;
let descEl      = null;
let saveBtn     = null;
let closeBtn    = null;
let deleteBtn   = null;
let deleteConfirm = null;

// ─── Delete confirmation state ─────────────────────────────────────────────

let awaitingDeleteConfirm = false;

function setDeleteConfirmState(confirming) {
  awaitingDeleteConfirm = confirming;
  if (confirming) {
    deleteBtn.classList.add("panel-delete--confirm");
    deleteBtn.querySelector("img").style.display = "none";
    deleteBtn.querySelector(".panel-delete-label").textContent  = "Ești sigur?";
    deleteBtn.querySelector(".panel-delete-cancel").style.display = "flex";
  } else {
    deleteBtn.classList.remove("panel-delete--confirm");
    deleteBtn.querySelector("img").style.display = "block";
    deleteBtn.querySelector(".panel-delete-label").textContent  = "";
    deleteBtn.querySelector(".panel-delete-cancel").style.display = "none";
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initNewPinPanel(svg, panZoom) {
  const res  = await fetch("src/editing/newPin.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);

  panel       = document.getElementById("new-pin-panel");
  headerTitle = panel.querySelector(".panel-header-title");
  titleEl     = panel.querySelector(".panel-title");
  descEl      = panel.querySelector(".panel-description");
  saveBtn     = panel.querySelector(".panel-save");
  closeBtn    = panel.querySelector(".panel-close");
  deleteBtn   = panel.querySelector(".panel-delete");

  // Inject SVG dashed border on photos section
  const photosEl  = panel.querySelector(".panel-photos");
  const svgNS     = "http://www.w3.org/2000/svg";
  const borderSvg = document.createElementNS(svgNS, "svg");
  borderSvg.setAttribute("class", "panel-photos-border");
  borderSvg.setAttribute("aria-hidden", "true");
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "1"); rect.setAttribute("y", "1");
  rect.setAttribute("width", "100%"); rect.setAttribute("height", "100%");
  rect.setAttribute("rx", "10"); rect.setAttribute("ry", "10");
  rect.setAttribute("fill", "none");
  rect.setAttribute("stroke", "#8ab4cc");
  rect.setAttribute("stroke-width", "1.5");
  rect.setAttribute("stroke-dasharray", "16 6");
  borderSvg.appendChild(rect);
  photosEl.prepend(borderSvg);

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
        const group = document.querySelector(`[data-pin-id="${pin.id}"]`);
        if (group) attachPinInteraction(group, pin);
      } else {
        await updatePin(pin.id, { name: pin.name, description: pin.description, type: pin.type });
      }
    } catch (err) {
      console.error("[save] failed:", err);
      return;
    }
    closeEditing(true);
  });

  closeBtn.addEventListener("click", () => closeEditing(false));

  // Cancel the delete confirmation when the × inside the button is clicked
  deleteBtn.querySelector(".panel-delete-cancel").addEventListener("click", e => {
    e.stopPropagation();
    setDeleteConfirmState(false);
  });

  // Delete with in-panel confirmation
  deleteBtn.addEventListener("click", async () => {
    if (!awaitingDeleteConfirm) {
      setDeleteConfirmState(true);
      return;
    }
    const pin = getActivePin();
    if (!pin) return;
    try {
      await deletePinFromDB(pin.id);
    } catch (err) {
      console.error("[delete] failed:", err);
      setDeleteConfirmState(false);
      return;
    }
    deletePin(pin.id);
    closeEditing(true);
  });

  // Cancel confirmation on clicking elsewhere in the panel
  panel.addEventListener("click", e => {
    if (awaitingDeleteConfirm && !deleteBtn.contains(e.target)) {
      setDeleteConfirmState(false);
    }
  });

  // Cross-fade: start showing panel during the fly-in from selection mode
  document.addEventListener("editing:transition-start", e => {
    const pin   = e.detail;
    const isNew = false;
    titleEl.value  = pin?.name        || "";
    descEl.value   = pin?.description || "";
    headerTitle.textContent = "Editează";
    panel.classList.remove("panel--new");
    panel.classList.add("panel--existing");
    saveBtn.textContent = "Actualizează";
    setDeleteConfirmState(false);
    panel.classList.add("visible");
  });

  onModeChange(mode => {
    if (mode === Mode.EDITING) {
      // If panel already visible from editing:transition-start cross-fade, skip re-setup
      if (panel.classList.contains("visible")) return;
      const pin   = getActivePin();
      const isNew = activePinNew();
      titleEl.value  = pin?.name        || "";
      descEl.value   = pin?.description || "";
      headerTitle.textContent = isNew ? "Pin nou" : "Editează";
      panel.classList.toggle("panel--new",      isNew);
      panel.classList.toggle("panel--existing", !isNew);
      saveBtn.textContent = isNew ? "Salvează" : "Actualizează";
      setDeleteConfirmState(false);
      panel.classList.add("visible");
      titleEl.focus();
    } else {
      panel.classList.remove("visible");
      setDeleteConfirmState(false);
    }
  });

  // Store refs for use by viewPin edit transition
  panel._svg     = svg;
  panel._panZoom = panZoom;
}

// ─── Open existing pin for editing (called from viewPin edit button) ──────────

export function openPinForEdit(pin, svg, panZoom) {
  setActivePin(pin, false);
  // Signal both panels simultaneously before the camera moves:
  // viewPin fades out, newPin starts fading in — both during the fly.
  document.dispatchEvent(new CustomEvent("editing:transition-start", { detail: pin }));
  flyTo(svg, panZoom, { x: pin.x, y: pin.y }, () => setMode(Mode.EDITING));
}