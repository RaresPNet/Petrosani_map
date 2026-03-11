import { MAX_ZOOM } from "../constants.js";

let limits = null;

function computeLimits(panZoom) {
  const sizes = panZoom.getSizes();
  const mapWidth = sizes.viewBox.width * sizes.realZoom;
  const mapHeight = sizes.viewBox.height * sizes.realZoom;

  limits = {
    left: mapWidth > sizes.width ? 0 : null,
    right: mapWidth > sizes.width ? sizes.width - mapWidth : null,
    top: mapHeight > sizes.height ? 0 : null,
    bottom: mapHeight > sizes.height ? sizes.height - mapHeight : null,
  };
}

function clampPan(panZoom, oldPan, newPan) {
  if (!limits) return newPan;

  return {
    x: limits.left === null
      ? newPan.x
      : Math.max(limits.right, Math.min(limits.left, newPan.x)),
    y: limits.top === null
      ? newPan.y
      : Math.max(limits.bottom, Math.min(limits.top, newPan.y)),
  };
}

export function updatePinScale(panZoom) {
  const zoom = panZoom.getZoom();
  const scale = 1 / zoom;

  document.querySelectorAll(".pin-content").forEach(el => {
    el.setAttribute("transform", `scale(${scale})`);
  });
}

export function setupPanZoom(svg) {

  let panZoom;

  panZoom = svgPanZoom(svg, {
    zoomEnabled: true,
    panEnabled: true,
    dblClickZoomEnabled: false,
    mouseWheelZoomEnabled: true,
    zoomScaleSensitivity: 0.2,
    fit: true,
    center: true,

    beforePan: (oldPan, newPan) =>
      clampPan(panZoom, oldPan, newPan),

    onZoom: () => {
      computeLimits(panZoom);
      updatePinScale(panZoom);
    }
  });

  requestAnimationFrame(() => {
    panZoom.resize();
    panZoom.fit();
    panZoom.center();

    computeLimits(panZoom);

    panZoom.setMinZoom(panZoom.getZoom());
    panZoom.setMaxZoom(MAX_ZOOM);
  });

  return panZoom;
}