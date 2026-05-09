/**
 * Unit tests for InputHandler
 *
 * Validates: Requirements 7.1, 7.2, 7.3
 */

const { InputHandler } = require('../inputHandler.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a real DOM canvas element so that addEventListener /
 * removeEventListener and dispatchEvent work correctly via jsdom.
 */
function makeCanvas() {
  return document.createElement('canvas');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InputHandler — unit tests', () => {
  let canvas;
  let onJump;
  let handler;

  beforeEach(() => {
    canvas = makeCanvas();
    onJump = jest.fn();
    handler = new InputHandler(canvas, onJump);
    handler.attach();
  });

  afterEach(() => {
    handler.detach();
  });

  // -------------------------------------------------------------------------
  // Requirement 7.1 — Space and ArrowUp keys trigger jump
  // -------------------------------------------------------------------------

  describe('Requirement 7.1 — keyboard input', () => {
    test('pressing Space fires the onJump callback', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(onJump).toHaveBeenCalledTimes(1);
    });

    test('pressing ArrowUp fires the onJump callback', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      expect(onJump).toHaveBeenCalledTimes(1);
    });

    test('pressing an unrelated key does NOT fire the onJump callback', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      expect(onJump).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 7.2 — left mouse click on canvas triggers jump
  // -------------------------------------------------------------------------

  describe('Requirement 7.2 — mouse input', () => {
    test('left mouse click (button 0) on canvas fires the onJump callback', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      expect(onJump).toHaveBeenCalledTimes(1);
    });

    test('right mouse click (button 2) on canvas does NOT fire the onJump callback', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
      expect(onJump).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Requirement 7.3 — touchstart on canvas triggers jump
  // -------------------------------------------------------------------------

  describe('Requirement 7.3 — touch input', () => {
    test('touchstart on canvas fires the onJump callback', () => {
      canvas.dispatchEvent(new Event('touchstart', { bubbles: true }));
      expect(onJump).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // detach() — removes all listeners
  // -------------------------------------------------------------------------

  describe('detach() removes all event listeners', () => {
    test('Space key does NOT fire callback after detach()', () => {
      handler.detach();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(onJump).not.toHaveBeenCalled();
    });

    test('ArrowUp key does NOT fire callback after detach()', () => {
      handler.detach();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      expect(onJump).not.toHaveBeenCalled();
    });

    test('left mouse click does NOT fire callback after detach()', () => {
      handler.detach();
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      expect(onJump).not.toHaveBeenCalled();
    });

    test('touchstart does NOT fire callback after detach()', () => {
      handler.detach();
      canvas.dispatchEvent(new Event('touchstart', { bubbles: true }));
      expect(onJump).not.toHaveBeenCalled();
    });
  });
});
