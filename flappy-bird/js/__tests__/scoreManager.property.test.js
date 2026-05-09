/**
 * Property-based tests for ScoreManager
 *
 * Feature: flappy-bird-game, Property 7: score uniqueness per pipe
 *
 * Validates: Requirement 5.2
 */

const fc = require('fast-check');
const { ScoreManager } = require('../scoreManager.js');

describe('ScoreManager — Property 7: score uniqueness per pipe', () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * Property 7: For any sequence of bird positions and any set of pipes,
   * the score increments by exactly 1 when the bird crosses the central axis
   * of a pipe for the first time, and that pipe never contributes points again.
   *
   * Concretely: after N repeated calls to checkAndScore with the bird already
   * past a pipe's midpoint, the score equals the number of distinct pipes
   * crossed — not N times that count.
   */

  // Arbitrary for a single pipe configuration where the bird is already past the midpoint.
  // bird.x > pipe.x + pipe.width / 2  =>  bird.x > pipe.x + width/2
  const crossedPipeArb = fc.record({
    pipeX: fc.integer({ min: 0, max: 400 }),
    width: fc.integer({ min: 20, max: 100 }),
  }).map(({ pipeX, width }) => {
    // Ensure bird is strictly past the midpoint
    const midpoint = pipeX + width / 2;
    return {
      pipe: { x: pipeX, width, scored: false },
      birdX: midpoint + 1, // bird is always past the midpoint
    };
  });

  // Arbitrary for a pipe the bird has NOT yet crossed.
  const uncrossedPipeArb = fc.record({
    pipeX: fc.integer({ min: 100, max: 400 }),
    width: fc.integer({ min: 20, max: 100 }),
  }).map(({ pipeX, width }) => {
    // bird.x <= pipe.x + pipe.width / 2  =>  bird is at or before midpoint
    const midpoint = pipeX + width / 2;
    return {
      pipe: { x: pipeX, width, scored: false },
      birdX: midpoint - 1, // bird is always before the midpoint
    };
  });

  test(
    'a pipe that has been crossed contributes exactly 1 point regardless of how many frames pass',
    () => {
      fc.assert(
        fc.property(
          // One crossed pipe
          crossedPipeArb,
          // Number of repeated checkAndScore calls (simulating multiple frames)
          fc.integer({ min: 1, max: 50 }),
          ({ pipe, birdX }, numFrames) => {
            const manager = new ScoreManager('testKey');
            const bird = { x: birdX };

            for (let frame = 0; frame < numFrames; frame++) {
              manager.checkAndScore(bird, [pipe]);
            }

            // Regardless of how many frames passed, the pipe contributes exactly 1 point
            expect(manager.getScore()).toBe(1);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    'score equals the number of distinct pipes crossed, not the number of frames',
    () => {
      fc.assert(
        fc.property(
          // Between 1 and 5 crossed pipes
          fc.array(crossedPipeArb, { minLength: 1, maxLength: 5 }),
          // Number of repeated checkAndScore calls
          fc.integer({ min: 1, max: 50 }),
          (crossedEntries, numFrames) => {
            const manager = new ScoreManager('testKey');

            // Build a single bird x that is past ALL pipes' midpoints.
            // Use the maximum birdX from all entries to guarantee all are crossed.
            const birdX = Math.max(...crossedEntries.map((e) => e.birdX));
            const bird = { x: birdX };

            // Collect all pipes (reset scored flag to false for a clean run)
            const pipes = crossedEntries.map((e) => ({ ...e.pipe, scored: false }));

            for (let frame = 0; frame < numFrames; frame++) {
              manager.checkAndScore(bird, pipes);
            }

            // Score must equal the number of distinct pipes, not numFrames * numPipes
            expect(manager.getScore()).toBe(pipes.length);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    'uncrossed pipes never contribute to the score regardless of how many frames pass',
    () => {
      fc.assert(
        fc.property(
          // Between 1 and 5 uncrossed pipes
          fc.array(uncrossedPipeArb, { minLength: 1, maxLength: 5 }),
          // Number of repeated checkAndScore calls
          fc.integer({ min: 1, max: 50 }),
          (uncrossedEntries, numFrames) => {
            const manager = new ScoreManager('testKey');

            // Use the minimum birdX so the bird is before ALL pipes' midpoints
            const birdX = Math.min(...uncrossedEntries.map((e) => e.birdX));
            const bird = { x: birdX };

            const pipes = uncrossedEntries.map((e) => ({ ...e.pipe, scored: false }));

            for (let frame = 0; frame < numFrames; frame++) {
              manager.checkAndScore(bird, pipes);
            }

            // No pipe was crossed, so score must remain 0
            expect(manager.getScore()).toBe(0);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    'mixed crossed and uncrossed pipes: only crossed pipes contribute exactly 1 point each',
    () => {
      fc.assert(
        fc.property(
          // 1–3 crossed pipes
          fc.array(crossedPipeArb, { minLength: 1, maxLength: 3 }),
          // 1–3 uncrossed pipes with x positions that keep them uncrossed
          fc.array(
            fc.record({
              pipeX: fc.integer({ min: 300, max: 400 }),
              width: fc.integer({ min: 20, max: 60 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          // Number of repeated checkAndScore calls
          fc.integer({ min: 1, max: 50 }),
          (crossedEntries, uncrossedRaw, numFrames) => {
            const manager = new ScoreManager('testKey');

            // Bird x is past all crossed pipes but before all uncrossed pipes
            const crossedBirdX = Math.max(...crossedEntries.map((e) => e.birdX));

            // Build uncrossed pipes so their midpoint is strictly beyond crossedBirdX
            const uncrossedPipes = uncrossedRaw.map(({ pipeX, width }) => {
              // Force pipeX so that midpoint > crossedBirdX
              const safePipeX = crossedBirdX + width / 2 + 1;
              return { x: safePipeX, width, scored: false };
            });

            const crossedPipes = crossedEntries.map((e) => ({ ...e.pipe, scored: false }));
            const allPipes = [...crossedPipes, ...uncrossedPipes];

            const bird = { x: crossedBirdX };

            for (let frame = 0; frame < numFrames; frame++) {
              manager.checkAndScore(bird, allPipes);
            }

            // Only the crossed pipes contribute; each contributes exactly 1 point
            expect(manager.getScore()).toBe(crossedPipes.length);
          }
        ),
        { numRuns: 200 }
      );
    }
  );
});

describe('ScoreManager — Property 8: high score persistence round-trip', () => {
  /**
   * **Validates: Requirements 5.5, 5.6**
   *
   * Property 8: For any pair (currentScore, previousHighScore), after saveHighScore(),
   * the value stored in localStorage is max(currentScore, previousHighScore);
   * and reading it back (round-trip) returns the same value.
   */

  // Use a unique storage key per test run to avoid cross-test contamination
  const makeKey = () => `testHighScore_${Math.random().toString(36).slice(2)}`;

  test(
    'saveHighScore() stores max(score, highScore) in localStorage and round-trip read returns the same value',
    () => {
      fc.assert(
        fc.property(
          // currentScore: non-negative integer
          fc.integer({ min: 0, max: 10000 }),
          // previousHighScore: non-negative integer
          fc.integer({ min: 0, max: 10000 }),
          (currentScore, previousHighScore) => {
            const key = makeKey();
            const manager = new ScoreManager(key);

            // Set up the manager state directly
            manager.score = currentScore;
            manager.highScore = previousHighScore;

            // Act: persist the high score
            manager.saveHighScore();

            // The expected value in localStorage is max(currentScore, previousHighScore)
            const expectedValue = Math.max(currentScore, previousHighScore);

            // Assert: localStorage contains the expected value
            const rawStored = localStorage.getItem(key);
            expect(rawStored).not.toBeNull();
            const storedValue = parseInt(rawStored, 10);
            expect(storedValue).toBe(expectedValue);

            // Assert: round-trip — a fresh manager reading from the same key gets the same value
            const freshManager = new ScoreManager(key);
            freshManager.reset(); // loads highScore from localStorage
            expect(freshManager.getHighScore()).toBe(expectedValue);

            // Cleanup
            localStorage.removeItem(key);
          }
        ),
        { numRuns: 200 }
      );
    }
  );

  test(
    'saveHighScore() updates in-memory highScore to max(score, highScore)',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          (currentScore, previousHighScore) => {
            const key = makeKey();
            const manager = new ScoreManager(key);

            manager.score = currentScore;
            manager.highScore = previousHighScore;

            manager.saveHighScore();

            const expectedHighScore = Math.max(currentScore, previousHighScore);
            expect(manager.getHighScore()).toBe(expectedHighScore);

            // Cleanup
            localStorage.removeItem(key);
          }
        ),
        { numRuns: 200 }
      );
    }
  );
});
