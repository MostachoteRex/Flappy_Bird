// pipe.js — Pipe entity

class Pipe {
  /**
   * @param {number} x           - Initial horizontal position (right edge of canvas)
   * @param {number} canvasHeight - Full canvas height (used for bottom pipe bounding box)
   * @param {number} gapY        - Y position where the gap starts
   * @param {number} gapHeight   - Height of the gap between top and bottom pipes (fixed: 150px)
   * @param {number} pipeWidth   - Width of the pipe (fixed: 60px)
   */
  constructor(x, canvasHeight, gapY, gapHeight, pipeWidth) {
    this.x = x;
    this.canvasHeight = canvasHeight;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = pipeWidth;
    this.scored = false;
  }

  /**
   * Returns the AABB bounding box for the top pipe segment.
   * The top pipe extends from y=0 down to y=gapY.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBoundingBoxTop() {
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.gapY,
    };
  }

  /**
   * Returns the AABB bounding box for the bottom pipe segment.
   * The bottom pipe starts at y=gapY+gapHeight and extends to canvasHeight.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBoundingBoxBottom() {
    return {
      x: this.x,
      y: this.gapY + this.gapHeight,
      width: this.width,
      height: this.canvasHeight - (this.gapY + this.gapHeight),
    };
  }

  /**
   * Returns true when the pipe has moved completely off the left edge of the canvas.
   *
   * @param {number} canvasWidth - Width of the canvas
   * @returns {boolean}
   */
  isOffScreen(canvasWidth) {
    return this.x + this.width < 0;
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Pipe };
}
