/**
 * Property-based tests for Bird.getBoundingBox
 *
 * Feature: flappy-bird-game, Property 6: bounding box with margin has strictly smaller dimensions and is centered
 *
 * Validates: Requirement 4.3
 */

const fc = require('fast-check');
const { Bird } = require('../bird.js');

describe('Bird.getBoundingBox — Property 6 (partial)', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * Property 6 (partial): The bounding box with margin always has dimensions
   * strictly smaller than the full sprite and is centered within it.
   *
   * For any bird position (x, y), any radius > 0, and any margin where
   * 0 < margin < radius:
   *   1. box.width  < radius * 2  (strictly smaller than full sprite width)
   *   2. box.height < radius * 2  (strictly smaller than full sprite height)
   *   3. The center of the bounding box equals (bird.x, bird.y)
   *      i.e. box.x + box.width / 2  === bird.x
   *           box.y + box.height / 2 === bird.y
   */
  test(
    'bounding box with margin has strictly smaller dimensions and is centered within the full sprite',
    () => {
      fc.assert(
        fc.property(
          // x and y: any finite integer position
          fc.integer({ min: -10000, max: 10000 }),
          fc.integer({ min: -10000, max: 10000 }),
          // radius (>= 2) chained with a margin strictly between 0 and radius
          fc.integer({ min: 2, max: 500 }).chain((radius) =>
            fc.record({
              radius: fc.constant(radius),
              margin: fc.integer({ min: 1, max: radius - 1 }),
            })
          ),
          (x, y, { radius, margin }) => {
            const bird = new Bird(x, y, radius);
            const box = bird.getBoundingBox(margin);

            const fullWidth = radius * 2;
            const fullHeight = radius * 2;

            // 1. Width is strictly smaller than full sprite width
            expect(box.width).toBeLessThan(fullWidth);

            // 2. Height is strictly smaller than full sprite height
            expect(box.height).toBeLessThan(fullHeight);

            // 3. Center of bounding box equals bird position
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            expect(centerX).toBe(x);
            expect(centerY).toBe(y);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
