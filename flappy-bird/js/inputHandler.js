// inputHandler.js — Input Handler

class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas - The game canvas element
   * @param {Function} onJump - Callback invoked when a jump action is detected
   */
  constructor(canvas, onJump) {
    this._canvas = canvas;
    this._onJump = onJump;

    // Throttle flag: prevents multiple jumps within the same frame (req 7.7)
    this._jumpedThisFrame = false;

    // Bind handlers once so the same function references can be used for
    // both addEventListener and removeEventListener in detach().
    this._boundOnKeyDown = this._onKeyDown.bind(this);
    this._boundOnMouseDown = this._onMouseDown.bind(this);
    this._boundOnTouchStart = this._onTouchStart.bind(this);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Registers keydown, mousedown and touchstart event listeners.
   * keydown is attached to window so it works regardless of canvas focus.
   * mousedown and touchstart are attached to the canvas element.
   */
  attach() {
    window.addEventListener('keydown', this._boundOnKeyDown);
    this._canvas.addEventListener('mousedown', this._boundOnMouseDown);
    this._canvas.addEventListener('touchstart', this._boundOnTouchStart);
  }

  /**
   * Removes all event listeners registered by attach().
   */
  detach() {
    window.removeEventListener('keydown', this._boundOnKeyDown);
    this._canvas.removeEventListener('mousedown', this._boundOnMouseDown);
    this._canvas.removeEventListener('touchstart', this._boundOnTouchStart);
  }

  /**
   * Resets the per-frame throttle flag.
   * Must be called at the start of each game loop tick so that the next
   * jump action in the following frame is accepted.
   */
  resetJumpFlag() {
    this._jumpedThisFrame = false;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Handles keydown events. Triggers a jump on Space or ArrowUp (req 7.1).
   *
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      this._throttle();
    }
  }

  /**
   * Handles mousedown events. Triggers a jump on left-button click (req 7.2).
   *
   * @param {MouseEvent} e
   */
  _onMouseDown(e) {
    if (e.button === 0) {
      this._throttle();
    }
  }

  /**
   * Handles touchstart events on the canvas (req 7.3).
   *
   * @param {TouchEvent} e
   */
  _onTouchStart(e) {
    this._throttle();
  }

  /**
   * Throttle: invokes the onJump callback at most once per frame.
   * Sets _jumpedThisFrame to true after the first invocation; subsequent
   * calls within the same frame are silently ignored (req 7.7).
   */
  _throttle() {
    if (this._jumpedThisFrame) {
      return;
    }
    this._jumpedThisFrame = true;
    this._onJump();
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputHandler };
}
