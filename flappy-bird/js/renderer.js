// renderer.js — Renderer

/**
 * Visual constants for rendering.
 */
const RENDER_CONFIG = {
  canvas: {
    width: 480,
    height: 640,
  },
  ground: {
    height: 60,
    color: '#8B4513',       // Brown
    grassColor: '#2d5a1b',  // Dark green strip on top of ground
    grassHeight: 8,
  },
  background: {
    topColor: '#87CEEB',    // Light sky blue
    bottomColor: '#b0e0ff', // Slightly lighter blue
  },
  bird: {
    fillColor: '#FFD700',   // Yellow
    strokeColor: '#FF8C00', // Orange border
    strokeWidth: 3,
  },
  pipe: {
    fillColor: '#2ecc40',   // Green
    strokeColor: '#1a7a28', // Darker green border
    strokeWidth: 3,
    capHeight: 20,          // Height of the pipe cap/lip
    capOverhang: 5,         // How much the cap extends beyond pipe width on each side
  },
  score: {
    font: 'bold 36px Arial',
    color: '#ffffff',
    shadowColor: '#000000',
    shadowBlur: 4,
  },
  ui: {
    titleFont: 'bold 48px Arial',
    subtitleFont: '22px Arial',
    labelFont: 'bold 28px Arial',
    valueFont: '24px Arial',
    textColor: '#ffffff',
    shadowColor: '#000000',
    shadowBlur: 4,
  },
};

class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(canvas, ctx) {
    this._canvas = canvas;
    this._ctx = ctx;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Dispatches rendering based on the current game state.
   *
   * @param {'idle' | 'playing' | 'game_over'} state
   * @param {{ x: number, y: number, radius: number }} bird
   * @param {Array<{ x: number, gapY: number, gapHeight: number, width: number }>} pipes
   * @param {number} score
   * @param {number} highScore
   */
  render(state, bird, pipes, score, highScore) {
    switch (state) {
      case 'idle':
        this._renderIdle();
        break;
      case 'playing':
        this._renderPlaying(bird, pipes, score);
        break;
      case 'game_over':
        this._renderGameOver(score, highScore);
        break;
      default:
        // Unknown state — render idle as fallback
        this._renderIdle();
    }
  }

  // ---------------------------------------------------------------------------
  // State-level render methods (private)
  // ---------------------------------------------------------------------------

  /**
   * Renders the idle/start screen with title and instructions.
   * Req 6.1, 6.2, 6.3, 6.6
   */
  _renderIdle() {
    this._clearCanvas();
    this._drawBackground();
    this._drawGround();

    const ctx = this._ctx;
    const cx = this._canvas.width / 2;

    // Title
    ctx.save();
    ctx.font = RENDER_CONFIG.ui.titleFont;
    ctx.fillStyle = RENDER_CONFIG.ui.textColor;
    ctx.shadowColor = RENDER_CONFIG.ui.shadowColor;
    ctx.shadowBlur = RENDER_CONFIG.ui.shadowBlur;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FLAPPY BIRD', cx, 220);

    // Subtitle / instructions
    ctx.font = RENDER_CONFIG.ui.subtitleFont;
    ctx.fillText('Press Space / Click / Tap to start', cx, 310);
    ctx.restore();
  }

  /**
   * Renders an active game frame.
   * Req 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 5.3
   *
   * @param {{ x: number, y: number, radius: number }} bird
   * @param {Array} pipes
   * @param {number} score
   */
  _renderPlaying(bird, pipes, score) {
    this._clearCanvas();
    this._drawBackground();
    this._drawPipes(pipes);
    this._drawGround();
    this._drawBird(bird);
    this._drawScore(score);
  }

  /**
   * Renders the game-over screen with final score and high score.
   * Req 5.7, 6.1, 6.2, 6.3, 6.6
   *
   * @param {number} score
   * @param {number} highScore
   */
  _renderGameOver(score, highScore) {
    this._clearCanvas();
    this._drawBackground();
    this._drawGround();

    const ctx = this._ctx;
    const cx = this._canvas.width / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = RENDER_CONFIG.ui.shadowColor;
    ctx.shadowBlur = RENDER_CONFIG.ui.shadowBlur;
    ctx.fillStyle = RENDER_CONFIG.ui.textColor;

    // "GAME OVER" heading
    ctx.font = RENDER_CONFIG.ui.titleFont;
    ctx.fillText('GAME OVER', cx, 200);

    // Final score
    ctx.font = RENDER_CONFIG.ui.labelFont;
    ctx.fillText('Score: ' + score, cx, 290);

    // High score
    ctx.font = RENDER_CONFIG.ui.labelFont;
    ctx.fillText('Best: ' + highScore, cx, 340);

    // Restart hint
    ctx.font = RENDER_CONFIG.ui.subtitleFont;
    ctx.fillText('Press Space / Click / Tap to restart', cx, 420);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Drawing primitives (private)
  // ---------------------------------------------------------------------------

  /**
   * Clears the entire canvas.
   * Req 6.2
   */
  _clearCanvas() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  /**
   * Draws a sky gradient background.
   * Req 6.3
   */
  _drawBackground() {
    const ctx = this._ctx;
    const { width, height } = this._canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, RENDER_CONFIG.background.topColor);
    gradient.addColorStop(1, RENDER_CONFIG.background.bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draws the bird as a yellow circle with an orange border.
   * Req 6.4 — circle of radius 15px (30×30 sprite equivalent)
   *
   * @param {{ x: number, y: number, radius: number }} bird
   */
  _drawBird(bird) {
    const ctx = this._ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = RENDER_CONFIG.bird.fillColor;
    ctx.fill();
    ctx.lineWidth = RENDER_CONFIG.bird.strokeWidth;
    ctx.strokeStyle = RENDER_CONFIG.bird.strokeColor;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws all active pipes (top + bottom segments) in green with a darker border.
   * Req 6.5
   *
   * @param {Array<{ x: number, gapY: number, gapHeight: number, width: number }>} pipes
   */
  _drawPipes(pipes) {
    for (const pipe of pipes) {
      this._drawSinglePipe(pipe);
    }
  }

  /**
   * Draws a single pipe pair (top + bottom).
   *
   * @param {{ x: number, gapY: number, gapHeight: number, width: number }} pipe
   */
  _drawSinglePipe(pipe) {
    const ctx = this._ctx;
    const { fillColor, strokeColor, strokeWidth, capHeight, capOverhang } = RENDER_CONFIG.pipe;
    const { x, gapY, gapHeight, width } = pipe;

    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // --- Top pipe ---
    const topHeight = gapY;
    if (topHeight > 0) {
      // Main body of top pipe
      ctx.fillRect(x, 0, width, topHeight);
      ctx.strokeRect(x, 0, width, topHeight);

      // Cap at the bottom of the top pipe
      const capX = x - capOverhang;
      const capW = width + capOverhang * 2;
      const capY = topHeight - capHeight;
      ctx.fillRect(capX, capY, capW, capHeight);
      ctx.strokeRect(capX, capY, capW, capHeight);
    }

    // --- Bottom pipe ---
    const bottomY = gapY + gapHeight;
    const bottomHeight = this._canvas.height - bottomY;
    if (bottomHeight > 0) {
      // Cap at the top of the bottom pipe
      const capX = x - capOverhang;
      const capW = width + capOverhang * 2;
      ctx.fillRect(capX, bottomY, capW, capHeight);
      ctx.strokeRect(capX, bottomY, capW, capHeight);

      // Main body of bottom pipe
      ctx.fillRect(x, bottomY + capHeight, width, bottomHeight - capHeight);
      ctx.strokeRect(x, bottomY + capHeight, width, bottomHeight - capHeight);
    }

    ctx.restore();
  }

  /**
   * Draws the ground strip at the bottom of the canvas.
   * Req 6.6 — brown/dark green color, ~60px tall
   */
  _drawGround() {
    const ctx = this._ctx;
    const { width, height } = this._canvas;
    const { height: groundH, color, grassColor, grassHeight } = RENDER_CONFIG.ground;
    const groundY = height - groundH;

    // Brown ground base
    ctx.fillStyle = color;
    ctx.fillRect(0, groundY, width, groundH);

    // Dark green grass strip on top
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, groundY, width, grassHeight);
  }

  /**
   * Draws the current score in the upper central area of the canvas.
   * Req 5.3
   *
   * @param {number} score
   */
  _drawScore(score) {
    const ctx = this._ctx;
    ctx.save();
    ctx.font = RENDER_CONFIG.score.font;
    ctx.fillStyle = RENDER_CONFIG.score.color;
    ctx.shadowColor = RENDER_CONFIG.score.shadowColor;
    ctx.shadowBlur = RENDER_CONFIG.score.shadowBlur;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(score), this._canvas.width / 2, 20);
    ctx.restore();
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Renderer };
}
