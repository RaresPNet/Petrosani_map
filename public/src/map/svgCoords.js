let svgElement = null;
let viewport = null;

export function initSVGCoords(svg) {
  svgElement = svg;
  viewport = svg.querySelector(".svg-pan-zoom_viewport");
}

export function getSVGPoint(event) {
  const pt = svgElement.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;

  return pt.matrixTransform(viewport.getScreenCTM().inverse());
}

export function svgPointToScreen(x, y) {
  const pt = svgElement.createSVGPoint();
  pt.x = x;
  pt.y = y;

  return pt.matrixTransform(viewport.getScreenCTM());
}