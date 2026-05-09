/**
 * Unit tests for Bird.getBoundingBox and Pipe.isOffScreen
 *
 * Validates: Requirements 4.3, 3.5
 */

const { Bird } = require('../bird.js');
const { Pipe } = require('../pipe.js');

// ---------------------------------------------------------------------------
// Bird.getBoundingBox
// ---------------------------------------------------------------------------

describe('Bird.getBoundingBox', () => {
  describe('margin applied correctly on all four sides', () => {
    test('margin=0 produces a bounding box equal to the full diameter', () => {
      const bird = new Bird(100, 200, 15);
      const box = bird.getBoundingBox(0);

      // x starts at bird.x - radius
      expect(box.x).toBe(100 - 15);       // 85
      // y starts at bird.y - radius
      expect(box.y).toBe(200 - 15);       // 185
      // width equals diameter
      expect(box.width).toBe(15 * 2);     // 30
      // height equals diameter
      expect(box.height).toBe(15 * 2);    // 30
    });

    test('margin=4 (HITBOX_MARGIN) reduces each side by 4px', () => {
      const bird = new Bird(100, 200, 15);
      const box = bird.getBoundingBox(4);

      // Left side: x = bird.x - radius + margin
      expect(box.x).toBe(100 - 15 + 4);          // 89
      // Top side: y = bird.y - radius + margin
      expect(box.y).toBe(200 - 15 + 4);           // 189
      // Width reduced by margin on both left and right
      expect(box.width).toBe(15 * 2 - 4 * 2);    // 22
      // Height reduced by margin on both top and bottom
      expect(box.height).toBe(15 * 2 - 4 * 2);   // 22
    });

    test('margin is applied symmetrically: left and right sides are equal', () => {
      const bird = new Bird(80, 320, 15);
      const margin = 4;
      const box = bird.getBoundingBox(margin);

      // Distance from bird left edge to box left edge
      const leftReduction = box.x - (bird.x - bird.radius);
      // Distance from box right edge to bird right edge
      const rightReduction = (bird.x + bird.radius) - (box.x + box.width);

      expect(leftReduction).toBe(margin);
      expect(rightReduction).toBe(margin);
    });

    test('margin is applied symmetrically: top and bottom sides are equal', () => {
      const bird = new Bird(80, 320, 15);
      const margin = 4;
      const box = bird.getBoundingBox(margin);

      // Distance from bird top edge to box top edge
      const topReduction = box.y - (bird.y - bird.radius);
      // Distance from box bottom edge to bird bottom edge
      const bottomReduction = (bird.y + bird.radius) - (box.y + box.height);

      expect(topReduction).toBe(margin);
      expect(bottomReduction).toBe(margin);
    });
  });

  describe('bounding box formula: x, y, width, height', () => {
    test.each([
      // [x, y, radius, margin, expectedX, expectedY, expectedW, expectedH]
      [0,   0,  10, 0, -10, -10, 20, 20],
      [50, 100, 20, 0,  30,  80, 40, 40],
      [80, 320, 15, 4,  69, 309, 22, 22],
      [200, 400, 30, 4, 174, 374, 52, 52],
      [0,   0,  10, 3,  -7,  -7, 14, 14],
    ])(
      'bird(%i,%i,r=%i) margin=%i → box(%i,%i,%i,%i)',
      (x, y, radius, margin, expX, expY, expW, expH) => {
        const bird = new Bird(x, y, radius);
        const box = bird.getBoundingBox(margin);

        expect(box.x).toBe(expX);
        expect(box.y).toBe(expY);
        expect(box.width).toBe(expW);
        expect(box.height).toBe(expH);
      }
    );
  });

  describe('bounding box is always centered on bird position', () => {
    test('center of bounding box equals bird position with margin=0', () => {
      const bird = new Bird(100, 200, 15);
      const box = bird.getBoundingBox(0);

      expect(box.x + box.width / 2).toBe(bird.x);
      expect(box.y + box.height / 2).toBe(bird.y);
    });

    test('center of bounding box equals bird position with margin=4', () => {
      const bird = new Bird(80, 320, 15);
      const box = bird.getBoundingBox(4);

      expect(box.x + box.width / 2).toBe(bird.x);
      expect(box.y + box.height / 2).toBe(bird.y);
    });

    test('center of bounding box equals bird position with various positions', () => {
      const positions = [
        { x: 0, y: 0, radius: 20 },
        { x: -50, y: 300, radius: 10 },
        { x: 480, y: 640, radius: 15 },
      ];

      for (const { x, y, radius } of positions) {
        const bird = new Bird(x, y, radius);
        const box = bird.getBoundingBox(4);

        expect(box.x + box.width / 2).toBe(x);
        expect(box.y + box.height / 2).toBe(y);
      }
    });
  });

  describe('edge cases', () => {
    test('margin=0 (no reduction) produces full bounding box', () => {
      const bird = new Bird(50, 50, 20);
      const box = bird.getBoundingBox(0);

      expect(box.width).toBe(40);
      expect(box.height).toBe(40);
    });

    test('getBoundingBox with no argument defaults to margin=0', () => {
      const bird = new Bird(50, 50, 20);
      const box = bird.getBoundingBox();

      expect(box.x).toBe(30);
      expect(box.y).toBe(30);
      expect(box.width).toBe(40);
      expect(box.height).toBe(40);
    });

    test('large radius with margin=4 still reduces correctly', () => {
      const bird = new Bird(240, 320, 100);
      const box = bird.getBoundingBox(4);

      expect(box.x).toBe(240 - 100 + 4);   // 144
      expect(box.y).toBe(320 - 100 + 4);   // 224
      expect(box.width).toBe(100 * 2 - 8); // 192
      expect(box.height).toBe(100 * 2 - 8);// 192
    });
  });
});

// ---------------------------------------------------------------------------
// Pipe.isOffScreen
// ---------------------------------------------------------------------------

describe('Pipe.isOffScreen', () => {
  // Helper: create a pipe with given x and width; other params are irrelevant
  function makePipe(x, width = 60) {
    return new Pipe(x, 640, 200, 150, width);
  }

  describe('returns true when pipe is completely off the left edge', () => {
    test('pipe fully off screen: x + width < 0', () => {
      // x=-70, width=60 → x+width = -10 < 0
      const pipe = makePipe(-70, 60);
      expect(pipe.isOffScreen(480)).toBe(true);
    });

    test('pipe fully off screen: x=-100, width=60', () => {
      const pipe = makePipe(-100, 60);
      expect(pipe.isOffScreen(480)).toBe(true);
    });

    test('pipe fully off screen: x=-61, width=60 → x+width = -1 < 0', () => {
      const pipe = makePipe(-61, 60);
      expect(pipe.isOffScreen(480)).toBe(true);
    });
  });

  describe('returns false when pipe is still visible or partially on screen', () => {
    test('pipe at x=0 is still on screen', () => {
      const pipe = makePipe(0, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });

    test('pipe at positive x is on screen', () => {
      const pipe = makePipe(200, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });

    test('pipe partially off screen: x=-30, width=60 → x+width = 30 >= 0', () => {
      const pipe = makePipe(-30, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });

    test('pipe right edge exactly at 0: x=-60, width=60 → x+width = 0, not < 0', () => {
      // x + width === 0 is NOT off screen (boundary: must be strictly < 0)
      const pipe = makePipe(-60, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('pipe right edge at exactly -1: x=-61, width=60 → just off screen', () => {
      const pipe = makePipe(-61, 60);
      expect(pipe.isOffScreen(480)).toBe(true);
    });

    test('pipe right edge at exactly 0: not off screen', () => {
      const pipe = makePipe(-60, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });

    test('pipe right edge at 1: still visible', () => {
      const pipe = makePipe(-59, 60);
      expect(pipe.isOffScreen(480)).toBe(false);
    });

    test('isOffScreen does not depend on canvasWidth (only x + width < 0 matters)', () => {
      // The implementation only checks x + width < 0, canvasWidth is unused
      const pipe = makePipe(-70, 60);
      expect(pipe.isOffScreen(0)).toBe(true);
      expect(pipe.isOffScreen(480)).toBe(true);
      expect(pipe.isOffScreen(9999)).toBe(true);
    });
  });
});
