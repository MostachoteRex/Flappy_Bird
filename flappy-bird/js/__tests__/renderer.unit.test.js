/**
 * Unit tests for Renderer
 *
 * Validates: Requirements 6.2
 *
 * Tests verify:
 * 1. _clearCanvas() is called at the start of every render() call
 * 2. render() dispatches to the correct private method based on game state
 * 3. Only the correct private render method is called (no cross-state calls)
 */

const { Renderer } = require('../renderer.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal mock canvas and 2D context using jest.fn().
 * The ctx mock covers every canvas API method the Renderer uses.
 */
function makeMockCanvas(width = 480, height = 640) {
  const ctx = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    // Properties that may be set directly
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
  };

  const canvas = {
    width,
    height,
    getContext: jest.fn(() => ctx),
  };

  return { canvas, ctx };
}

/**
 * Minimal bird object used as a test fixture.
 */
const MOCK_BIRD = { x: 80, y: 320, radius: 15 };

/**
 * Minimal pipes array used as a test fixture.
 */
const MOCK_PIPES = [
  { x: 300, gapY: 200, gapHeight: 150, width: 60 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Renderer — unit tests', () => {
  let canvas;
  let ctx;
  let renderer;

  beforeEach(() => {
    ({ canvas, ctx } = makeMockCanvas());
    renderer = new Renderer(canvas, ctx);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Requirement 6.2 — _clearCanvas() called at the start of every frame
  // -------------------------------------------------------------------------

  describe('Requirement 6.2 — _clearCanvas() is called at the start of each frame', () => {
    test('_clearCanvas() is called when state is "idle"', () => {
      const clearSpy = jest.spyOn(renderer, '_clearCanvas');
      renderer.render('idle', MOCK_BIRD, MOCK_PIPES, 0, 0);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    test('_clearCanvas() is called when state is "playing"', () => {
      const clearSpy = jest.spyOn(renderer, '_clearCanvas');
      renderer.render('playing', MOCK_BIRD, MOCK_PIPES, 5, 10);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    test('_clearCanvas() is called when state is "game_over"', () => {
      const clearSpy = jest.spyOn(renderer, '_clearCanvas');
      renderer.render('game_over', MOCK_BIRD, MOCK_PIPES, 5, 10);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    test('_clearCanvas() calls ctx.clearRect with full canvas dimensions', () => {
      renderer._clearCanvas();
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });
  });

  // -------------------------------------------------------------------------
  // Dispatch — render() calls the correct private method per state
  // -------------------------------------------------------------------------

  describe('render() dispatches to the correct private method', () => {
    // --- idle state ---
    describe('state "idle"', () => {
      test('calls _renderIdle()', () => {
        const idleSpy = jest.spyOn(renderer, '_renderIdle');
        renderer.render('idle', MOCK_BIRD, MOCK_PIPES, 0, 0);
        expect(idleSpy).toHaveBeenCalledTimes(1);
      });

      test('does NOT call _renderPlaying()', () => {
        const playingSpy = jest.spyOn(renderer, '_renderPlaying');
        renderer.render('idle', MOCK_BIRD, MOCK_PIPES, 0, 0);
        expect(playingSpy).not.toHaveBeenCalled();
      });

      test('does NOT call _renderGameOver()', () => {
        const gameOverSpy = jest.spyOn(renderer, '_renderGameOver');
        renderer.render('idle', MOCK_BIRD, MOCK_PIPES, 0, 0);
        expect(gameOverSpy).not.toHaveBeenCalled();
      });
    });

    // --- playing state ---
    describe('state "playing"', () => {
      test('calls _renderPlaying() with bird, pipes, and score', () => {
        const playingSpy = jest.spyOn(renderer, '_renderPlaying');
        renderer.render('playing', MOCK_BIRD, MOCK_PIPES, 7, 15);
        expect(playingSpy).toHaveBeenCalledTimes(1);
        expect(playingSpy).toHaveBeenCalledWith(MOCK_BIRD, MOCK_PIPES, 7);
      });

      test('does NOT call _renderIdle()', () => {
        const idleSpy = jest.spyOn(renderer, '_renderIdle');
        renderer.render('playing', MOCK_BIRD, MOCK_PIPES, 7, 15);
        expect(idleSpy).not.toHaveBeenCalled();
      });

      test('does NOT call _renderGameOver()', () => {
        const gameOverSpy = jest.spyOn(renderer, '_renderGameOver');
        renderer.render('playing', MOCK_BIRD, MOCK_PIPES, 7, 15);
        expect(gameOverSpy).not.toHaveBeenCalled();
      });
    });

    // --- game_over state ---
    describe('state "game_over"', () => {
      test('calls _renderGameOver() with score and highScore', () => {
        const gameOverSpy = jest.spyOn(renderer, '_renderGameOver');
        renderer.render('game_over', MOCK_BIRD, MOCK_PIPES, 5, 10);
        expect(gameOverSpy).toHaveBeenCalledTimes(1);
        expect(gameOverSpy).toHaveBeenCalledWith(5, 10);
      });

      test('does NOT call _renderIdle()', () => {
        const idleSpy = jest.spyOn(renderer, '_renderIdle');
        renderer.render('game_over', MOCK_BIRD, MOCK_PIPES, 5, 10);
        expect(idleSpy).not.toHaveBeenCalled();
      });

      test('does NOT call _renderPlaying()', () => {
        const playingSpy = jest.spyOn(renderer, '_renderPlaying');
        renderer.render('game_over', MOCK_BIRD, MOCK_PIPES, 5, 10);
        expect(playingSpy).not.toHaveBeenCalled();
      });
    });
  });
});
