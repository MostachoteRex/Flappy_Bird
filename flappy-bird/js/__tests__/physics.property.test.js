/**
 * Property-based tests for PhysicsEngine
 *
 * Feature: flappy-bird-game, Property 2: bird physics respects gravity and velocity limits
 * Feature: flappy-bird-game, Property 3: jump always assigns correct velocity
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

const fc = require('fast-check');
const { PhysicsEngine } = require('../physics.js');

describe('PhysicsEngine — Property 2: gravity and velocity limits', () => {
  /**
   * **Validates: Requirements 2.1, 2.3, 2.4**
   *
   * Property 2: For any initial velocity and any number of frames without a jump:
   *   1. Each frame's velocity = clamp(prevVelocity + gravity, -Infinity, maxFallVelocity)
   *   2. Velocity never exceeds maxFallVelocity
   *   3. The final Y position equals startY + sum of all applied velocities
   */
  test(
    'velocity increases by gravity per frame, never exceeds maxFallVelocity, and Y is cumulative sum of velocities',
    () => {
      fc.assert(
        fc.property(
          // arbitrary initial velocity
          fc.float({ min: -20, max: 20, noNaN: true }),
          // arbitrary starting Y position
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          // arbitrary number of frames (1 to 200)
          fc.integer({ min: 1, max: 200 }),
          (initialVelocity, startY, numFrames) => {
            const physics = new PhysicsEngine();
            const { gravity, maxFallVelocity } = physics;
            const bird = { velocity: initialVelocity, y: startY };

            let expectedVelocity = initialVelocity;
            let expectedY = startY;
            let velocityNeverExceedsMax = true;

            for (let frame = 0; frame < numFrames; frame++) {
              expectedVelocity = Math.min(expectedVelocity + gravity, maxFallVelocity);
              expectedY += expectedVelocity;

              physics.update(bird);

              if (bird.velocity > maxFallVelocity) {
                velocityNeverExceedsMax = false;
              }
            }

            // 1. Velocity never exceeds maxFallVelocity
            expect(velocityNeverExceedsMax).toBe(true);

            // 2. Final velocity matches expected
            expect(bird.velocity).toBeCloseTo(expectedVelocity, 10);

            // 3. Final Y position equals startY + cumulative sum of applied velocities
            expect(bird.y).toBeCloseTo(expectedY, 10);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

describe('PhysicsEngine — Property 3: jump always assigns correct velocity', () => {
  /**
   * **Validates: Requirement 2.2**
   *
   * Property 3: For any bird state (arbitrary position and velocity),
   * after applying jump(), the vertical velocity is exactly jumpVelocity,
   * regardless of the previous velocity or position.
   */
  test(
    'after jump(), bird velocity is exactly jumpVelocity regardless of prior state',
    () => {
      fc.assert(
        fc.property(
          // arbitrary initial velocity (including extreme values)
          fc.float({ min: -100, max: 100, noNaN: true }),
          // arbitrary Y position
          fc.float({ min: -10000, max: 10000, noNaN: true }),
          (initialVelocity, initialY) => {
            const physics = new PhysicsEngine();
            const bird = { velocity: initialVelocity, y: initialY };

            physics.jump(bird);

            // Velocity must be exactly jumpVelocity after jump, regardless of prior state
            expect(bird.velocity).toBe(physics.jumpVelocity);

            // Y position must remain unchanged by jump()
            expect(bird.y).toBe(initialY);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
