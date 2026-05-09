// scoreManager.js — Score Manager

class ScoreManager {
  /**
   * @param {string} storageKey - localStorage key for persisting high score
   */
  constructor(storageKey = 'flappyBirdHighScore') {
    this.storageKey = storageKey;
    this.score = 0;
    this.highScore = 0;
  }

  /**
   * Resets the current score to 0 and loads the high score from localStorage.
   */
  reset() {
    this.score = 0;
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.highScore = stored !== null ? parseInt(stored, 10) : 0;
      if (isNaN(this.highScore)) {
        this.highScore = 0;
      }
    } catch (e) {
      // localStorage not available; keep highScore as-is (in-memory)
      console.warn('localStorage not available:', e);
    }
  }

  /**
   * Returns the current score.
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Returns the current high score.
   * @returns {number}
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * Checks each pipe to see if the bird has crossed its midpoint.
   * Awards 1 point per pipe crossing (detected once per pipe via pipe.scored flag).
   *
   * @param {{ x: number }} bird - The bird object with an x property
   * @param {Array<{ x: number, width: number, scored: boolean }>} pipes - Active pipes
   */
  checkAndScore(bird, pipes) {
    for (const pipe of pipes) {
      if (!pipe.scored && bird.x > pipe.x + pipe.width / 2) {
        this.score += 1;
        pipe.scored = true;
        if (this.score > this.highScore) {
          this.highScore = this.score;
        }
      }
    }
  }

  /**
   * Persists the high score to localStorage if the current score is a new record.
   * Silently fails if localStorage is unavailable (e.g. private browsing mode).
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    try {
      localStorage.setItem(this.storageKey, this.highScore);
    } catch (e) {
      // Silently fail: high score persists in memory only
      console.warn('localStorage not available:', e);
    }
  }
}

// Support both browser (global) and Node/Jest (module.exports) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScoreManager };
}
