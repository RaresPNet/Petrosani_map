import { uploadImage } from "../map/api/client.js";

const svgNS = "http://www.w3.org/2000/svg";

function makeDashedBorder(className) {
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x",                "1");
  rect.setAttribute("y",                "1");
  rect.setAttribute("width",            "100%");
  rect.setAttribute("height",           "100%");
  rect.setAttribute("rx",               "10");
  rect.setAttribute("ry",               "10");
  rect.setAttribute("fill",             "none");
  rect.setAttribute("stroke",           "#8ab4cc");
  rect.setAttribute("stroke-width",     "1.5");
  rect.setAttribute("stroke-dasharray", "16 6");
  svg.appendChild(rect);

  return svg;
}

// ─── Edit photos ───────────────────────────────────────────────────────────────
// Returns { element, reset, uploadAll }.
// uploadAll(pinId) — uploads all pending files, returns when all settle.
// reset()          — revokes object URLs and clears the grid (call on panel close).

export function makeEditPhotos() {
  // { file, objectUrl, card, overlay }
  const pending = [];

  // ── Root ──────────────────────────────────────────────────────────────────

  const wrapper = document.createElement("div");
  wrapper.className = "photos-edit";
  wrapper.appendChild(makeDashedBorder("photos-edit-border"));

  // ── Thumbnail grid (shown when has-photos) ────────────────────────────────

  const grid = document.createElement("div");
  grid.className = "photos-grid";
  wrapper.appendChild(grid);

  // "Add more" tile — always the last item in the grid
  const addMoreBtn = document.createElement("button");
  addMoreBtn.type = "button";
  addMoreBtn.className = "photos-add-more";
  addMoreBtn.setAttribute("aria-label", "Adaugă mai multe fotografii");
  addMoreBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`;
  addMoreBtn.addEventListener("click", e => { e.stopPropagation(); fileInput.click(); });
  grid.appendChild(addMoreBtn);

  // ── Empty state (icon + label, shown when no photos) ──────────────────────

  const emptyState = document.createElement("div");
  emptyState.className = "photos-empty-state";

  const emptyIcon = document.createElement("img");
  emptyIcon.className = "photos-empty-icon";
  emptyIcon.src = "./assets/icons/photos.ico";
  emptyIcon.width = 32;
  emptyIcon.height = 32;
  emptyIcon.alt = "";

  const emptyLabel = document.createElement("span");
  emptyLabel.className = "photos-empty-label";
  emptyLabel.textContent = "Adaugă fotografii";

  emptyState.appendChild(emptyIcon);
  emptyState.appendChild(emptyLabel);
  wrapper.appendChild(emptyState);

  // ── Hidden file input ─────────────────────────────────────────────────────

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = "image/*";
  fileInput.hidden = true;
  fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files));
    fileInput.value = "";
  });
  wrapper.appendChild(fileInput);

  // ── Click zone (not on X or add-more) opens picker ───────────────────────

  wrapper.addEventListener("click", e => {
    if (e.target.closest(".photos-thumb-remove")) return;
    if (e.target.closest(".photos-add-more"))    return;
    fileInput.click();
  });

  // ── Drag and drop ─────────────────────────────────────────────────────────

  wrapper.addEventListener("dragover", e => {
    e.preventDefault();
    wrapper.classList.add("drag-over");
  });

  wrapper.addEventListener("dragleave", e => {
    if (!wrapper.contains(e.relatedTarget)) wrapper.classList.remove("drag-over");
  });

  wrapper.addEventListener("drop", e => {
    e.preventDefault();
    wrapper.classList.remove("drag-over");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    addFiles(files);
  });

  // ── File handling ─────────────────────────────────────────────────────────

  function addFiles(files) {
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const objectUrl = URL.createObjectURL(file);
      const entry = { file, objectUrl, card: null, overlay: null };

      // Card
      const card = document.createElement("div");
      card.className = "photos-thumb";

      // Image — fades in once decoded
      const img = document.createElement("img");
      img.className = "photos-thumb-img";
      img.alt = file.name;
      img.src = objectUrl;
      img.addEventListener("load",  () => img.classList.add("loaded"));
      img.addEventListener("error", () => card.classList.add("photos-thumb--error"));

      // Overlay — spinner shown while image is loading, reused during upload
      const overlay = document.createElement("div");
      overlay.className = "photos-thumb-overlay";
      overlay.innerHTML = `
        <svg class="photos-thumb-spinner" viewBox="0 0 24 24" fill="none"
             stroke="white" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2 a10 10 0 0 1 10 10"/>
        </svg>`;

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "photos-thumb-remove";
      removeBtn.setAttribute("aria-label", "Elimină fotografia");
      removeBtn.innerHTML = "&#x2715;";
      removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        URL.revokeObjectURL(objectUrl);
        pending.splice(pending.indexOf(entry), 1);
        card.remove();
        syncEmptyState();
      });

      card.appendChild(img);
      card.appendChild(overlay);
      card.appendChild(removeBtn);
      entry.card    = card;
      entry.overlay = overlay;
      pending.push(entry);

      grid.insertBefore(card, addMoreBtn);
    });

    syncEmptyState();
  }

  function syncEmptyState() {
    wrapper.classList.toggle("has-photos", pending.length > 0);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  // Upload all pending files for the given pin, one request each (parallel).
  // Each card reflects its own upload state: uploading → done | error.
  async function uploadAll(pinId) {
    if (pending.length === 0) return;

    await Promise.allSettled(
      pending.map(async entry => {
        const { file, card, overlay } = entry;

        // Re-show overlay with spinner (uploading state)
        card.classList.add("photos-thumb--uploading");

        try {
          await uploadImage(pinId, file);
          card.classList.remove("photos-thumb--uploading");
          card.classList.add("photos-thumb--done");
          // Swap spinner for a checkmark
          overlay.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>`;
        } catch {
          card.classList.remove("photos-thumb--uploading");
          card.classList.add("photos-thumb--error");
          overlay.innerHTML = `<span style="font-size:18px;color:#fff;">&#x2715;</span>`;
        }
      })
    );
  }

  function reset() {
    pending.forEach(e => URL.revokeObjectURL(e.objectUrl));
    pending.length = 0;
    grid.querySelectorAll(".photos-thumb").forEach(el => el.remove());
    syncEmptyState();
  }

  return { element: wrapper, reset, uploadAll };
}

// ─── View photos (stub — will show gallery once upload is wired) ───────────────

export function makeViewPhotos() {
  const wrapper = document.createElement("div");
  wrapper.className = "photos-view";
  wrapper.appendChild(makeDashedBorder("photos-view-border"));

  const icon = document.createElement("img");
  icon.className = "photos-view-icon";
  icon.src = "./assets/icons/photos.ico";
  icon.width = 32;
  icon.height = 32;
  icon.alt = "";

  const label = document.createElement("span");
  label.className = "photos-view-label";
  label.textContent = "Fără fotografii";

  wrapper.appendChild(icon);
  wrapper.appendChild(label);

  return wrapper;
}
