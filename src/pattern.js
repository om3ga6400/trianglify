import getScalingRatio from "./utils/getScalingRatio.js";

export default class Pattern {
  constructor(points, polys, opts) {
    this.points = points;
    this.polys = polys;
    this.opts = opts;
  }

  toCanvas(destCanvas, _canvasOpts = {}) {
    const canvasOpts = {
      scaling: "auto",
      applyCssScaling: true,
      ..._canvasOpts,
    };
    const { points, polys, opts } = this;

    const canvas = destCanvas || document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (canvasOpts.scaling) {
      const drawRatio =
        canvasOpts.scaling === "auto"
          ? getScalingRatio(ctx)
          : canvasOpts.scaling;

      if (drawRatio !== 1) {
        canvas.width = opts.width * drawRatio;
        canvas.height = opts.height * drawRatio;

        if (canvasOpts.applyCssScaling) {
          canvas.style.width = opts.width + "px";
          canvas.style.height = opts.height + "px";
        }
      } else {
        canvas.width = opts.width;
        canvas.height = opts.height;
        if (canvasOpts.applyCssScaling) {
          canvas.style.width = "";
          canvas.style.height = "";
        }
      }
      ctx.scale(drawRatio, drawRatio);
    }

    const drawPoly = (poly, fill, stroke) => {
      const vertexIndices = poly.vertexIndices;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[vertexIndices[0]][0], points[vertexIndices[0]][1]);
      ctx.lineTo(points[vertexIndices[1]][0], points[vertexIndices[1]][1]);
      ctx.lineTo(points[vertexIndices[2]][0], points[vertexIndices[2]][1]);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill.color.css();
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke.color.css();
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      }
    };

    if (opts.fill && opts.strokeWidth < 1) {
      polys.forEach((poly) =>
        drawPoly(poly, null, { color: poly.color, width: 2 }),
      );
    }

    polys.forEach((poly) =>
      drawPoly(
        poly,
        opts.fill && { color: poly.color },
        opts.strokeWidth > 0 && { color: poly.color, width: opts.strokeWidth },
      ),
    );

    return canvas;
  }
}
