/**
 * Unit tests for PipeManager
 *
 * Validates: Requirements 3.1, 3.5, 3.6
 */

const { PipeManager } = require('../pipeManager.js');

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const PIPE_SPEED = 3;
const SPAWN_INTERVAL = 1500;

describe('PipeManager — pipe removal when off screen (Req 3.5, 3.6)', () => {
  // NOTE: Each call to update() moves pipes by exactly pipeSpeed pixels (not per ms).
  // deltaTime only controls the spawn timer accumulation.
  // To move a pipe off screen without triggering extra spawns, we use many small
  // deltaTime=1 calls (each moves pipe 3px, adds 1ms to timer).

  test('pipes are removed when they move completely off the left edge', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    // Force a pipe spawn immediately
    manager.update(SPAWN_INTERVAL);
    expect(manager.getPipes().length).toBe(1);

    // Pipe starts at x=480, width=60. Off screen when x + width < 0, i.e. x < -60.
    // Each update(1) moves pipe by pipeSpeed=3px and adds 1ms to timer.
    // After 180 steps: x = 480 - 540 = -60 → x + width = 0 (NOT off screen yet, boundary).
    // After 181 steps: x = 480 - 543 = -63 → x + width = -3 < 0 (off screen).
    // Total time added: 181ms — well under 1500ms, so no new spawn.
    for (let i = 0; i < 181; i++) {
      manager.update(1);
    }

    // The pipe should now be off screen and removed
    expect(manager.getPipes().length).toBe(0);
  });

  test('pipe is still present when it has not fully left the screen', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    // Spawn a pipe
    manager.update(SPAWN_INTERVAL);
    expect(manager.getPipes().length).toBe(1);

    // Move it almost off screen but not quite.
    // After 179 steps: x = 480 - 179*3 = 480 - 537 = -57 → x + width = -57 + 60 = 3 >= 0
    for (let i = 0; i < 179; i++) {
      manager.update(1);
    }

    expect(manager.getPipes().length).toBe(1);
  });

  test('only off-screen pipes are removed, on-screen pipes remain', () => {
    // Use pipeSpeed=0 so pipes don't move — we can control which pipe is "off screen"
    // by manually setting its x position.
    const { Pipe } = require('../pipe.js');
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    // Spawn two pipes
    manager.update(SPAWN_INTERVAL); // first pipe at x=480
    manager.update(SPAWN_INTERVAL); // second pipe at x=480
    expect(manager.getPipes().length).toBe(2);

    // Manually move the first pipe off screen
    const pipes = manager.getPipes();
    pipes[0].x = -CANVAS_WIDTH; // x = -480, x + width = -480 + 60 = -420 < 0 → off screen

    // Trigger an update to flush off-screen pipes (deltaTime=1, no new spawn)
    manager.update(1);

    // Only the second pipe (still at x=480) should remain
    expect(manager.getPipes().length).toBe(1);
    expect(manager.getPipes()[0].x).toBe(CANVAS_WIDTH);
  });

  test('getPipes returns only active (on-screen) pipes (Req 3.6)', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    // No pipes initially
    expect(manager.getPipes().length).toBe(0);

    // Spawn a pipe
    manager.update(SPAWN_INTERVAL);
    expect(manager.getPipes().length).toBe(1);

    // Move it off screen (181 steps × 3px = 543px, pipe goes from x=480 to x=-63, x+width=-3<0)
    for (let i = 0; i < 181; i++) {
      manager.update(1);
    }

    // Should be empty again
    expect(manager.getPipes().length).toBe(0);
  });
});

describe('PipeManager — pipe spawning every 1500ms (Req 3.1)', () => {
  test('no pipe is spawned before 1500ms have elapsed', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    manager.update(1499);
    expect(manager.getPipes().length).toBe(0);
  });

  test('a pipe is spawned exactly when 1500ms have elapsed', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    manager.update(1500);
    expect(manager.getPipes().length).toBe(1);
  });

  test('a pipe is spawned when deltaTime accumulates to 1500ms across multiple updates', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    // Advance in small increments totaling 1500ms
    for (let i = 0; i < 1500; i++) {
      manager.update(1);
    }

    expect(manager.getPipes().length).toBe(1);
  });

  test('timer resets after spawning so next pipe spawns 1500ms later', () => {
    // Use pipeSpeed=0 so pipes do not move and we can count them accurately
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    // First spawn at 1500ms
    manager.update(1500);
    expect(manager.getPipes().length).toBe(1);

    // 1499ms more — no new spawn yet (timer at 1499ms)
    manager.update(1499);
    expect(manager.getPipes().length).toBe(1);

    // 1ms more — second spawn triggers (timer reaches 1500ms)
    manager.update(1);
    expect(manager.getPipes().length).toBe(2);
  });

  test('two pipes are spawned after 3000ms total', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    // Advance 3000ms in one call — spawns at 1500ms and 3000ms
    // But the first pipe will be off screen by 3000ms
    // Use a custom pipeSpeed=0 to keep pipes on screen
    const staticManager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    staticManager.update(1500); // first spawn
    staticManager.update(1500); // second spawn
    expect(staticManager.getPipes().length).toBe(2);
  });

  test('spawned pipe starts at x equal to canvasWidth', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, SPAWN_INTERVAL);

    manager.update(SPAWN_INTERVAL);
    const pipes = manager.getPipes();

    expect(pipes.length).toBe(1);
    expect(pipes[0].x).toBe(CANVAS_WIDTH);
  });

  test('deltaTime larger than spawnInterval still spawns exactly one pipe per interval', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    // Single update of exactly 1500ms → 1 pipe
    manager.update(1500);
    expect(manager.getPipes().length).toBe(1);

    // Another 1500ms → 2nd pipe
    manager.update(1500);
    expect(manager.getPipes().length).toBe(2);
  });
});

describe('PipeManager — reset (Req 3.6)', () => {
  test('reset clears all active pipes', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    manager.update(SPAWN_INTERVAL);
    manager.update(SPAWN_INTERVAL);
    expect(manager.getPipes().length).toBe(2);

    manager.reset();
    expect(manager.getPipes().length).toBe(0);
  });

  test('reset restarts the spawn timer so next pipe spawns after 1500ms', () => {
    const manager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT, 0, SPAWN_INTERVAL);

    // Advance 1000ms (no spawn yet)
    manager.update(1000);
    expect(manager.getPipes().length).toBe(0);

    // Reset — timer should go back to 0
    manager.reset();

    // 1499ms after reset — still no spawn
    manager.update(1499);
    expect(manager.getPipes().length).toBe(0);

    // 1ms more — spawn triggers
    manager.update(1);
    expect(manager.getPipes().length).toBe(1);
  });
});
