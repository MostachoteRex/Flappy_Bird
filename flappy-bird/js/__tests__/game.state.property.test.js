/**
 * Property-based tests for Game state machine transitions
 *
 * // Feature: flappy-bird-game, Property 1: valid state transitions
 *
 * **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
 */

const fc = require('fast-check');
const { Game } = require('../game.js');

// Valid states as a set for assertions
const VALID_STATES = new Set(['idle', 'playing', 'game_over']);

// Valid transitions map
const VALID_TRANSITIONS = {
  idle: 'playing',
  playing: 'game_over',
  game_over: 'idle',
};

// All possible states as an array for generators
const ALL_STATES = ['idle', 'playing', 'game_over'];

/**
 * Helper: create a Game instance with a minimal canvas mock.
 * The Game constructor only stores the canvas reference; it does not
 * call any canvas methods during construction, so a plain object suffices.
 */
function makeGame() {
  const canvasMock = {};
  return new Game(canvasMock);
}

/**
 * Helper: force a Game instance into a specific state by following
 * the valid transition chain from 'idle'.
 *
 * idle → playing → game_over → idle → ...
 */
function forceState(game, targetState) {
  // Reset to idle by cycling through game_over if needed
  // We drive the state machine along its valid path until we reach targetState
  const path = ['idle', 'playing', 'game_over'];
  const targetIndex = path.indexOf(targetState);

  // game always starts at 'idle'; drive forward along the chain
  for (let i = 0; i < targetIndex; i++) {
    game.setState(path[i + 1]);
  }
}

// ---------------------------------------------------------------------------
// Property 1: State closure — the resulting state always belongs to the
// valid set {idle, playing, game_over}
// ---------------------------------------------------------------------------

describe('Game state machine — Property 1: valid state transitions', () => {
  /**
   * **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
   *
   * Property 1a (closure): For any current state and any attempted next-state
   * input (including unknown/invalid strings), the resulting state is always
   * a member of {idle, playing, game_over}.
   */
  test(
    'resulting state always belongs to {idle, playing, game_over} regardless of input',
    () => {
      fc.assert(
        fc.property(
          // Arbitrary current state (one of the three valid states)
          fc.constantFrom(...ALL_STATES),
          // Arbitrary next-state input: mix of valid states and random strings
          fc.oneof(
            fc.constantFrom(...ALL_STATES),
            fc.string()
          ),
          (currentState, nextStateInput) => {
            const game = makeGame();
            forceState(game, currentState);

            // Attempt the transition
            game.setState(nextStateInput);

            // The resulting state must always be in the valid set
            expect(VALID_STATES.has(game.getState())).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
   *
   * Property 1b (valid transitions succeed): For any current state, attempting
   * the one valid next state always succeeds — the state changes to the
   * expected next state.
   *
   * Valid sequence: idle → playing → game_over → idle
   */
  test(
    'valid transitions always succeed: idle→playing, playing→game_over, game_over→idle',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATES),
          (currentState) => {
            const game = makeGame();
            forceState(game, currentState);

            const expectedNext = VALID_TRANSITIONS[currentState];
            game.setState(expectedNext);

            expect(game.getState()).toBe(expectedNext);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * **Validates: Requirements 1.1, 1.6**
   *
   * Property 1c (invalid transitions are rejected): For any current state,
   * attempting a transition to any state that is NOT the valid next state
   * leaves the current state unchanged.
   *
   * Invalid transitions:
   *   idle       → game_over  (skips playing)
   *   playing    → idle       (goes backwards)
   *   game_over  → playing    (skips idle)
   */
  test(
    'invalid transitions are silently rejected — state remains unchanged',
    () => {
      // Build the set of invalid transitions explicitly
      const invalidTransitions = [
        { from: 'idle',       to: 'game_over' },
        { from: 'playing',    to: 'idle'      },
        { from: 'game_over',  to: 'playing'   },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...invalidTransitions),
          ({ from, to }) => {
            const game = makeGame();
            forceState(game, from);

            const stateBefore = game.getState();
            game.setState(to);
            const stateAfter = game.getState();

            // State must be unchanged after an invalid transition
            expect(stateAfter).toBe(stateBefore);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  /**
   * **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
   *
   * Property 1d (full cycle): The complete valid cycle
   * idle → playing → game_over → idle can be repeated an arbitrary number
   * of times, and after each full cycle the state returns to 'idle'.
   */
  test(
    'full cycle idle→playing→game_over→idle can be repeated N times and always returns to idle',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (cycles) => {
            const game = makeGame();

            for (let i = 0; i < cycles; i++) {
              expect(game.getState()).toBe('idle');
              game.setState('playing');
              expect(game.getState()).toBe('playing');
              game.setState('game_over');
              expect(game.getState()).toBe('game_over');
              game.setState('idle');
            }

            expect(game.getState()).toBe('idle');
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
