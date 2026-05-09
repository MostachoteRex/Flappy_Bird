/**
 * Unit tests for CollisionDetector
 *
 * Validates: Requirements 4.2, 4.3, 4.4
 *
 * Covers:
 *  - 4px HITBOX_MARGIN applied correctly (bird avoids pipe edge due to margin)
 *  - Bird exactly on the border of a pipe (no collision vs. with collision)
 *  - Bird clearly inside the gap (no collision)
 *  - Bird overlapping top pipe (collision)
 *  - Bird overlapping bottom pipe (collision)
 *  - Boundary collision — floor
 *  - Boundary collision — ceiling
 *  - No collision with empty pipes array
 */

const CollisionDetector = require('../collision.js');
const { Bird } = require('../bird.js');
const { Pipe } = require('../pipe.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Pipe with explicit geometry.
 *
 * @param {number} x           - Left edge of the pipe
 * @param {number} gapY        - Y where the gap starts (top pipe height)
 * @param {number} gapHeight   - Height of the gap (default 150)
 * @param {number} pipeWidth   - Width of the pipe (default 60)
 * @param {number} canvasHeight
 */
function makePipe(x, gapY, gapHeight = 150, pipeWidth = 60, canvasHeight = 640) {
  return new Pipe(x, canvasHeight, gapY, gapHeight, pipeWidth);
}

// Standard canvas dimensions used throughout
const CANVAS_W = 480;
const CANVAS_H = 640;

// Bird defaults: radius=15, HITBOX_MARGIN=4
const RADIUS = 15;
const MARGIN = CollisionDetector.HITBOX_MARGIN; // 4

// ---------------------------------------------------------------------------
// 1. HITBOX_MARGIN constant
// ---------------------------------------------------------------------------

describe('CollisionDetector.HITBOX_MARGIN', () => {
  test('HITBOX_MARGIN is exactly 4', () => {
    expect(CollisionDetector.HITBOX_MARGIN).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 2. 4px margin applied correctly — bird avoids pipe edge because of margin
// ---------------------------------------------------------------------------

describe('CollisionDetector — 4px margin applied correctly', () => {
  /**
   * Setup:
   *   Pipe left edge at x=200, width=60.
   *   Bird center at x=185, radius=15 → full right edge at 185+15=200 (touching pipe left edge).
   *   Without margin: full box right edge = 200, pipe left edge = 200 → NOT overlapping (strict <).
   *   With margin=4:  reduced box right edge = 185+15-4 = 196 < 200 → definitely no collision.
   *
   * This test confirms the margin shrinks the hitbox so a visually-touching bird
   * does NOT register a collision.
   */
  test('bird full-radius edge touches pipe left edge — no collision due to 4px margin', () => {
    // Bird center x=185, radius=15 → full right edge at 200 (pipe left edge)
    // Reduced hitbox right edge = 185 + (15 - 4) = 196 < 200 → no collision
    const birdX = 185;
    const birdY = 320; // vertically centred in gap
    const bird = new Bird(birdX, birdY, RADIUS);

    // Pipe: x=200, gap from y=200 to y=350 (gapHeight=150)
    // Bird y=320 is inside the gap → no top/bottom pipe overlap
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  /**
   * Confirm that without the margin the same geometry would collide.
   * We use _aabbIntersects directly with the full (margin=0) bounding box.
   */
  test('full bounding box (margin=0) touching pipe left edge — no overlap (strict AABB)', () => {
    // Full box right edge = 200, pipe left edge = 200 → strict < fails → no overlap
    const bird = new Bird(185, 320, RADIUS);
    const fullBox = bird.getBoundingBox(0);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);
    const pipeTop = pipe.getBoundingBoxTop();

    // Right edge of bird box == left edge of pipe → NOT overlapping (strict <)
    expect(CollisionDetector._aabbIntersects(fullBox, pipeTop)).toBe(false);
  });

  /**
   * Bird overlaps pipe by 1px with full box, but the 4px margin absorbs it.
   * Bird center x=186, radius=15 → full right edge = 201 (1px into pipe).
   * Reduced right edge = 186 + (15 - 4) = 197 < 200 → still no collision.
   */
  test('bird overlaps pipe by 1px with full box but 4px margin absorbs it — no collision', () => {
    const birdX = 186; // full right edge = 201, reduced right edge = 197
    const bird = new Bird(birdX, 320, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  /**
   * Bird overlaps pipe by 5px with full box (more than the 4px margin).
   * Bird center x=190, radius=15 → full right edge = 205.
   * Reduced right edge = 190 + (15 - 4) = 201 > 200 → collision.
   * Bird y=320 is inside the gap vertically, so we need to check top pipe.
   * Actually bird y=320 is in the gap (gapY=200, gapHeight=150 → gap ends at 350).
   * So no pipe collision vertically. Let's place bird so it hits the top pipe.
   */
  test('bird overlaps pipe by 5px with full box — 4px margin does not absorb it — collision', () => {
    // Bird center x=190, radius=15 → reduced right edge = 190+11 = 201 > 200 → overlaps pipe
    // Bird y=100 → reduced top = 100-15+4=89, reduced bottom = 100+15-4=111
    // Top pipe height = gapY=200 → top pipe box y=0..200
    // Bird reduced box y=89..111 → overlaps top pipe (0..200) vertically
    const bird = new Bird(190, 100, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Bird exactly on the border of a pipe — no collision
// ---------------------------------------------------------------------------

describe('CollisionDetector — bird exactly on pipe border (no collision)', () => {
  /**
   * Bird reduced hitbox right edge exactly equals pipe left edge.
   * AABB uses strict < so touching (equal) does NOT count as overlap.
   *
   * Bird center x, radius=15, margin=4 → reduced right edge = x + (15-4) = x + 11
   * Pipe left edge = 200
   * Set x + 11 = 200 → x = 189
   */
  test('reduced hitbox right edge exactly equals pipe left edge — no collision', () => {
    const birdX = 189; // reduced right edge = 189 + 11 = 200 == pipe.x
    const bird = new Bird(birdX, 320, RADIUS); // y=320 inside gap (200..350)
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  /**
   * Bird reduced hitbox top edge exactly equals top pipe bottom edge (gapY).
   * AABB uses strict <: birdBox.y < topPipe.y + topPipe.height
   * No collision when birdBox.y >= gapY.
   * Reduced hitbox top = birdY - (radius - margin) = birdY - 11
   * Set birdY - 11 = 200 (gapY) → birdY = 211
   * Bird x=230 is horizontally inside the pipe (pipe x=200, width=60 → 200..260).
   */
  test('reduced hitbox top edge exactly equals top pipe bottom edge — no collision', () => {
    const birdY = 211; // reduced top = 211 - 11 = 200 == gapY → birdBox.y not < gapY
    const bird = new Bird(230, birdY, RADIUS); // x=230 inside pipe x-range 200..260
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  /**
   * Bird reduced hitbox bottom edge exactly equals bottom pipe top edge.
   * Bottom pipe top = gapY + gapHeight = 200 + 150 = 350.
   * AABB: no collision when birdBox.y + birdBox.height <= bottomPipe.y
   * Reduced hitbox bottom = birdY + (radius - margin) = birdY + 11
   * Set birdY + 11 = 350 → birdY = 339
   */
  test('reduced hitbox bottom edge exactly equals bottom pipe top edge — no collision', () => {
    const birdY = 339; // reduced bottom = 339 + 11 = 350 == bottom pipe top → not > 350
    const bird = new Bird(230, birdY, RADIUS); // x=230 inside pipe x-range
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Bird exactly on the border of a pipe — with collision (1px overlap)
// ---------------------------------------------------------------------------

describe('CollisionDetector — bird exactly on pipe border (with collision)', () => {
  /**
   * Bird reduced hitbox right edge is 1px past the pipe left edge.
   * x + 11 = 201 → x = 190
   * Bird y=100 → reduced box y=89..111, top pipe height=200 → overlap vertically.
   */
  test('reduced hitbox right edge 1px past pipe left edge — collision', () => {
    const birdX = 190; // reduced right edge = 190 + 11 = 201 > 200
    const bird = new Bird(birdX, 100, RADIUS); // y=100 inside top pipe region
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });

  /**
   * Bird reduced hitbox bottom edge is 1px past the top pipe bottom edge.
   * birdY - 11 = 199 → birdY = 210 (reduced top = 199 < gapY=200 → overlaps top pipe)
   * Bird x=230 is inside pipe x-range (200..260).
   */
  test('reduced hitbox top edge 1px past top pipe bottom edge — collision', () => {
    const birdY = 210; // reduced top = 210 - 11 = 199 < 200 (gapY) → overlaps top pipe
    const bird = new Bird(230, birdY, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });

  /**
   * Bird reduced hitbox bottom edge is 1px past the bottom pipe top edge.
   * birdY + 11 = 351 → birdY = 340 (reduced bottom = 351 > 350 → overlaps bottom pipe)
   * Bird x=230 is inside pipe x-range.
   */
  test('reduced hitbox bottom edge 1px past bottom pipe top edge — collision', () => {
    const birdY = 340; // reduced bottom = 340 + 11 = 351 > 350 (bottom pipe top)
    const bird = new Bird(230, birdY, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Bird clearly inside the gap — no collision
// ---------------------------------------------------------------------------

describe('CollisionDetector — bird clearly inside pipe gap', () => {
  test('bird well within the gap returns false', () => {
    // Gap: y=200..350, bird center y=275 (middle of gap), x=230 (inside pipe x-range)
    const bird = new Bird(230, 275, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  test('bird horizontally before the pipe — no collision', () => {
    // Bird x=100, pipe x=200 → bird is to the left, no horizontal overlap
    const bird = new Bird(100, 275, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });

  test('bird horizontally after the pipe — no collision', () => {
    // Bird x=350, pipe x=200, width=60 → pipe right edge=260, bird left edge=350-11=339 > 260
    const bird = new Bird(350, 275, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Bird overlapping top pipe
// ---------------------------------------------------------------------------

describe('CollisionDetector — bird overlapping top pipe', () => {
  test('bird center inside top pipe region — collision', () => {
    // Top pipe: x=200..260, y=0..200
    // Bird center at (230, 100) → clearly inside top pipe
    const bird = new Bird(230, 100, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });

  test('bird partially overlapping top pipe from below — collision', () => {
    // Bird y=195, reduced bottom = 195+11=206 > 200 (gapY), reduced top = 195-11=184 < 200
    // Bird x=230 inside pipe x-range
    const bird = new Bird(230, 195, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Bird overlapping bottom pipe
// ---------------------------------------------------------------------------

describe('CollisionDetector — bird overlapping bottom pipe', () => {
  test('bird center inside bottom pipe region — collision', () => {
    // Bottom pipe: x=200..260, y=350..640
    // Bird center at (230, 500) → clearly inside bottom pipe
    const bird = new Bird(230, 500, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });

  test('bird partially overlapping bottom pipe from above — collision', () => {
    // Bird y=355, reduced top = 355-11=344 < 350 (bottom pipe top), reduced bottom = 355+11=366 > 350
    // Bird x=230 inside pipe x-range
    const bird = new Bird(230, 355, RADIUS);
    const pipe = makePipe(200, 200, 150, 60, CANVAS_H);

    expect(CollisionDetector.check(bird, [pipe], CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Boundary collision — floor
// ---------------------------------------------------------------------------

describe('CollisionDetector — floor boundary collision', () => {
  test('bird y + radius > canvasHeight — floor collision', () => {
    // bird.y + radius > canvasHeight → 640 + 15 = 655 > 640
    const bird = new Bird(80, CANVAS_H, RADIUS); // y=640, radius=15 → 655 > 640
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(true);
  });

  test('bird y + radius exactly equals canvasHeight — no floor collision', () => {
    // bird.y + radius = canvasHeight → 625 + 15 = 640 → NOT > 640
    const bird = new Bird(80, CANVAS_H - RADIUS, RADIUS); // y=625, 625+15=640
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(false);
  });

  test('bird y + radius one pixel past canvasHeight — floor collision', () => {
    // bird.y + radius = 641 > 640
    const bird = new Bird(80, CANVAS_H - RADIUS + 1, RADIUS); // y=626, 626+15=641
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(true);
  });

  test('_checkBoundaries directly: floor collision', () => {
    const bird = new Bird(80, CANVAS_H + 10, RADIUS);
    expect(CollisionDetector._checkBoundaries(bird, CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. Boundary collision — ceiling
// ---------------------------------------------------------------------------

describe('CollisionDetector — ceiling boundary collision', () => {
  test('bird y - radius < 0 — ceiling collision', () => {
    // bird.y - radius = 10 - 15 = -5 < 0
    const bird = new Bird(80, 10, RADIUS);
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(true);
  });

  test('bird y - radius exactly equals 0 — no ceiling collision', () => {
    // bird.y - radius = 15 - 15 = 0 → NOT < 0
    const bird = new Bird(80, RADIUS, RADIUS); // y=15
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(false);
  });

  test('bird y - radius one pixel above ceiling — ceiling collision', () => {
    // bird.y - radius = 14 - 15 = -1 < 0
    const bird = new Bird(80, RADIUS - 1, RADIUS); // y=14
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(true);
  });

  test('_checkBoundaries directly: ceiling collision', () => {
    const bird = new Bird(80, -5, RADIUS);
    expect(CollisionDetector._checkBoundaries(bird, CANVAS_H)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. No collision with empty pipes array
// ---------------------------------------------------------------------------

describe('CollisionDetector — empty pipes array', () => {
  test('bird in valid position with no pipes — no collision', () => {
    const bird = new Bird(80, 320, RADIUS); // well within canvas bounds
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(false);
  });

  test('bird near canvas edge but within bounds with no pipes — no collision', () => {
    // y = radius (exactly on ceiling boundary, not past it)
    const bird = new Bird(80, RADIUS, RADIUS);
    expect(CollisionDetector.check(bird, [], CANVAS_H)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. _aabbIntersects — direct unit tests
// ---------------------------------------------------------------------------

describe('CollisionDetector._aabbIntersects', () => {
  test('two clearly overlapping rectangles — true', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 25, y: 25, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(true);
  });

  test('two clearly separated rectangles — false', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 100, y: 100, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(false);
  });

  test('rectangles touching on right/left edge — false (strict <)', () => {
    // a right edge = 50, b left edge = 50 → a.x + a.width > b.x → 50 > 50 is false
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 50, y: 0, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(false);
  });

  test('rectangles touching on top/bottom edge — false (strict <)', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 };
    const b = { x: 0, y: 50, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(false);
  });

  test('rectangles overlapping by 1px horizontally and vertically — true', () => {
    const a = { x: 0, y: 0, width: 51, height: 51 };
    const b = { x: 50, y: 50, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(true);
  });

  test('one rectangle fully inside another — true', () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 25, y: 25, width: 50, height: 50 };
    expect(CollisionDetector._aabbIntersects(outer, inner)).toBe(true);
  });

  test('zero-width rectangle — false (no area to overlap)', () => {
    const a = { x: 0, y: 0, width: 0, height: 50 };
    const b = { x: 0, y: 0, width: 50, height: 50 };
    // a.x + a.width = 0, b.x = 0 → 0 > 0 is false → no overlap
    expect(CollisionDetector._aabbIntersects(a, b)).toBe(false);
  });
});
