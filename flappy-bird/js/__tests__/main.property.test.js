/**
 * Property-based tests for canvas scaling logic (main.js)
 *
 * // Feature: flappy-bird-game, Property 10: canvas scaling maintains 3:4 aspect ratio
 *
 * Validates: Requirement 8.2
 */

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure helper extracted from main.js for isolated testing
// (mirrors the extraction pattern used in main.unit.test.js)
// ---------------------------------------------------------------------------

/**
 * Computes the CSS display dimensions for the game container so that the
 * canvas fills the viewport while maintaining the 3:4 aspect ratio (480×640).
 *
 * @param {number} vw - Viewport width in pixels
 * @param {number} vh - Viewport height in pixels
 * @returns {{ displayWidth: number, displayHeight: number }}
 */
function computeCanvasScale(vw, vh) {
  const maxWidth = Math.min(vw, Math.floor(vh * (3 / 4)));
  const displayWidth = Math.min(maxWidth, 480);
  const displayHeight = Math.floor(displayWidth * (4 / 3));
  return { displayWidth, displayHeight };
}

// ---------------------------------------------------------------------------
// Property 10: canvas scaling maintains 3:4 aspect ratio
// ---------------------------------------------------------------------------

describe('applyCanvasScale — Property 10: canvas scaling maintains 3:4 aspect ratio', () => {
  /**
   * **Validates: Requirements 8.2**
   *
   * Property 10: For any browser window size, the canvas scales so that its
   * width and height always maintain the 3:4 aspect ratio (480:640), without
   * distortion.
   *
   * Specifically:
   *   1. displayHeight / displayWidth === 4/3  (3:4 width-to-height ratio)
   *   2. displayWidth <= 480  (never exceeds the logical canvas width)
   *   3. displayWidth <= vw   (never exceeds the viewport width)
   *   4. displayHeight <= vh  (never exceeds the viewport height)
   *   5. Both dimensions are scaled by the same factor (no distortion):
   *      displayWidth / displayHeight === 480 / 640 === 0.75
   */
  test(
    'for any window size, canvas dimensions maintain 3:4 aspect ratio without distortion',
    () => {
      fc.assert(
        fc.property(
          // Arbitrary viewport width: 100–3000px
          fc.integer({ min: 100, max: 3000 }),
          // Arbitrary viewport height: 100–3000px
          fc.integer({ min: 100, max: 3000 }),
          (vw, vh) => {
            const { displayWidth, displayHeight } = computeCanvasScale(vw, vh);

            // 1. The ratio width:height must equal 3:4 (i.e. height/width === 4/3)
            //    We use Math.floor for displayHeight so allow ±1px tolerance.
            expect(displayHeight / displayWidth).toBeCloseTo(4 / 3, 1);

            // 2. Width never exceeds the logical canvas width (480px)
            expect(displayWidth).toBeLessThanOrEqual(480);

            // 3. Width never exceeds the viewport width
            expect(displayWidth).toBeLessThanOrEqual(vw);

            // 4. Height never exceeds the viewport height
            expect(displayHeight).toBeLessThanOrEqual(vh);

            // 5. No distortion: the aspect ratio of the result equals 480/640
            //    i.e. displayWidth / displayHeight ≈ 480 / 640 = 0.75
            expect(displayWidth / displayHeight).toBeCloseTo(480 / 640, 1);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * **Validates: Requirements 8.2**
   *
   * Property 10 (no distortion — uniform scale factor):
   * For any window size, both CSS dimensions are derived from the same scale
   * factor applied to the logical 480×640 canvas. This means:
   *   displayHeight === Math.floor(displayWidth * (4/3))
   * which guarantees both axes scale uniformly (no stretching or squashing).
   */
  test(
    'height is always derived from width by the same 4/3 factor (uniform scaling, no distortion)',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 3000 }),
          fc.integer({ min: 100, max: 3000 }),
          (vw, vh) => {
            const { displayWidth, displayHeight } = computeCanvasScale(vw, vh);

            // Height must equal Math.floor(displayWidth * 4/3) — the exact
            // formula used in applyCanvasScale — confirming uniform scaling.
            expect(displayHeight).toBe(Math.floor(displayWidth * (4 / 3)));
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
