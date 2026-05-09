/**
 * Unit tests for ScoreManager
 *
 * Validates: Requirements 5.2, 5.6
 */

const { ScoreManager } = require('../scoreManager.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a pipe object where the bird is already past the midpoint.
 * bird.x > pipe.x + pipe.width / 2
 */
function makeCrossedPipe(pipeX = 100, width = 60) {
  return { x: pipeX, width, scored: false };
}

/**
 * Creates a bird object positioned past the midpoint of the given pipe.
 */
function birdPastPipe(pipe) {
  return { x: pipe.x + pipe.width / 2 + 1 };
}

/**
 * Creates a bird object positioned before the midpoint of the given pipe.
 */
function birdBeforePipe(pipe) {
  return { x: pipe.x + pipe.width / 2 - 1 };
}

// ─── Requirement 5.2: No double-counting ────────────────────────────────────

describe('ScoreManager — no double-counting (Requirement 5.2)', () => {
  test('crossing a pipe once awards exactly 1 point', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    manager.checkAndScore(bird, [pipe]);

    expect(manager.getScore()).toBe(1);
  });

  test('a pipe is NOT counted twice when bird stays to its right across multiple frames', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    // Simulate 10 frames with the bird still past the pipe
    for (let frame = 0; frame < 10; frame++) {
      manager.checkAndScore(bird, [pipe]);
    }

    expect(manager.getScore()).toBe(1);
  });

  test('a pipe is NOT counted twice across 100 frames', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    for (let frame = 0; frame < 100; frame++) {
      manager.checkAndScore(bird, [pipe]);
    }

    expect(manager.getScore()).toBe(1);
  });

  test('pipe.scored flag is set to true after the first crossing', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    manager.checkAndScore(bird, [pipe]);

    expect(pipe.scored).toBe(true);
  });

  test('a pipe with scored=true is never counted even if bird is past it', () => {
    const manager = new ScoreManager('testKey');
    const pipe = { x: 100, width: 60, scored: true }; // already scored
    const bird = birdPastPipe(pipe);

    manager.checkAndScore(bird, [pipe]);
    manager.checkAndScore(bird, [pipe]);

    expect(manager.getScore()).toBe(0);
  });

  test('two distinct pipes each contribute exactly 1 point', () => {
    const manager = new ScoreManager('testKey');
    const pipe1 = makeCrossedPipe(50, 60);
    const pipe2 = makeCrossedPipe(200, 60);
    // Bird is past both midpoints
    const bird = { x: pipe2.x + pipe2.width / 2 + 1 };

    // Simulate multiple frames
    for (let frame = 0; frame < 5; frame++) {
      manager.checkAndScore(bird, [pipe1, pipe2]);
    }

    expect(manager.getScore()).toBe(2);
  });

  test('a pipe before the bird midpoint does not score', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe(200, 60);
    const bird = birdBeforePipe(pipe);

    for (let frame = 0; frame < 5; frame++) {
      manager.checkAndScore(bird, [pipe]);
    }

    expect(manager.getScore()).toBe(0);
    expect(pipe.scored).toBe(false);
  });

  test('score resets to 0 after reset()', () => {
    const manager = new ScoreManager('testKey');
    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    manager.checkAndScore(bird, [pipe]);
    expect(manager.getScore()).toBe(1);

    manager.reset();
    expect(manager.getScore()).toBe(0);
  });

  test('bird exactly at the midpoint (not past it) does not score', () => {
    const manager = new ScoreManager('testKey');
    const pipe = { x: 100, width: 60, scored: false };
    // bird.x === pipe.x + pipe.width / 2  →  NOT strictly greater, so no score
    const bird = { x: pipe.x + pipe.width / 2 };

    manager.checkAndScore(bird, [pipe]);

    expect(manager.getScore()).toBe(0);
  });
});

// ─── Requirement 5.6: localStorage unavailable ──────────────────────────────

describe('ScoreManager — localStorage unavailable (Requirement 5.6)', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
  });

  afterEach(() => {
    // Restore original localStorage after each test
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  /**
   * Replaces global.localStorage with a proxy that throws on every access.
   */
  function mockLocalStorageUnavailable() {
    const throwingStorage = {
      getItem: () => { throw new Error('localStorage is not available'); },
      setItem: () => { throw new Error('localStorage is not available'); },
      removeItem: () => { throw new Error('localStorage is not available'); },
      clear: () => { throw new Error('localStorage is not available'); },
    };
    Object.defineProperty(global, 'localStorage', {
      value: throwingStorage,
      writable: true,
      configurable: true,
    });
  }

  test('reset() does not throw when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');

    expect(() => manager.reset()).not.toThrow();
  });

  test('reset() keeps highScore at 0 when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');

    manager.reset();

    expect(manager.getHighScore()).toBe(0);
  });

  test('saveHighScore() does not throw when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');
    manager.score = 5;
    manager.highScore = 3;

    expect(() => manager.saveHighScore()).not.toThrow();
  });

  test('saveHighScore() updates in-memory highScore even when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');
    manager.score = 10;
    manager.highScore = 5;

    manager.saveHighScore();

    // In-memory highScore should still be updated
    expect(manager.getHighScore()).toBe(10);
  });

  test('score tracking works normally when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');
    manager.reset(); // should not throw

    const pipe = makeCrossedPipe();
    const bird = birdPastPipe(pipe);

    manager.checkAndScore(bird, [pipe]);

    expect(manager.getScore()).toBe(1);
  });

  test('highScore is preserved in memory across multiple saveHighScore() calls when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');

    // First game
    manager.score = 7;
    manager.highScore = 0;
    manager.saveHighScore();
    expect(manager.getHighScore()).toBe(7);

    // Second game with lower score
    manager.score = 3;
    manager.saveHighScore();
    // highScore should remain 7 (max of 3 and 7)
    expect(manager.getHighScore()).toBe(7);
  });

  test('reset() preserves existing in-memory highScore when localStorage is unavailable', () => {
    mockLocalStorageUnavailable();
    const manager = new ScoreManager('testKey');
    // Manually set a high score in memory
    manager.highScore = 15;

    // reset() tries localStorage (fails silently) and keeps existing highScore
    manager.reset();

    // highScore should remain as-is since localStorage threw
    expect(manager.getHighScore()).toBe(15);
  });
});
