import { uploadImage, fetchImageMeta, deleteImage, updateImageMeta } from "../map/api/client.js";
import { openGallery, openGalleryEdit } from "./lightbox.js";

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

// Shared: build a thumbnail card from a remote image URL.
// onRemove() is called when the X button is clicked.
function makeThumbCard(src, onRemove) {
  const card = document.createElement("div");
  card.className = "photos-thumb";

  const img = document.createElement("img");
  img.className = "photos-thumb-img";
  img.src = src;
  img.alt = "";
  img.addEventListener("load",  () => img.classList.add("loaded"));
  img.addEventListener("error", () => card.classList.add("photos-thumb--error"));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "photos-thumb-remove";
  removeBtn.setAttribute("aria-label", "Elimină fotografia");
  removeBtn.innerHTML = "&#x2715;";
  removeBtn.addEventListener("click", e => { e.stopPropagation(); onRemove(); });

  card.appendChild(img);
  card.appendChild(removeBtn);
  return card;
}

// ─── Edit photos ───────────────────────────────────────────────────────────────
// Returns { element, load, reset, uploadAll }.
//
// load(pinId)    — fetch existing DB images and show them (call on panel open).
// uploadAll(id)  — upload all pending files then settle.
// reset()        — clear everything; call on panel close.

export function makeEditPhotos() {
  const existing = []; // { id, card } — already in DB, X deletes immediately
  const pending  = []; // { file, objectUrl, card, overlay } — uploaded on save

  // ── Root ──────────────────────────────────────────────────────────────────

  const wrapper = document.createElement("div");
  wrapper.className = "photos-edit";
  wrapper.appendChild(makeDashedBorder("photos-edit-border"));

  // ── Thumbnail grid ────────────────────────────────────────────────────────

  const grid = document.createElement("div");
  grid.className = "photos-grid";
  wrapper.appendChild(grid);

  // "Add more" tile — always last in grid
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

  // ── Empty state ───────────────────────────────────────────────────────────

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

  // Click the empty area (not X or add-more) → open picker
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
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function syncEmptyState() {
    wrapper.classList.toggle("has-photos", existing.length > 0 || pending.length > 0);
  }

  // Add newly chosen local files as pending thumbnails
  function addFiles(files) {
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const objectUrl = URL.createObjectURL(file);
      const entry = { file, objectUrl, card: null, overlay: null };

      const card = document.createElement("div");
      card.className = "photos-thumb";

      const img = document.createElement("img");
      img.className = "photos-thumb-img";
      img.alt = file.name;
      img.src = objectUrl;
      img.addEventListener("load",  () => img.classList.add("loaded"));
      img.addEventListener("error", () => card.classList.add("photos-thumb--error"));

      const overlay = document.createElement("div");
      overlay.className = "photos-thumb-overlay";
      overlay.innerHTML = `
        <svg class="photos-thumb-spinner" viewBox="0 0 24 24" fill="none"
             stroke="white" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2 a10 10 0 0 1 10 10"/>
        </svg>`;

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

  // ── Public API ────────────────────────────────────────────────────────────

  // Fetch and display images already stored for this pin.
  async function load(pinId) {
    existing.forEach(e => e.card.remove());
    existing.length = 0;

    const meta = await fetchImageMeta(pinId);

    meta.forEach((m) => {
      const { id } = m;
      const card = makeThumbCard(`/api/images/${id}`, () => {
        deleteImage(id).catch(err => console.error("[delete image]", err));
        existing.splice(existing.findIndex(e => e.id === id), 1);
        card.remove();
        syncEmptyState();
      });

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "photos-thumb-edit";
      editBtn.setAttribute("aria-label", "Editează metadata fotografiei");
      editBtn.innerHTML = `<img src="./assets/icons/edit.ico" width="40" height="40" alt="" draggable="false" style="filter:invert(1);opacity:0.82">`;
      editBtn.addEventListener("click", e => {
        e.stopPropagation();
        const idx    = existing.findIndex(en => en.id === id);
        const images = existing.map(en => ({
          id:          en.id,
          url:         `/api/images/${en.id}`,
          description: en.description,
          author:      en.author,
          year:        en.year,
        }));
        openGalleryEdit(images, idx, async (imgId, fields) => {
          await updateImageMeta(imgId, fields).catch(err => console.error("[update meta]", err));
          const entry = existing.find(en => en.id === imgId);
          if (entry) Object.assign(entry, fields);
        });
      });
      card.appendChild(editBtn);

      existing.push({ id, card, description: m.description, author: m.author, year: m.year });
      const firstPending = pending[0]?.card ?? addMoreBtn;
      grid.insertBefore(card, firstPending);
    });

    syncEmptyState();
  }

  // Upload all pending files in parallel with per-card state feedback.
  // Throws if any upload fails so callers can keep the panel open on error.
  async function uploadAll(pinId) {
    if (pending.length === 0) return;

    const results = await Promise.allSettled(
      pending.map(async entry => {
        const { file, card, overlay } = entry;
        card.classList.add("photos-thumb--uploading");

        try {
          await uploadImage(pinId, file);
          card.classList.remove("photos-thumb--uploading");
          card.classList.add("photos-thumb--done");
          overlay.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                 stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>`;
        } catch (err) {
          card.classList.remove("photos-thumb--uploading");
          card.classList.add("photos-thumb--error");
          overlay.innerHTML = `<span style="font-size:18px;color:#fff;">&#x2715;</span>`;
          throw err;
        }
      })
    );

    const failed = results.filter(r => r.status === "rejected");
    if (failed.length) {
      throw new Error(`${failed.length} of ${results.length} image upload(s) failed`);
    }
  }

  function reset() {
    existing.forEach(e => e.card.remove());
    existing.length = 0;
    pending.forEach(e => URL.revokeObjectURL(e.objectUrl));
    pending.length = 0;
    grid.querySelectorAll(".photos-thumb").forEach(el => el.remove());
    syncEmptyState();
  }

  return { element: wrapper, load, reset, uploadAll };
}

// ─── View photos ───────────────────────────────────────────────────────────────
// Returns { element, load(pinId) }.
// load(pinId) — fetch and render images as a tight read-only grid.

export function makeViewPhotos() {
  const wrapper = document.createElement("div");
  wrapper.className = "photos-view";
  wrapper.appendChild(makeDashedBorder("photos-view-border"));

  // Empty state
  const emptyState = document.createElement("div");
  emptyState.className = "photos-view-empty";

  const emptyIcon = document.createElement("img");
  emptyIcon.className = "photos-view-icon";
  emptyIcon.src = "./assets/icons/photos.ico";
  emptyIcon.width = 32;
  emptyIcon.height = 32;
  emptyIcon.alt = "";

  const emptyLabel = document.createElement("span");
  emptyLabel.className = "photos-view-label";
  emptyLabel.textContent = "Fără fotografii";

  emptyState.appendChild(emptyIcon);
  emptyState.appendChild(emptyLabel);
  wrapper.appendChild(emptyState);

  // Image grid
  const grid = document.createElement("div");
  grid.className = "photos-view-grid";
  wrapper.appendChild(grid);

  async function load(pinId) {
    grid.innerHTML = "";
    wrapper.classList.remove("has-photos");

    const meta = await fetchImageMeta(pinId);
    const images = meta.map(m => ({
      id:          m.id,
      url:         `/api/images/${m.id}`,
      description: m.description || null,
      author:      m.author      || null,
      year:        m.year        || null,
    }));

    images.forEach(({ url }, i) => {
      const img = document.createElement("img");
      img.className = "photos-view-img";
      img.src = url;
      img.alt = "";
      img.addEventListener("click", () => openGallery(images, i));
      grid.appendChild(img);
    });

    wrapper.classList.toggle("has-photos", meta.length > 0);
  }

  return { element: wrapper, load };
}
