// returns a window with a document and an svg root node
const { createSVGWindow } = require("svgdom");
const window = createSVGWindow();
const document = window.document;
const { SVG, registerWindow } = require("@svgdotjs/svg.js");

// register window and document
registerWindow(window, document);

/**
 * Sets the width of an SVG from 100% to a pixel value.
 *
 * SVG from mermaids normally have the width=100% property.
 *
 * Most browsers will however default to width=300px if they see this,
 * which may cut wide SVGs.
 *
 * Because of this, `svgdom` is used to find and set the actual width
 * of the SVG, so that the browser renders the full-width.
 *
 * Please note that the actual width of an SVG will depend on the client renderer,
 * which may be slightly different from what is found by `svgdom`.
 *
 * @param {string} svgString - The SVG in string format.
 * @returns {string} The SVG, with a potentially edited width value.
 */
function setSvgBbox(svgString) {
  const svg = SVG(svgString);
  if (svg.node.getAttribute("width") === "100%") {
    const calculatedWidthInPixels = svg.bbox().width;
    if (calculatedWidthInPixels > 300) {
      // if width is less than 300, let browser default to 300px
      svg.node.setAttribute("width", calculatedWidthInPixels);
    }
  }
  return svg.svg();
}

module.exports = { setSvgBbox };
