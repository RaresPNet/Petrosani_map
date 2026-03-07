// ----- tweakable limits -----
// adjust these values to fine-tune how close to the edge you can pan;
// negative values allow panning beyond the map's edge for padding
const LIMIT_LEFT = 0;
const LIMIT_RIGHT = 0;
const LIMIT_TOP = 0;
const LIMIT_BOTTOM = -80;
// initial vertical offset for centering the map (negative = shift up)
const INITIAL_Y_OFFSET = -80;
// ----------------------------

// clamp panning so the map can't be dragged past its edges
function clampPan(panZoom, oldPan, newPan) {
  const sizes = panZoom.getSizes();

  const leftLimit =
    -(sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom +
    sizes.width +
    LIMIT_RIGHT;

  const rightLimit =
    -sizes.viewBox.x * sizes.realZoom +
    LIMIT_LEFT;

  const topLimit =
    -(sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom +
    sizes.height +
    LIMIT_BOTTOM;

  const bottomLimit =
    -sizes.viewBox.y * sizes.realZoom +
    LIMIT_TOP;

  return {
    x: Math.max(leftLimit, Math.min(rightLimit, newPan.x)),
    y: Math.max(topLimit, Math.min(bottomLimit, newPan.y))
  };
}

fetch("map.svg")
  .then(r => r.text())
  .then(svgText => {
    const container = document.getElementById("map");
    container.innerHTML = svgText;

    const svg = container.querySelector("svg");

    const panZoom = svgPanZoom(svg, {
      zoomEnabled: true,
      panEnabled: true,
      dblClickZoomEnabled: false,
      mouseWheelZoomEnabled: true,
      zoomScaleSensitivity: 0.2,
      beforePan: (oldPan, newPan) => clampPan(panZoom, oldPan, newPan)
    });

    // initial positioning
    panZoom.resize();
    panZoom.fit();
    panZoom.center();

    // manual vertical adjustment
    panZoom.pan({ x: 0, y: INITIAL_Y_OFFSET });

    // lock minimum zoom to initial fit
    const startZoom = panZoom.getZoom();
    panZoom.setMinZoom(startZoom);
  }).then(() => {
    document.body.style.overflow = 'hidden';
  });