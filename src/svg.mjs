import { createSVGWindow } from "svgdom";
import { SVG, registerWindow, namespaces } from "@svgdotjs/svg.js";

// returns a window with a document and an svg root node
const window = createSVGWindow();
const document = window.document;
// register window and document
registerWindow(window, document);

/**
 * Gets only the `<svg>` element from a HTML string.
 *
 * Sometimes `mermaid-cli` returns `<div><svg>...`, and we need to only
 * return the SVG element to be valid SVG.
 *
 * @param {string} string - The string to check if actually an SVG.
 * @throws {Error} Throws an error if the input string could not be converted to an `<svg`.
 * @returns {string} An SVG string starting with `<svg`.
 */
export function validSVG(string) {
  const svg = SVG(string);
  if (svg.node.nodeName !== "svg") {
    // if this is a `<div><svg> ...` return just the SVG.
    if (svg.node.childNodes.length === 1) {
      const actualSvgElement = svg.node.childNodes[0];
      if ("outerHTML" in actualSvgElement) {
        return validSVG(
          /** @type {Element} */ (svg.node.childNodes[0]).outerHTML,
        );
      }
    }
    throw new Error(
      `Parsing SVG failed: string seems to be a ${svg.node.nodeName}, not an SVG.`,
    );
  }
  return string;
}

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
export function setSvgBbox(svgString) {
  const svg = SVG(svgString);

  if (svg.node.getAttribute("width") === "100%") {
    const calculatedWidthInPixels = svg.bbox().width;
    if (calculatedWidthInPixels > 300) {
      // if width is less than 300, let browser default to 300px
      svg.node.setAttribute("width", `${calculatedWidthInPixels}`);
      if (!svg.attr("xmlns:svgjs")) {
        // this sometimes doesn't get set automatically
        // (maybe a bug in SVG.js?)
        svg.attr("xmlns:svgjs", namespaces.svgjs);
      }
      return svg.svg();
    }
  }

  return svgString;
}
