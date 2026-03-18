const svgNS = "http://www.w3.org/2000/svg";

export function makeDashedBorder(className) {
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
