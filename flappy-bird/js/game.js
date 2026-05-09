// game.js — Main orchestrator + State Machine

// Support both browser (global) and Node/Jest (module.exports) environments
const _Bird = typeof module !== 'undefined' && module.exports
  ? require('./bird.js').Bird
  : Bird;

const _PhysicsEngine = typeof module !== 'undefined' && module.exports
  ? require('./physics.js').PhysicsEngine
  : PhysicsEngine;

const _PipeManager = typeof module !== 'undefined' && module.exports
  ? require('./pipeManager.js').PipeManager
  : PipeManager;

const _CollisionDetector = typeof module !== 'undefined' && module.exports
  ? require('./collision.js')
  : CollisionDetector;

const _ScoreManager = typeof module !== 'undefined' && module.exports
  ? require('./scoreManager.js').ScoreManager
  : ScoreManager;

const _InputHandler = typeof module !== 'undefined' && module.exports
  ? require('./inputHandler.js').InputHandler
  : InputHandler;

const _Renderer = typeof module !== 'undefined' && module.exports
  ? require('./renderer.js').Renderer
  : Renderer;

/**
 * Valid state transitions for the game state machine.
 * idle → playing → game_over → idle
 */
const VALID_TRANSITIONS = {
  idle: ['playing'],
  playing: ['game_over'],
  game_over: ['idle'],
};

const VALID_STATES = new Set(['idle', 'playing', 'game_over']);

// Canvas dimensions
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

// Bird starting position
const BIRD_START_X = 80;
const BIRD_START_Y = 320;
const BIRD_RADIUS = 15;

class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this._canvas = canvas;
    this._state = 'idle';

    // Game loop control
    this._running = false;
    this._lastTimestamp = 0;
    this._animFrameId = null;

    // Components are initialized lazily in init() to allow the constructor
    // to work with a minimal canvas mock (needed for state machine tests).
    this.bird = null;
    this.physics = null;
    this.pipeManager = null;
    this.scoreManager = null;
    this.inputHandler = null;
    this.renderer = null;
  }

  // ---------------------------------------------------------------------------
  // State Machine
  // ---------------------------------------------------------------------------

  /**
   * Returns the current game state.
   * @returns {'idle' | 'playing' | 'game_over'}
   */
  getState() {
    return this._state;
  }

  /**
   * Attempts to transition to newState.
   * Only valid transitions (per VALID_TRANSITIONS) are accepted.
   * Invalid transitions are silently ignored.
   *
   * Valid transitions:
   *   idle       → playing
   *   playing    → game_over
   *   game_over  → idle
   *
   * @param {'idle' | 'playing' | 'game_over'} newState
   */
  setState(newState) {
    if (!VALID_STATES.has(newState)) {
      // Unknown state — silently ignore
      return;
    }

    const allowed = VALID_TRANSITIONS[this._state];
    if (allowed && allowed.includes(newState)) {
      this._state = newState;
    }
    // Invalid transition: silently ignored
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Initializes all game components and attaches input handlers.
   * Sets up window.onerror for unexpected error handling.
   */
  init() {
    // Instantiate all components
    this.bird = new _Bird(BIRD_START_X, BIRD_START_Y, BIRD_RADIUS);
    this.physics = new _PhysicsEngine();
    this.pipeManager = new _PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.scoreManager = new _ScoreManager();
    this.inputHandler = new _InputHandler(this._canvas, this.onJumpAction.bind(this));
    this.renderer = new _Renderer(
      this._canvas,
      this._canvas.getContext ? this._canvas.getContext('2d') : null
    );

    // Reset all stateful components
    this.bird.reset();
    this.pipeManager.reset();
    this.scoreManager.reset();

    // Attach input listeners
    this.inputHandler.attach();

    // Global error handler for unexpected errors
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        console.error('Unexpected game error:', message, error);
        // Display a user-friendly error message if possible
        try {
          const errorEl = document.getElementById('error-message');
          if (errorEl) {
            errorEl.textContent = 'An unexpected error occurred. Please refresh the page.';
            errorEl.style.display = 'block';
          }
        } catch (e) {
          // DOM not available — ignore
        }
        return false; // Let the error propagate normally
      };
    }
  }

  /**
   * Transitions from idle → playing, resets all components, and starts the game loop.
   */
  start() {
    this.setState('playing');

    // Reset all components for a fresh game
    this.bird.reset();
    this.pipeManager.reset();
    this.scoreManager.reset();

    // Start the game loop
    this._running = true;
    this._lastTimestamp = 0;

    const raf = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (fn) => setTimeout(fn, 1000 / 60);

    raf((timestamp) => this.tick(timestamp));
  }

  /**
   * Resets all components, transitions to idle, and stops the game loop.
   */
  reset() {
    this._running = false;

    // Reset all stateful components
    if (this.bird) this.bird.reset();
    if (this.pipeManager) this.pipeManager.reset();
    if (this.scoreManager) this.scoreManager.reset();

    // Transition back to idle (from game_over)
    // We need to force the state to idle regardless of current state
    // The valid transition is game_over → idle, but reset() can be called
    // from game_over state after a collision.
    this._state = 'idle';
  }

  // ---------------------------------------------------------------------------
  // Game Loop
  // ---------------------------------------------------------------------------

  /**
   * Main game loop tick — called by requestAnimationFrame.
   *
   * @param {number} timestamp - DOMHighResTimeStamp from rAF
   */
  tick(timestamp) {
    // Reset per-frame input throttle flag
    if (this.inputHandler) {
      this.inputHandler.resetJumpFlag();
    }

    // Calculate delta time, capped at 100ms to handle tab switching / pausing
    if (this._lastTimestamp === 0) {
      this._lastTimestamp = timestamp;
    }
    const deltaTime = Math.min(timestamp - this._lastTimestamp, 100);
    this._lastTimestamp = timestamp;

    // Update game logic only while playing
    if (this._state === 'playing') {
      this.update(deltaTime);
    }

    // Always render (shows game_over screen after collision)
    if (this.renderer) {
      this.renderer.render(
        this.getState(),
        this.bird,
        this.pipeManager ? this.pipeManager.getPipes() : [],
        this.scoreManager ? this.scoreManager.getScore() : 0,
        this.scoreManager ? this.scoreManager.getHighScore() : 0
      );
    }

    // Continue the loop if still running
    if (this._running) {
      const raf = typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 1000 / 60);

      raf((ts) => this.tick(ts));
    }
  }

  /**
   * Updates all game systems for one frame.
   *
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    // Apply physics to the bird
    this.physics.update(this.bird);

    // Move pipes and spawn new ones
    this.pipeManager.update(deltaTime);

    // Check and award score for pipe crossings
    this.scoreManager.checkAndScore(this.bird, this.pipeManager.getPipes());

    // Check for collisions
    const collision = _CollisionDetector.check(
      this.bird,
      this.pipeManager.getPipes(),
      CANVAS_HEIGHT
    );

    if (collision) {
      this.setState('game_over');
      this.scoreManager.saveHighScore();
      this._running = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  /**
   * Handles jump/action input, delegating based on current state.
   *
   * - idle:      starts the game
   * - playing:   makes the bird jump
   * - game_over: resets and returns to idle
   */
  onJumpAction() {
    const state = this.getState();

    if (state === 'idle') {
      this.start();
    } else if (state === 'playing') {
      this.physics.jump(this.bird);
    } else if (state === 'game_over') {
      this.reset();   // vuelve a idle
      this.start();   // arranca inmediatamente
    }
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game };
}
