// Fullscreen photo gallery — dims the map, lets user page through images
// with keyboard arrows, on-screen arrows, or by clicking the ×.
// Clicking the dark backdrop also closes.

let root       = null;
let imgEl      = null;
let prevBtn    = null;
let nextBtn    = null;
let closeBtn   = null;
let counterEl  = null;

let urls   = [];
let index  = 0;
let isOpen = false;

function render() {
  imgEl.src = urls[index];
  imgEl.alt = "";
  counterEl.textContent = urls.length > 1 ? `${index + 1} / ${urls.length}` : "";
  const multi = urls.length > 1;
  prevBtn.style.display = multi ? "flex" : "none";
  nextBtn.style.display = multi ? "flex" : "none";
}

function next() {
  if (urls.length < 2) return;
  index = (index + 1) % urls.length;
  render();
}

function prev() {
  if (urls.length < 2) return;
  index = (index - 1 + urls.length) % urls.length;
  render();
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  root.classList.remove("visible");
  // Clear src after transition so we don't keep a big image in memory
  setTimeout(() => { if (!isOpen) imgEl.src = ""; }, 250);
}

function onKey(e) {
  if (!isOpen) return;
  if (e.key === "Escape")     { close(); e.preventDefault(); }
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
  // Clicks on the stage itself (outside the image) should also close
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

  stage.appendChild(imgEl);
  root.appendChild(backdrop);
  root.appendChild(stage);
  root.appendChild(prevBtn);
  root.appendChild(nextBtn);
  root.appendChild(closeBtn);
  root.appendChild(counterEl);
  document.body.appendChild(root);

  document.addEventListener("keydown", onKey);
}

// Open the gallery at `startIndex` with an ordered list of image URLs.
export function openGallery(imageUrls, startIndex = 0) {
  if (!imageUrls || imageUrls.length === 0) return;
  ensureMounted();
  urls  = imageUrls.slice();
  index = Math.max(0, Math.min(startIndex, urls.length - 1));
  isOpen = true;
  render();
  // Force reflow so the transition plays on first open
  void root.offsetWidth;
  root.classList.add("visible");
}
