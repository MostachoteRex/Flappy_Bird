// collision.js — Collision Detector

class CollisionDetector {
  /**
   * Hitbox margin applied on each side of the bird for visually fair collisions.
   * Req 4.3: 4px reduced hitbox on each side.
   */
  static HITBOX_MARGIN = 4;

  /**
   * Checks whether the bird has collided with any pipe or with the floor/ceiling.
   * Req 4.1: Evaluate collisions every frame while playing.
   * Req 4.4: Returns true when bird's collision rect intersects any active pipe rect.
   * Req 2.5/2.6: Returns true when bird goes below floor or above ceiling.
   *
   * @param {Bird} bird          - The bird entity
   * @param {Pipe[]} pipes       - Array of active pipe entities
   * @param {number} canvasHeight - Height of the canvas
   * @returns {boolean} true if a collision is detected
   */
  static check(bird, pipes, canvasHeight) {
    // Check floor/ceiling boundaries first (Req 2.5, 2.6)
    if (CollisionDetector._checkBoundaries(bird, canvasHeight)) {
      return true;
    }

    // Get the bird's reduced hitbox (Req 4.2, 4.3)
    const birdBox = bird.getBoundingBox(CollisionDetector.HITBOX_MARGIN);

    // Check each active pipe (Req 4.1, 4.4)
    for (const pipe of pipes) {
      if (CollisionDetector._aabbIntersects(birdBox, pipe.getBoundingBoxTop())) {
        return true;
      }
      if (CollisionDetector._aabbIntersects(birdBox, pipe.getBoundingBoxBottom())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Axis-Aligned Bounding Box intersection test.
   * Req 4.2: Use AABB collision detection.
   *
   * @param {{ x: number, y: number, width: number, height: number }} rectA
   * @param {{ x: number, y: number, width: number, height: number }} rectB
   * @returns {boolean} true if the two rectangles overlap
   */
  static _aabbIntersects(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  /**
   * Checks whether the bird has gone past the floor or ceiling.
   * Req 2.5: bird.y + bird.radius > canvasHeight → floor collision.
   * Req 2.6: bird.y - bird.radius < 0 → ceiling collision.
   *
   * @param {Bird} bird           - The bird entity
   * @param {number} canvasHeight - Height of the canvas
   * @returns {boolean} true if the bird is out of vertical bounds
   */
  static _checkBoundaries(bird, canvasHeight) {
    // Ceiling collision
    if (bird.y - bird.radius < 0) {
      return true;
    }
    // Floor collision
    if (bird.y + bird.radius > canvasHeight) {
      return true;
    }
    return false;
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollisionDetector;
}
