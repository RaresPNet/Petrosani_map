import { LIMIT_LEFT, LIMIT_RIGHT, LIMIT_TOP, LIMIT_BOTTOM } from "../constants.js";

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

// update pin scale based on zoom level
export function updatePinScale(panZoom) {
  const zoom = panZoom.getZoom();
  const scale = 1 / zoom;

  document.querySelectorAll(".pin-content")
    .forEach(el => {
      el.setAttribute("transform", `scale(${scale})`);
    });
}

// initialize and configure panZoom with clamping and scaling
export function setupPanZoom(svg) {
  const panZoom = svgPanZoom(svg, {
    zoomEnabled: true,
    panEnabled: true,
    dblClickZoomEnabled: false,
    mouseWheelZoomEnabled: true,
    zoomScaleSensitivity: 0.2,
    beforePan: (oldPan, newPan) => clampPan(panZoom, oldPan, newPan)
  });

  panZoom.setOnZoom(() => {
    updatePinScale(panZoom);
  });

  return panZoom;
}
