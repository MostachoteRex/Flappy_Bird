/**
 * Unit tests for PhysicsEngine
 *
 * Validates: Requirements 2.1, 2.3, 2.4
 */

const { PhysicsEngine } = require('../physics.js');
const { Bird } = require('../bird.js');

// Default physics constants (must match physics.js defaults)
const DEFAULT_GRAVITY = 0.28;
const DEFAULT_JUMP_VELOCITY = -6;
const DEFAULT_MAX_FALL_VELOCITY = 8;

describe('PhysicsEngine — unit tests', () => {
  let physics;

  beforeEach(() => {
    physics = new PhysicsEngine();
  });

  // ─── Y position after exactly N frames ───────────────────────────────────

  describe('Y position after exactly N frames without a jump', () => {
    /**
     * Helper: compute expected Y after N frames starting from given velocity and Y.
     * Mirrors the algorithm in physics.js.
     */
    function expectedStateAfterFrames(startY, startVelocity, frames) {
      let v = startVelocity;
      let y = startY;
      for (let i = 0; i < frames; i++) {
        v = Math.min(v + DEFAULT_GRAVITY, DEFAULT_MAX_FALL_VELOCITY);
        y += v;
      }
      return { y, velocity: v };
    }

    test('after 1 frame from velocity=0, Y increases by gravity', () => {
      const bird = { y: 100, velocity: 0 };
      physics.update(bird);
      expect(bird.velocity).toBeCloseTo(DEFAULT_GRAVITY);
      expect(bird.y).toBeCloseTo(100 + DEFAULT_GRAVITY);
    });

    test('after 2 frames from velocity=0, Y equals accumulated sum added to start', () => {
      const bird = { y: 0, velocity: 0 };
      const expected = expectedStateAfterFrames(0, 0, 2);
      physics.update(bird);
      physics.update(bird);
      expect(bird.velocity).toBeCloseTo(expected.velocity);
      expect(bird.y).toBeCloseTo(expected.y);
    });

    test('after 5 frames from velocity=0, Y matches accumulated sum', () => {
      const bird = { y: 200, velocity: 0 };
      const expected = expectedStateAfterFrames(200, 0, 5);
      for (let i = 0; i < 5; i++) physics.update(bird);
      expect(bird.y).toBeCloseTo(expected.y);
      expect(bird.velocity).toBeCloseTo(expected.velocity);
    });

    test('after 10 frames from velocity=0, Y matches accumulated sum', () => {
      const bird = { y: 320, velocity: 0 };
      const expected = expectedStateAfterFrames(320, 0, 10);
      for (let i = 0; i < 10; i++) physics.update(bird);
      expect(bird.y).toBeCloseTo(expected.y);
      expect(bird.velocity).toBeCloseTo(expected.velocity);
    });

    test('after 30 frames from velocity=0, Y matches accumulated sum (velocity capped at maxFallVelocity)', () => {
      const bird = { y: 0, velocity: 0 };
      const expected = expectedStateAfterFrames(0, 0, 30);
      for (let i = 0; i < 30; i++) physics.update(bird);
      expect(bird.y).toBeCloseTo(expected.y);
      expect(bird.velocity).toBeCloseTo(DEFAULT_MAX_FALL_VELOCITY); // saturated
    });

    test('starting from a high initial velocity (above maxFallVelocity), velocity is clamped immediately', () => {
      const bird = { y: 0, velocity: 20 };
      physics.update(bird);
      expect(bird.velocity).toBeCloseTo(DEFAULT_MAX_FALL_VELOCITY);
      expect(bird.y).toBeCloseTo(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('starting from a negative velocity (after jump), Y position decreases then increases', () => {
      const bird = { y: 300, velocity: DEFAULT_JUMP_VELOCITY };
      const expected = expectedStateAfterFrames(300, DEFAULT_JUMP_VELOCITY, 3);
      for (let i = 0; i < 3; i++) physics.update(bird);
      expect(bird.y).toBeCloseTo(expected.y);
      expect(bird.velocity).toBeCloseTo(expected.velocity);
    });

    test('uses a real Bird instance and Y matches expected after N frames', () => {
      const bird = new Bird(80, 320, 15);
      const expected = expectedStateAfterFrames(320, 0, 8);
      for (let i = 0; i < 8; i++) physics.update(bird);
      expect(bird.y).toBeCloseTo(expected.y);
      expect(bird.velocity).toBeCloseTo(expected.velocity);
    });
  });

  // ─── Velocity cap (maxFallVelocity) ──────────────────────────────────────

  describe('velocity never exceeds maxFallVelocity', () => {
    test('velocity does not exceed maxFallVelocity after 1000 frames starting from 0', () => {
      const bird = { y: 0, velocity: 0 };
      for (let i = 0; i < 1000; i++) physics.update(bird);
      expect(bird.velocity).toBeLessThanOrEqual(DEFAULT_MAX_FALL_VELOCITY);
      expect(bird.velocity).toBeCloseTo(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('velocity does not exceed maxFallVelocity after 1000 frames starting from jumpVelocity', () => {
      const bird = { y: 0, velocity: DEFAULT_JUMP_VELOCITY };
      for (let i = 0; i < 1000; i++) physics.update(bird);
      expect(bird.velocity).toBeLessThanOrEqual(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('velocity does not exceed maxFallVelocity even if initial velocity is already above max', () => {
      const bird = { y: 0, velocity: 100 };
      for (let i = 0; i < 1000; i++) physics.update(bird);
      expect(bird.velocity).toBeLessThanOrEqual(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('velocity is exactly maxFallVelocity after saturation (many frames from 0)', () => {
      const bird = { y: 0, velocity: 0 };
      for (let i = 0; i < 100; i++) physics.update(bird);
      expect(bird.velocity).toBe(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('custom maxFallVelocity is respected', () => {
      const customPhysics = new PhysicsEngine(0.5, -8, 5);
      const bird = { y: 0, velocity: 0 };
      for (let i = 0; i < 100; i++) customPhysics.update(bird);
      expect(bird.velocity).toBeLessThanOrEqual(5);
      expect(bird.velocity).toBe(5);
    });
  });

  // ─── jump() ──────────────────────────────────────────────────────────────

  describe('jump()', () => {
    test('sets velocity to jumpVelocity regardless of prior velocity', () => {
      const bird = { y: 200, velocity: 12 };
      physics.jump(bird);
      expect(bird.velocity).toBe(DEFAULT_JUMP_VELOCITY);
    });

    test('does not change Y position', () => {
      const bird = { y: 300, velocity: 5 };
      physics.jump(bird);
      expect(bird.y).toBe(300);
    });
  });

  // ─── Constructor defaults ─────────────────────────────────────────────────

  describe('constructor', () => {
    test('default parameters match expected values', () => {
      expect(physics.gravity).toBe(DEFAULT_GRAVITY);
      expect(physics.jumpVelocity).toBe(DEFAULT_JUMP_VELOCITY);
      expect(physics.maxFallVelocity).toBe(DEFAULT_MAX_FALL_VELOCITY);
    });

    test('custom parameters are stored correctly', () => {
      const custom = new PhysicsEngine(1.0, -10, 15);
      expect(custom.gravity).toBe(1.0);
      expect(custom.jumpVelocity).toBe(-10);
      expect(custom.maxFallVelocity).toBe(15);
    });
  });
});
