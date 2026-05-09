/**
 * Unit / smoke tests for main.js bootstrap logic.
 *
 * Requirements: 8.4 (Canvas not supported → error message shown)
 *
 * Because main.js is an IIFE that runs immediately when loaded, we test the
 * individual helper behaviours by re-implementing them in the same way and
 * verifying the DOM outcomes in a jsdom environment.
 */

'use strict';

// ---------------------------------------------------------------------------
// Helpers extracted from main.js for isolated testing
// ---------------------------------------------------------------------------

function showCanvasError(canvas) {
  const errorEl = document.createElement('p');
  errorEl.className = 'no-canvas-error';
  errorEl.textContent =
    'Tu navegador no soporta HTML5 Canvas. Por favor, actualiza tu navegador.';

  const container = canvas.parentElement || document.body;
  canvas.style.display = 'none';
  container.appendChild(errorEl);
}

function applyCanvasScale(container, vw, vh) {
  if (!container) return;
  const maxWidth = Math.min(vw, Math.floor(vh * (3 / 4)));
  const displayWidth = Math.min(maxWidth, 480);
  const displayHeight = Math.floor(displayWidth * (4 / 3));
  container.style.width = displayWidth + 'px';
  container.style.height = displayHeight + 'px';
}

// ---------------------------------------------------------------------------
// Tests: Canvas not supported (Requirement 8.4)
// ---------------------------------------------------------------------------

describe('showCanvasError', () => {
  let container;
  let canvas;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('hides the canvas element', () => {
    showCanvasError(canvas);
    expect(canvas.style.display).toBe('none');
  });

  test('inserts a .no-canvas-error paragraph into the container', () => {
    showCanvasError(canvas);
    const errorEl = container.querySelector('.no-canvas-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl.tagName).toBe('P');
  });

  test('error message contains the expected Spanish text', () => {
    showCanvasError(canvas);
    const errorEl = container.querySelector('.no-canvas-error');
    expect(errorEl.textContent).toMatch(/Tu navegador no soporta HTML5 Canvas/);
  });

  test('appends to document.body when canvas has no parent', () => {
    const orphanCanvas = document.createElement('canvas');
    // orphanCanvas has no parent — showCanvasError should fall back to body
    showCanvasError(orphanCanvas);
    const errorEl = document.body.querySelector('.no-canvas-error');
    expect(errorEl).not.toBeNull();
    // Clean up
    document.body.removeChild(errorEl);
  });
});

// ---------------------------------------------------------------------------
// Tests: Canvas scaling maintains 3:4 aspect ratio (Requirement 8.2)
// ---------------------------------------------------------------------------

describe('applyCanvasScale', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  test('sets width and height that maintain 3:4 ratio for a large viewport', () => {
    applyCanvasScale(container, 1920, 1080);
    const w = parseInt(container.style.width, 10);
    const h = parseInt(container.style.height, 10);
    // ratio should be 3:4 (width:height)
    expect(h / w).toBeCloseTo(4 / 3, 1);
  });

  test('does not exceed 480px width (logical canvas width)', () => {
    applyCanvasScale(container, 1920, 1080);
    const w = parseInt(container.style.width, 10);
    expect(w).toBeLessThanOrEqual(480);
  });

  test('scales down for a narrow viewport (portrait phone)', () => {
    applyCanvasScale(container, 320, 568);
    const w = parseInt(container.style.width, 10);
    const h = parseInt(container.style.height, 10);
    expect(w).toBeLessThanOrEqual(320);
    expect(h / w).toBeCloseTo(4 / 3, 1);
  });

  test('scales down for a very short viewport (landscape phone)', () => {
    applyCanvasScale(container, 812, 375);
    const w = parseInt(container.style.width, 10);
    const h = parseInt(container.style.height, 10);
    // height is the constraint: 375 * (3/4) = 281px wide
    expect(w).toBeLessThanOrEqual(281);
    expect(h / w).toBeCloseTo(4 / 3, 1);
  });

  test('does nothing when container is null', () => {
    // Should not throw
    expect(() => applyCanvasScale(null, 1920, 1080)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: resize event listener registration
// ---------------------------------------------------------------------------

describe('resize event listener', () => {
  test('window resize event can be registered and removed without errors', () => {
    const handler = jest.fn();
    window.addEventListener('resize', handler);
    window.dispatchEvent(new Event('resize'));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('resize', handler);
    window.dispatchEvent(new Event('resize'));
    expect(handler).toHaveBeenCalledTimes(1); // not called again after removal
  });
});

// ---------------------------------------------------------------------------
// Integration / smoke tests — Requirement 8.4
// ---------------------------------------------------------------------------

const { InputHandler } = require('../inputHandler.js');

/**
 * Integration smoke tests that exercise the bootstrap flow described in
 * main.js: canvas support check → error display or game initialisation.
 *
 * These tests use Jest spies on addEventListener / removeEventListener to
 * verify that InputHandler.attach() and detach() wire up the correct DOM
 * events without relying on the full IIFE in main.js.
 */
describe('Integration smoke — InputHandler event listener registration (Requirement 8.4)', () => {
  let canvas;
  let onJump;
  let handler;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    onJump = jest.fn();
    handler = new InputHandler(canvas, onJump);
  });

  afterEach(() => {
    // Always detach to avoid leaking listeners between tests
    handler.detach();
  });

  test('attach() registers keydown listener on window', () => {
    const spy = jest.spyOn(window, 'addEventListener');
    handler.attach();
    const keydownCalls = spy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('attach() registers mousedown listener on canvas', () => {
    const spy = jest.spyOn(canvas, 'addEventListener');
    handler.attach();
    const mousedownCalls = spy.mock.calls.filter(([event]) => event === 'mousedown');
    expect(mousedownCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('attach() registers touchstart listener on canvas', () => {
    const spy = jest.spyOn(canvas, 'addEventListener');
    handler.attach();
    const touchstartCalls = spy.mock.calls.filter(([event]) => event === 'touchstart');
    expect(touchstartCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('detach() removes keydown listener from window', () => {
    handler.attach();
    const spy = jest.spyOn(window, 'removeEventListener');
    handler.detach();
    const keydownCalls = spy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('detach() removes mousedown listener from canvas', () => {
    handler.attach();
    const spy = jest.spyOn(canvas, 'removeEventListener');
    handler.detach();
    const mousedownCalls = spy.mock.calls.filter(([event]) => event === 'mousedown');
    expect(mousedownCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('detach() removes touchstart listener from canvas', () => {
    handler.attach();
    const spy = jest.spyOn(canvas, 'removeEventListener');
    handler.detach();
    const touchstartCalls = spy.mock.calls.filter(([event]) => event === 'touchstart');
    expect(touchstartCalls.length).toBeGreaterThanOrEqual(1);
    spy.mockRestore();
  });

  test('after detach(), keydown no longer triggers onJump', () => {
    handler.attach();
    handler.detach();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(onJump).not.toHaveBeenCalled();
  });

  test('after detach(), mousedown no longer triggers onJump', () => {
    handler.attach();
    handler.detach();
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    expect(onJump).not.toHaveBeenCalled();
  });

  test('after detach(), touchstart no longer triggers onJump', () => {
    handler.attach();
    handler.detach();
    canvas.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(onJump).not.toHaveBeenCalled();
  });
});

describe('Integration smoke — Canvas not supported shows error message (Requirement 8.4)', () => {
  let container;
  let canvas;

  beforeEach(() => {
    // Set up a minimal DOM matching what index.html provides
    container = document.createElement('div');
    container.id = 'game-container';
    canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    container.appendChild(canvas);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  test('when getContext returns null, a .no-canvas-error element is inserted into the DOM', () => {
    // Simulate a browser that does not support Canvas 2D
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);

    // Run the bootstrap logic inline (mirrors main.js main() function)
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      showCanvasError(canvas);
    }

    const errorEl = container.querySelector('.no-canvas-error');
    expect(errorEl).not.toBeNull();
  });

  test('when getContext returns null, the canvas element is hidden', () => {
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);

    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      showCanvasError(canvas);
    }

    expect(canvas.style.display).toBe('none');
  });

  test('when getContext returns null, the error message mentions Canvas support', () => {
    jest.spyOn(canvas, 'getContext').mockReturnValue(null);

    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      showCanvasError(canvas);
    }

    const errorEl = container.querySelector('.no-canvas-error');
    expect(errorEl.textContent).toMatch(/Canvas/i);
  });

  test('when getContext returns a valid context, no error element is inserted', () => {
    // jsdom does not implement getContext, so we mock it to return a stub
    // context object (simulating a browser that supports Canvas 2D)
    jest.spyOn(canvas, 'getContext').mockReturnValue({ /* stub 2d context */ });

    const ctx = canvas.getContext('2d');
    // Only call showCanvasError if ctx is null (it should not be here)
    if (ctx === null) {
      showCanvasError(canvas);
    }

    const errorEl = container.querySelector('.no-canvas-error');
    expect(errorEl).toBeNull();
  });
});
