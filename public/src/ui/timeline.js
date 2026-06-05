const START_YEAR = 1900;
const END_YEAR   = 2030;
const DATED_YEAR = 1910;  // year the current map is dated
const STEP       = 10;

const YEARS = [];
for (let y = START_YEAR; y <= END_YEAR; y += STEP) YEARS.push(y);

// horizontal padding (px) inside the track — matches arrow width in CSS
const PAD = 18;

let currentIndex = YEARS.indexOf(DATED_YEAR);

export function initTimeline() {
  const bar = document.createElement('div');
  bar.id = 'timeline';

  const track = document.createElement('div');
  track.className = 'timeline-track';

  const line = document.createElement('div');
  line.className = 'timeline-line';
  track.appendChild(line);

  // Arrows as triangle tips at both ends of the line
  const leftArrow  = makeArrow('left',  'Previous decade');
  const rightArrow = makeArrow('right', 'Next decade');
  track.append(leftArrow, rightArrow);

  bar.appendChild(track);
  document.body.appendChild(bar);

  requestAnimationFrame(() => {
    YEARS.forEach((year, i) => renderMark(track, year, i));
    const dial = renderDial(track);

    leftArrow.addEventListener('click',  () => step(-1, dial, track, leftArrow, rightArrow));
    rightArrow.addEventListener('click', () => step( 1, dial, track, leftArrow, rightArrow));
    updateArrows(leftArrow, rightArrow);

    track.addEventListener('click', e => {
      if (e.target === dial) return;
      const rect = track.getBoundingClientRect();
      const x    = Math.max(PAD, Math.min(e.clientX - rect.left, rect.width - PAD));
      const idx  = Math.max(0, Math.min(YEARS.length - 1,
        Math.round(((x - PAD) / (rect.width - PAD * 2)) * (YEARS.length - 1))
      ));
      if (idx === currentIndex) return;
      currentIndex = idx;
      dial.dataset.year = YEARS[currentIndex];
      dial.style.left   = xFor(track, currentIndex) + 'px';
      updateArrows(leftArrow, rightArrow);
      dispatchYearChange();
    });
  });
}

function makeArrow(dir, label) {
  const btn = document.createElement('button');
  btn.className = `timeline-arrow timeline-arrow--${dir}`;
  btn.setAttribute('aria-label', label);
  return btn;
}

function xFor(track, i) {
  return PAD + (i / (YEARS.length - 1)) * (track.clientWidth - PAD * 2);
}

function renderMark(track, year, i) {
  const mark = document.createElement('div');
  mark.className = 'timeline-mark' + (year === DATED_YEAR ? ' timeline-mark--dated' : '');
  mark.style.left = xFor(track, i) + 'px';

  const tick  = document.createElement('div');
  tick.className = 'timeline-tick';
  const label = document.createElement('span');
  label.className = 'timeline-label';
  label.textContent = year;

  mark.append(tick, label);
  track.appendChild(mark);
}

function renderDial(track) {
  const dial = document.createElement('div');
  dial.className = 'timeline-dial';
  dial.dataset.year = YEARS[currentIndex];
  dial.style.left = xFor(track, currentIndex) + 'px';
  track.appendChild(dial);

  let dragging = false;

  dial.addEventListener('pointerdown', e => {
    dragging = true;
    dial.classList.add('dragging');
    dial.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  dial.addEventListener('pointermove', e => {
    if (!dragging) return;
    const rect = track.getBoundingClientRect();
    const x    = Math.max(PAD, Math.min(e.clientX - rect.left, rect.width - PAD));
    const idx  = Math.max(0, Math.min(YEARS.length - 1,
      Math.round(((x - PAD) / (rect.width - PAD * 2)) * (YEARS.length - 1))
    ));
    if (idx !== currentIndex) {
      currentIndex = idx;
      dial.dataset.year = YEARS[currentIndex];
      dial.style.left   = xFor(track, currentIndex) + 'px';
      dispatchYearChange();
    }
  });

  dial.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    dial.classList.remove('dragging');
  });

  return dial;
}

function step(dir, dial, track, leftArrow, rightArrow) {
  const next = currentIndex + dir;
  if (next < 0 || next >= YEARS.length) return;
  currentIndex = next;
  dial.dataset.year = YEARS[currentIndex];
  dial.style.left   = xFor(track, currentIndex) + 'px';
  updateArrows(leftArrow, rightArrow);
  dispatchYearChange();
}

function updateArrows(leftArrow, rightArrow) {
  leftArrow.disabled  = currentIndex === 0;
  rightArrow.disabled = currentIndex === YEARS.length - 1;
}

function dispatchYearChange() {
  document.dispatchEvent(new CustomEvent('timeline:yearchange', {
    detail: { year: YEARS[currentIndex] },
  }));
}
