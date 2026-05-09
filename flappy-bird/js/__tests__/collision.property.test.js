/**
 * Property-based tests for CollisionDetector boundary collisions
 *
 * Feature: flappy-bird-game, Property 4: boundary collision detection
 *
 * Validates: Requirements 2.5, 2.6
 */

// Feature: flappy-bird-game, Property 4: boundary collision detection

const fc = require('fast-check');
const CollisionDetector = require('../collision.js');
const { Bird } = require('../bird.js');

describe('CollisionDetector — Property 4: canvas boundary collisions', () => {
  /**
   * **Validates: Requirements 2.5, 2.6**
   *
   * Property 4: For any bird position:
   *   - If bird.y + bird.radius > canvasHeight → floor collision (Req 2.5)
   *   - If bird.y - bird.radius < 0 → ceiling collision (Req 2.6)
   *   - If 0 <= bird.y - bird.radius AND bird.y + bird.radius <= canvasHeight
   *     → no boundary collision reported
   */

  test(
    'floor collision: bird.y + radius > canvasHeight always reports a collision',
    () => {
      fc.assert(
        fc.property(
          // Generate radius, canvasHeight, then y below the floor
          fc.integer({ min: 1, max: 50 }).chain((radius) =>
            fc.integer({ min: radius * 2 + 2, max: 2000 }).chain((canvasHeight) =>
              fc.record({
                radius: fc.constant(radius),
                canvasHeight: fc.constant(canvasHeight),
                // y must satisfy: y + radius > canvasHeight → y > canvasHeight - radius
                y: fc.integer({ min: canvasHeight - radius + 1, max: canvasHeight + 500 }),
              })
            )
          ),
          ({ radius, canvasHeight, y }) => {
            const bird = new Bird(80, y, radius);
            const result = CollisionDetector._checkBoundaries(bird, canvasHeight);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'ceiling collision: bird.y - radius < 0 always reports a collision',
    () => {
      fc.assert(
        fc.property(
          // radius: small positive value
          fc.integer({ min: 1, max: 50 }).chain((radius) =>
            fc.record({
              radius: fc.constant(radius),
              canvasHeight: fc.integer({ min: 100, max: 2000 }),
              // y must satisfy: y - radius < 0 → y < radius
              y: fc.integer({ min: -500, max: radius - 1 }),
            })
          ),
          ({ radius, canvasHeight, y }) => {
            const bird = new Bird(80, y, radius);
            const result = CollisionDetector._checkBoundaries(bird, canvasHeight);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'no boundary collision: bird fully within canvas bounds reports no boundary collision',
    () => {
      fc.assert(
        fc.property(
          // radius: small positive value
          fc.integer({ min: 1, max: 40 }).chain((radius) =>
            fc.record({
              radius: fc.constant(radius),
              // canvasHeight must be large enough to fit the bird with margin
              canvasHeight: fc.integer({ min: radius * 2 + 2, max: 2000 }),
            }).chain(({ radius: r, canvasHeight }) =>
              fc.record({
                radius: fc.constant(r),
                canvasHeight: fc.constant(canvasHeight),
                // y must satisfy: y - radius >= 0 AND y + radius <= canvasHeight
                // → radius <= y <= canvasHeight - radius
                y: fc.integer({ min: r, max: canvasHeight - r }),
              })
            )
          ),
          ({ radius, canvasHeight, y }) => {
            const bird = new Bird(80, y, radius);
            const result = CollisionDetector._checkBoundaries(bird, canvasHeight);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'check() with no pipes: boundary collisions are propagated correctly',
    () => {
      fc.assert(
        fc.property(
          // Test that check() also reports boundary collisions (floor case)
          fc.integer({ min: 1, max: 40 }).chain((radius) =>
            fc.integer({ min: radius * 2 + 2, max: 2000 }).chain((canvasHeight) =>
              fc.record({
                radius: fc.constant(radius),
                canvasHeight: fc.constant(canvasHeight),
                // y below floor: y + radius > canvasHeight
                y: fc.integer({ min: canvasHeight - radius + 1, max: canvasHeight + 200 }),
              })
            )
          ),
          ({ radius, canvasHeight, y }) => {
            const bird = new Bird(80, y, radius);
            // No pipes — only boundary collision should trigger
            const result = CollisionDetector.check(bird, [], canvasHeight);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: flappy-bird-game, Property 6: AABB intersection and reduced hitbox

describe('CollisionDetector — Property 6: AABB intersection and reduced hitbox', () => {
  /**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   *
   * Property 6 Part A: _aabbIntersects returns true if and only if the two
   * rectangles geometrically overlap (standard AABB overlap condition).
   * Also verifies symmetry: result is the same regardless of argument order.
   */
  test(
    'AABB intersection is correct: returns true iff rectangles geometrically overlap',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            width: fc.nat({ max: 500 }),
            height: fc.nat({ max: 500 }),
          }),
          fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            width: fc.nat({ max: 500 }),
            height: fc.nat({ max: 500 }),
          }),
          (rectA, rectB) => {
            const geometricOverlap =
              rectA.x < rectB.x + rectB.width &&
              rectA.x + rectA.width > rectB.x &&
              rectA.y < rectB.y + rectB.height &&
              rectA.y + rectA.height > rectB.y;

            const result = CollisionDetector._aabbIntersects(rectA, rectB);

            // If and only if: result must match geometric overlap
            expect(result).toBe(geometricOverlap);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'AABB intersection is symmetric: _aabbIntersects(A, B) === _aabbIntersects(B, A)',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            width: fc.nat({ max: 500 }),
            height: fc.nat({ max: 500 }),
          }),
          fc.record({
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            width: fc.nat({ max: 500 }),
            height: fc.nat({ max: 500 }),
          }),
          (rectA, rectB) => {
            const ab = CollisionDetector._aabbIntersects(rectA, rectB);
            const ba = CollisionDetector._aabbIntersects(rectB, rectA);
            expect(ab).toBe(ba);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * **Validates: Requirements 4.3**
   *
   * Property 6 Part B: The bounding box with HITBOX_MARGIN (4px) has dimensions
   * strictly smaller than the full sprite (radius * 2) and is centered within it.
   */
  test(
    'bounding box with HITBOX_MARGIN is strictly smaller than the full sprite',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 0, max: 400 }),
            y: fc.integer({ min: 0, max: 600 }),
            // radius must be > HITBOX_MARGIN (4) so the reduced box has positive dimensions
            radius: fc.integer({ min: 5, max: 100 }),
          }),
          ({ x, y, radius }) => {
            const bird = new Bird(x, y, radius);
            const box = bird.getBoundingBox(CollisionDetector.HITBOX_MARGIN);

            const fullWidth = radius * 2;
            const fullHeight = radius * 2;

            // Width and height must be strictly smaller than the full sprite
            expect(box.width).toBeLessThan(fullWidth);
            expect(box.height).toBeLessThan(fullHeight);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'bounding box with HITBOX_MARGIN is centered within the full sprite',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 0, max: 400 }),
            y: fc.integer({ min: 0, max: 600 }),
            radius: fc.integer({ min: 5, max: 100 }),
          }),
          ({ x, y, radius }) => {
            const bird = new Bird(x, y, radius);
            const box = bird.getBoundingBox(CollisionDetector.HITBOX_MARGIN);

            // Center of bounding box must equal bird position (x, y)
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
