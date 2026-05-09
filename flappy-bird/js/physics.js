// physics.js — Physics Engine

class PhysicsEngine {
  /**
   * @param {number} gravity - Acceleration applied per frame (default: 0.5 px/frame²)
   * @param {number} jumpVelocity - Velocity assigned on jump (default: -8 px/frame)
   * @param {number} maxFallVelocity - Maximum downward velocity (default: 12 px/frame)
   */
  constructor(gravity = 0.28, jumpVelocity = -6, maxFallVelocity = 8) {
    this.gravity = gravity;
    this.jumpVelocity = jumpVelocity;
    this.maxFallVelocity = maxFallVelocity;
  }

  /**
   * Applies gravity to the bird's velocity (clamped to maxFallVelocity),
   * then updates the bird's Y position by the resulting velocity.
   *
   * @param {{ velocity: number, y: number }} bird
   */
  update(bird) {
    // Clamp velocity between -Infinity and maxFallVelocity (req 2.1, 2.4)
    bird.velocity = Math.min(bird.velocity + this.gravity, this.maxFallVelocity);
    // Update vertical position (req 2.3)
    bird.y += bird.velocity;
  }

  /**
   * Assigns jumpVelocity to the bird (req 2.2).
   *
   * @param {{ velocity: number }} bird
   */
  jump(bird) {
    bird.velocity = this.jumpVelocity;
  }

  /**
   * No internal state to reset.
   */
  reset() {
    // Nothing to reset
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhysicsEngine };
}
