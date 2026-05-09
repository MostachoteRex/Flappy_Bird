// main.js — Bootstrap: instantiates Game and starts

(function () {
  'use strict';

  /**
   * Shows a canvas-not-supported error message in the DOM.
   * Hides the canvas and inserts a <p class="no-canvas-error"> element.
   * @param {HTMLCanvasElement} canvas
   */
  function showCanvasError(canvas) {
    const errorEl = document.createElement('p');
    errorEl.className = 'no-canvas-error';
    errorEl.textContent =
      'Tu navegador no soporta HTML5 Canvas. Por favor, actualiza tu navegador.';

    const container = canvas.parentElement || document.body;
    canvas.style.display = 'none';
    container.appendChild(errorEl);
  }

  /**
   * Scales the canvas CSS display size to fill the viewport while maintaining
   * the 3:4 aspect ratio (480 × 640). The logical canvas resolution stays fixed.
   *
   * The CSS in style.css already handles this via `min()` and `aspect-ratio`,
   * but this listener ensures the container is recalculated on every resize
   * (useful for browsers that don't fully support the CSS-only approach).
   */
  function applyCanvasScale() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Desired display size: largest 3:4 box that fits in the viewport
    const maxWidth = Math.min(vw, Math.floor(vh * (3 / 4)));
    const displayWidth = Math.min(maxWidth, 480);
    const displayHeight = Math.floor(displayWidth * (4 / 3));

    container.style.width = displayWidth + 'px';
    container.style.height = displayHeight + 'px';
  }

  /**
   * Entry point — runs after the DOM is ready.
   */
  function main() {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
      console.error('main.js: #gameCanvas element not found in the DOM.');
      return;
    }

    // Check for Canvas 2D support
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      showCanvasError(canvas);
      return;
    }

    // Apply initial scaling and register resize listener
    applyCanvasScale();
    window.addEventListener('resize', applyCanvasScale);

    // Instantiate and initialise the game
    const game = new Game(canvas); // eslint-disable-line no-undef
    game.init();

    // Render the idle screen immediately so the player sees the start prompt
    game.renderer.render(
      game.getState(),
      game.bird,
      [],
      0,
      game.scoreManager.getHighScore()
    );
  }

  // Run after the DOM is fully parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
