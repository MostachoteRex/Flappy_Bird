// bird.js — Bird entity

class Bird {
  /**
   * @param {number} x - Horizontal position (fixed during game)
   * @param {number} y - Initial vertical position
   * @param {number} radius - Radius for rendering and collision
   */
  constructor(x, y, radius) {
    this._initialX = x;
    this._initialY = y;
    this._initialRadius = radius;

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.velocity = 0;
  }

  /**
   * Restores the bird to its initial position and resets velocity to 0.
   */
  reset() {
    this.x = this._initialX;
    this.y = this._initialY;
    this.radius = this._initialRadius;
    this.velocity = 0;
  }

  /**
   * Returns an AABB bounding box centered on the bird, reduced by `margin`
   * pixels on each side for a forgiving hitbox.
   *
   * @param {number} margin - Pixels to reduce per side (e.g. 4)
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBoundingBox(margin) {
    const m = margin || 0;
    return {
      x: this.x - this.radius + m,
      y: this.y - this.radius + m,
      width: this.radius * 2 - m * 2,
      height: this.radius * 2 - m * 2,
    };
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Bird };
}
