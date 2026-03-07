// ----- tweakable limits -----
const LIMIT_LEFT = 0;
const LIMIT_RIGHT = 0;
const LIMIT_TOP = 0;
const LIMIT_BOTTOM = -50;
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
    panZoom.pan({ x: 0, y: -80 });

    // lock minimum zoom to initial fit
    const startZoom = panZoom.getZoom();
    panZoom.setMinZoom(startZoom);
  });