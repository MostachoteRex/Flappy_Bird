/**
 * Unit tests for Game state machine transitions
 *
 * **Validates: Requirements 1.6**
 *
 * Integration unit tests for Game lifecycle and state transitions
 *
 * **Validates: Requirements 1.3, 1.4, 5.4**
 */

const { Game } = require('../game.js');

function makeGame() {
  return new Game({});
}

/**
 * Creates a canvas mock suitable for Game.init() — needs getContext and
 * addEventListener / removeEventListener so InputHandler can attach.
 */
function makeCanvasMock() {
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
    // Properties used by Renderer
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0,
    textAlign: '',
    textBaseline: '',
  };

  const canvas = {
    width: 480,
    height: 640,
    getContext: jest.fn(() => ctx),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return { canvas, ctx };
}

describe('Game state machine — unit tests', () => {
  // ---------------------------------------------------------------------------
  // Invalid transitions are rejected
  // ---------------------------------------------------------------------------

  test('idle → game_over is rejected (state stays idle)', () => {
    const game = makeGame();
    expect(game.getState()).toBe('idle');

    game.setState('game_over');

    expect(game.getState()).toBe('idle');
  });

  test('playing → idle is rejected (state stays playing)', () => {
    const game = makeGame();
    // Advance to 'playing'
    game.setState('playing');
    expect(game.getState()).toBe('playing');

    game.setState('idle');

    expect(game.getState()).toBe('playing');
  });

  // ---------------------------------------------------------------------------
  // Full valid cycle
  // ---------------------------------------------------------------------------

  test('full cycle idle → playing → game_over → idle works correctly', () => {
    const game = makeGame();

    // Start: idle
    expect(game.getState()).toBe('idle');

    // idle → playing
    game.setState('playing');
    expect(game.getState()).toBe('playing');

    // playing → game_over
    game.setState('game_over');
    expect(game.getState()).toBe('game_over');

    // game_over → idle
    game.setState('idle');
    expect(game.getState()).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// Integration unit tests — Game lifecycle
// ---------------------------------------------------------------------------

describe('Game integration — init() in jsdom environment', () => {
  /**
   * Requirement 1.3 / 1.4 — The Game must be able to initialise all its
   * components without throwing in a jsdom environment (which provides
   * window, document, localStorage, etc.).
   */
  test('init() completes without throwing errors', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);

    expect(() => game.init()).not.toThrow();
  });

  test('after init(), game state is still idle', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    expect(game.getState()).toBe('idle');
  });

  test('after init(), all components are instantiated', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    expect(game.bird).not.toBeNull();
    expect(game.physics).not.toBeNull();
    expect(game.pipeManager).not.toBeNull();
    expect(game.scoreManager).not.toBeNull();
    expect(game.inputHandler).not.toBeNull();
    expect(game.renderer).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration unit tests — onJumpAction in idle state (Requirement 1.3)
// ---------------------------------------------------------------------------

describe('Game integration — onJumpAction in idle state (Req 1.3)', () => {
  /**
   * Requirement 1.3: WHEN the player performs the jump action in `idle` state,
   * THE Game SHALL transition to `playing` state and start the Game_Loop.
   */
  test('onJumpAction() in idle state transitions game to playing', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    expect(game.getState()).toBe('idle');

    game.onJumpAction();

    expect(game.getState()).toBe('playing');
  });

  test('onJumpAction() in idle state sets _running to true (game loop started)', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    game.onJumpAction();

    expect(game._running).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration unit tests — collision → game_over + saveHighScore (Req 1.4, 5.4)
// ---------------------------------------------------------------------------

describe('Game integration — collision transitions to game_over and saves high score (Req 1.4, 5.4)', () => {
  /**
   * Requirement 1.4: WHEN a Collision occurs, THE Game SHALL transition to
   * `game_over` state and stop the Game_Loop.
   *
   * Requirement 5.4: WHEN the Game transitions to `game_over`, THE Score_Manager
   * SHALL compare the current Score with the stored High_Score.
   *
   * Strategy: initialise the game, start it (idle → playing), then call
   * update() with a deltaTime that causes a floor collision (bird falls below
   * canvas height) so the collision detector fires naturally.
   */
  test('floor collision during update() transitions state to game_over', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    // Transition to playing
    game.setState('playing');

    // Force the bird below the floor so CollisionDetector.check returns true
    game.bird.y = canvas.height + game.bird.radius + 1;

    game.update(16);

    expect(game.getState()).toBe('game_over');
  });

  test('floor collision during update() stops the game loop (_running = false)', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    game.setState('playing');
    game._running = true;

    // Force bird below floor
    game.bird.y = canvas.height + game.bird.radius + 1;

    game.update(16);

    expect(game._running).toBe(false);
  });

  test('floor collision during update() calls scoreManager.saveHighScore()', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    game.setState('playing');

    // Spy on saveHighScore AFTER init() so we capture the real instance
    const saveHighScoreSpy = jest.spyOn(game.scoreManager, 'saveHighScore');

    // Force bird below floor
    game.bird.y = canvas.height + game.bird.radius + 1;

    game.update(16);

    expect(saveHighScoreSpy).toHaveBeenCalledTimes(1);
  });

  test('pipe collision during update() transitions state to game_over and calls saveHighScore', () => {
    const { canvas } = makeCanvasMock();
    const game = new Game(canvas);
    game.init();

    game.setState('playing');

    const saveHighScoreSpy = jest.spyOn(game.scoreManager, 'saveHighScore');

    // Bird starts at x=80, y=320, radius=15.
    // Bounding box (4px margin): x=69, y=309, width=22, height=22 → right edge at x=91.
    //
    // Create a pipe whose top segment (y=0 to gapY=400) covers the bird's y range,
    // and whose x overlaps the bird's x range.
    // Pipe constructor: (x, canvasHeight, gapY, gapHeight, pipeWidth)
    const { Pipe } = require('../pipe.js');
    const overlappingPipe = new Pipe(
      69,            // x — left edge of pipe aligns with bird's left bounding edge
      canvas.height, // canvasHeight
      400,           // gapY — top segment covers y=0..400, which includes bird at y=309..331
      150,           // gapHeight
      60             // pipeWidth — extends from x=69 to x=129, covering bird at x=69..91
    );

    game.pipeManager._pipes = [overlappingPipe];

    game.update(16);

    expect(game.getState()).toBe('game_over');
    expect(saveHighScoreSpy).toHaveBeenCalledTimes(1);
  });
});
