// Fullscreen photo gallery — dims the map, lets user page through images
// with keyboard arrows, on-screen arrows, or by clicking the ×.
// Clicking the dark backdrop also closes.

let root        = null;
let imgEl       = null;
let prevBtn     = null;
let nextBtn     = null;
let closeBtn    = null;
let counterEl   = null;
let captionEl   = null;
let creditEl    = null;
let editPanelEl  = null;
let editCreditEl = null;
let editDescEl   = null;
let editAuthorEl = null;
let editYearEl   = null;

let images       = [];
let index        = 0;
let isOpen       = false;
let editMode     = false;
let onSaveCallback = null;

function saveCurrentField() {
  if (!editMode) return;
  const entry = images[index];
  const description = editDescEl.value.trim() || null;
  const author      = editAuthorEl.value.trim() || null;
  const year        = editYearEl.value ? parseInt(editYearEl.value, 10) : null;

  if (description === entry.description && author === entry.author && year === entry.year) return;
  entry.description = description;
  entry.author      = author;
  entry.year        = year;
  onSaveCallback?.(entry.id, { description, author, year });
}

function render() {
  const { url, description, author, year } = images[index];
  imgEl.src = url;
  imgEl.alt = description || "";
  counterEl.textContent = images.length > 1 ? `${index + 1} / ${images.length}` : "";
  const multi = images.length > 1;
  prevBtn.style.display = multi ? "flex" : "none";
  nextBtn.style.display = multi ? "flex" : "none";

  if (editMode) {
    captionEl.style.display   = "none";
    creditEl.style.display    = "none";
    editPanelEl.style.display = "flex";
    editDescEl.value    = description || "";
    editAuthorEl.value  = author      || "";
    editYearEl.value    = year        ?? "";
    root.classList.add("lightbox--edit");
  } else {
    captionEl.textContent = description || "";
    captionEl.style.display = description ? "block" : "none";
    root.classList.toggle("has-caption", !!description);

    const credit = [author, year].filter(Boolean).join(" · ");
    creditEl.textContent = credit;
    creditEl.style.display = credit ? "block" : "none";

    editPanelEl.style.display = "none";
    root.classList.remove("lightbox--edit");
  }
}

function next() {
  if (images.length < 2) return;
  saveCurrentField();
  index = (index + 1) % images.length;
  render();
}

function prev() {
  if (images.length < 2) return;
  saveCurrentField();
  index = (index - 1 + images.length) % images.length;
  render();
}

function close() {
  if (!isOpen) return;
  saveCurrentField();
  isOpen    = false;
  editMode  = false;
  onSaveCallback = null;
  root.classList.remove("visible", "lightbox--edit", "has-caption");
  setTimeout(() => { if (!isOpen) imgEl.src = ""; }, 250);
}

function onKey(e) {
  if (!isOpen) return;
  if (e.key === "Escape")          { close(); e.preventDefault(); }
  else if (e.key === "ArrowRight") { next();  e.preventDefault(); }
  else if (e.key === "ArrowLeft")  { prev();  e.preventDefault(); }
}

function ensureMounted() {
  if (root) return;

  root = document.createElement("div");
  root.className = "lightbox";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Galerie foto");

  const backdrop = document.createElement("div");
  backdrop.className = "lightbox-backdrop";
  backdrop.addEventListener("click", close);

  const stage = document.createElement("div");
  stage.className = "lightbox-stage";
  stage.addEventListener("click", e => { if (e.target === stage) close(); });

  imgEl = document.createElement("img");
  imgEl.className = "lightbox-img";
  imgEl.addEventListener("click", e => e.stopPropagation());

  prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "lightbox-nav lightbox-nav--prev";
  prevBtn.setAttribute("aria-label", "Fotografia anterioară");
  prevBtn.innerHTML = `
    <svg viewBox="0 0 40 40" width="28" height="28" fill="none"
         stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="24,8 12,20 24,32"/>
    </svg>`;
  prevBtn.addEventListener("click", e => { e.stopPropagation(); prev(); });

  nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "lightbox-nav lightbox-nav--next";
  nextBtn.setAttribute("aria-label", "Fotografia următoare");
  nextBtn.innerHTML = `
    <svg viewBox="0 0 40 40" width="28" height="28" fill="none"
         stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16,8 28,20 16,32"/>
    </svg>`;
  nextBtn.addEventListener("click", e => { e.stopPropagation(); next(); });

  closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lightbox-close";
  closeBtn.setAttribute("aria-label", "Închide galeria");
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
         stroke="white" stroke-width="2.5" stroke-linecap="round">
      <line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>
    </svg>`;
  closeBtn.addEventListener("click", e => { e.stopPropagation(); close(); });

  counterEl = document.createElement("div");
  counterEl.className = "lightbox-counter";

  captionEl = document.createElement("div");
  captionEl.className = "lightbox-caption";

  creditEl = document.createElement("div");
  creditEl.className = "lightbox-credit";

  // ── Edit panel ──────────────────────────────────────────────────────────────

  editPanelEl = document.createElement("div");
  editPanelEl.className = "lightbox-edit-panel";
  editPanelEl.addEventListener("click", e => e.stopPropagation());

  editDescEl = document.createElement("textarea");
  editDescEl.className    = "lightbox-edit-desc";
  editDescEl.placeholder  = "Descriere...";
  editDescEl.rows         = 3;
  editDescEl.addEventListener("blur", saveCurrentField);

  const metaRow = document.createElement("div");
  metaRow.className = "lightbox-edit-meta";

  const authorField = document.createElement("label");
  authorField.className = "lightbox-edit-field";
  authorField.textContent = "Autor";
  editAuthorEl = document.createElement("input");
  editAuthorEl.type        = "text";
  editAuthorEl.className   = "lightbox-edit-input";
  editAuthorEl.placeholder = "Autor...";
  editAuthorEl.addEventListener("blur", saveCurrentField);
  authorField.appendChild(editAuthorEl);

  const yearField = document.createElement("label");
  yearField.className = "lightbox-edit-field lightbox-edit-field--year";
  yearField.textContent = "An";
  editYearEl = document.createElement("input");
  editYearEl.type        = "number";
  editYearEl.className   = "lightbox-edit-input lightbox-edit-input--year";
  editYearEl.placeholder = "1924";
  editYearEl.min         = "1800";
  editYearEl.max         = "2100";
  editYearEl.addEventListener("blur", saveCurrentField);
  yearField.appendChild(editYearEl);

  metaRow.appendChild(authorField);
  metaRow.appendChild(yearField);
  editPanelEl.appendChild(editDescEl);
  editPanelEl.appendChild(metaRow);

  stage.appendChild(imgEl);
  root.appendChild(backdrop);
  root.appendChild(stage);
  root.appendChild(prevBtn);
  root.appendChild(nextBtn);
  root.appendChild(closeBtn);
  root.appendChild(counterEl);
  root.appendChild(captionEl);
  root.appendChild(creditEl);
  root.appendChild(editPanelEl);
  document.body.appendChild(root);

  document.addEventListener("keydown", onKey);
}

// Open gallery in view mode.
// imageData: [{ id, url, description, author, year }]
export function openGallery(imageData, startIndex = 0) {
  if (!imageData?.length) return;
  ensureMounted();
  images         = imageData.slice();
  index          = Math.max(0, Math.min(startIndex, images.length - 1));
  editMode       = false;
  onSaveCallback = null;
  isOpen         = true;
  render();
  void root.offsetWidth;
  root.classList.add("visible");
}

// Open gallery in edit mode. onSave(id, { description, author, year }) called on blur.
export function openGalleryEdit(imageData, startIndex = 0, onSave) {
  if (!imageData?.length) return;
  ensureMounted();
  images         = imageData.slice();
  index          = Math.max(0, Math.min(startIndex, images.length - 1));
  editMode       = true;
  onSaveCallback = onSave;
  isOpen         = true;
  render();
  void root.offsetWidth;
  root.classList.add("visible");
  // Focus description field
  setTimeout(() => editDescEl.focus(), 50);
}
