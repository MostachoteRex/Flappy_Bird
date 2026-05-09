/**
 * Property-based tests for InputHandler throttle
 *
 * Feature: flappy-bird-game, Property 9: input throttle prevents duplicate jumps per frame
 *
 * Validates: Requirement 7.7
 */

const fc = require('fast-check');
const { InputHandler } = require('../inputHandler.js');

// ---------------------------------------------------------------------------
// Minimal canvas stub — InputHandler only needs addEventListener /
// removeEventListener on the canvas element; no real DOM required.
// ---------------------------------------------------------------------------
function makeCanvasStub() {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('InputHandler — Property 9: throttle prevents duplicate jumps per frame', () => {
  /**
   * **Validates: Requirement 7.7**
   *
   * Property 9: For any number of jump events fired within the same frame
   * (i.e. before resetJumpFlag() is called), the onJump callback is invoked
   * at most once per frame, regardless of how many events arrive.
   *
   * The throttle is implemented via the _jumpedThisFrame flag:
   *   - First call to _throttle() within a frame → sets flag, calls onJump
   *   - Subsequent calls within the same frame → flag already set, ignored
   *   - After resetJumpFlag() → flag cleared, next call is accepted again
   */

  test(
    'onJump is called at most once no matter how many jump events fire in the same frame',
    () => {
      fc.assert(
        fc.property(
          // Any number of jump events in a single frame (1 to 100)
          fc.integer({ min: 1, max: 100 }),
          (numEvents) => {
            let callCount = 0;
            const onJump = () => { callCount++; };

            const handler = new InputHandler(makeCanvasStub(), onJump);

            // Simulate numEvents jump triggers within the same frame
            // (resetJumpFlag is NOT called between them)
            for (let i = 0; i < numEvents; i++) {
              handler._throttle();
            }

            // Regardless of how many events fired, onJump must have been
            // called exactly once (the first event) — never more.
            expect(callCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'onJump is called exactly once per frame across multiple frames',
    () => {
      fc.assert(
        fc.property(
          // Number of frames (1 to 20)
          fc.integer({ min: 1, max: 20 }),
          // Number of jump events per frame (1 to 20)
          fc.integer({ min: 1, max: 20 }),
          (numFrames, eventsPerFrame) => {
            let callCount = 0;
            const onJump = () => { callCount++; };

            const handler = new InputHandler(makeCanvasStub(), onJump);

            for (let frame = 0; frame < numFrames; frame++) {
              // Simulate multiple jump events within this frame
              for (let i = 0; i < eventsPerFrame; i++) {
                handler._throttle();
              }
              // End of frame: reset the throttle flag (as the game loop does)
              handler.resetJumpFlag();
            }

            // Each frame contributes exactly 1 jump call, so total = numFrames
            expect(callCount).toBe(numFrames);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'after resetJumpFlag(), the next jump event is always accepted',
    () => {
      fc.assert(
        fc.property(
          // Number of events to fire before the reset (1 to 50)
          fc.integer({ min: 1, max: 50 }),
          // Number of events to fire after the reset (1 to 50)
          fc.integer({ min: 1, max: 50 }),
          (eventsBefore, eventsAfter) => {
            let callCount = 0;
            const onJump = () => { callCount++; };

            const handler = new InputHandler(makeCanvasStub(), onJump);

            // Fire events in frame 1 — only the first should trigger onJump
            for (let i = 0; i < eventsBefore; i++) {
              handler._throttle();
            }
            expect(callCount).toBe(1); // exactly 1 from frame 1

            // Reset flag (end of frame 1 / start of frame 2)
            handler.resetJumpFlag();

            // Fire events in frame 2 — again only the first should trigger onJump
            for (let i = 0; i < eventsAfter; i++) {
              handler._throttle();
            }

            // Total calls must be exactly 2 (one per frame)
            expect(callCount).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  test(
    'zero events in a frame result in zero onJump calls',
    () => {
      fc.assert(
        fc.property(
          // Number of frames with no events (1 to 20)
          fc.integer({ min: 1, max: 20 }),
          (numFrames) => {
            let callCount = 0;
            const onJump = () => { callCount++; };

            const handler = new InputHandler(makeCanvasStub(), onJump);

            for (let frame = 0; frame < numFrames; frame++) {
              // No events fired this frame
              handler.resetJumpFlag();
            }

            expect(callCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
