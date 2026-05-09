// pipeManager.js — Pipe Manager

// Support both browser (global) and Node/Jest (module.exports) environments
const PipeClass = typeof module !== 'undefined' && module.exports
  ? require('./pipe.js').Pipe
  : Pipe;

class PipeManager {
  /**
   * @param {number} canvasWidth    - Width of the canvas (e.g. 480)
   * @param {number} canvasHeight   - Height of the canvas (e.g. 640)
   * @param {number} pipeSpeed      - Pixels per frame pipes move left (default: 3)
   * @param {number} spawnInterval  - Milliseconds between pipe spawns (default: 1500)
   */
  constructor(canvasWidth, canvasHeight, pipeSpeed = 3, spawnInterval = 1500) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.pipeSpeed = pipeSpeed;
    this.spawnInterval = spawnInterval;

    // Game config constants
    this._gapHeight = 150;
    this._minPipeHeight = 50;
    this._pipeWidth = 60;

    this._pipes = [];
    this._timeSinceLastSpawn = 0;
  }

  /**
   * Updates all active pipes: moves them left, spawns new ones based on timer,
   * and removes pipes that have gone off-screen.
   *
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    // Accumulate time for spawn timer
    this._timeSinceLastSpawn += deltaTime;

    // Move all active pipes to the left
    for (const pipe of this._pipes) {
      pipe.x -= this.pipeSpeed;
    }

    // Spawn a new pipe if the interval has elapsed
    if (this._timeSinceLastSpawn >= this.spawnInterval) {
      this._spawnPipe();
      this._timeSinceLastSpawn = 0;
    }

    // Remove pipes that have moved completely off the left edge
    this._pipes = this._pipes.filter(pipe => !pipe.isOffScreen(this.canvasWidth));
  }

  /**
   * Returns the list of currently active pipes.
   *
   * @returns {Pipe[]}
   */
  getPipes() {
    return this._pipes;
  }

  /**
   * Clears all active pipes and resets the spawn timer.
   */
  reset() {
    this._pipes = [];
    this._timeSinceLastSpawn = 0;
  }

  /**
   * Creates a new Pipe at the right edge of the canvas with a randomly
   * calculated gap position and adds it to the active pipes list.
   *
   * @private
   */
  _spawnPipe() {
    const gapY = this._calculateGapY();
    const pipe = new PipeClass(
      this.canvasWidth,
      this.canvasHeight,
      gapY,
      this._gapHeight,
      this._pipeWidth
    );
    this._pipes.push(pipe);
  }

  /**
   * Calculates a random Y position for the gap that ensures both the top
   * and bottom pipe segments meet the minimum height requirement (50px).
   *
   * Formula:
   *   gapY = random(minPipeHeight, canvasHeight - gapHeight - minPipeHeight)
   *
   * This guarantees:
   *   - Top pipe height = gapY >= minPipeHeight (50px)
   *   - Bottom pipe height = canvasHeight - gapY - gapHeight >= minPipeHeight (50px)
   *
   * @private
   * @returns {number} A valid random gapY value
   */
  _calculateGapY() {
    const min = this._minPipeHeight;
    const max = this.canvasHeight - this._gapHeight - this._minPipeHeight;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PipeManager };
}
