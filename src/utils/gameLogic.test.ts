import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAABBCollision,
  checkCircleRectCollision,
  calculateScoreWithMultiplier,
  calculatePaddleBounce,
  generateBrickGrid,
  getLeaderboardWithPlayer,
} from './gameLogic.ts';

test('checkAABBCollision returns true for overlapping bounding boxes', () => {
  const box1 = { x: 10, y: 10, width: 30, height: 30 };
  const box2 = { x: 20, y: 20, width: 30, height: 30 };
  assert.equal(checkAABBCollision(box1, box2), true);
});

test('checkAABBCollision returns false for disjoint boxes', () => {
  const box1 = { x: 0, y: 0, width: 20, height: 20 };
  const box2 = { x: 50, y: 50, width: 20, height: 20 };
  assert.equal(checkAABBCollision(box1, box2), false);
});

test('checkCircleRectCollision detects ball striking brick', () => {
  const circle = { x: 25, y: 15, radius: 6 };
  const rect = { x: 20, y: 20, width: 50, height: 20 };
  const result = checkCircleRectCollision(circle, rect);
  assert.equal(result.collided, true);
  assert.equal(typeof result.normalY, 'number');
});

test('checkCircleRectCollision returns false for distant ball', () => {
  const circle = { x: 10, y: 10, radius: 5 };
  const rect = { x: 100, y: 100, width: 40, height: 20 };
  const result = checkCircleRectCollision(circle, rect);
  assert.equal(result.collided, false);
});

test('calculateScoreWithMultiplier scales correctly with streak tiers', () => {
  const base = 100;
  assert.equal(calculateScoreWithMultiplier(base, 2).multiplier, 1);
  assert.equal(calculateScoreWithMultiplier(base, 5).multiplier, 2);
  assert.equal(calculateScoreWithMultiplier(base, 10).multiplier, 3);
  assert.equal(calculateScoreWithMultiplier(base, 16).multiplier, 4);
  assert.equal(calculateScoreWithMultiplier(base, 16).points, 400);
});

test('calculatePaddleBounce angles upward and scales velocity', () => {
  const bounceCenter = calculatePaddleBounce(0, 8);
  assert.equal(bounceCenter.vx, 0);
  assert.equal(bounceCenter.vy, -8);

  const bounceRight = calculatePaddleBounce(0.5, 8);
  assert.ok(bounceRight.vx > 0, 'vx should be positive when hit on right side');
  assert.ok(bounceRight.vy < 0, 'vy should be negative (upward)');
});

test('generateBrickGrid produces structured matrix with proper labels', () => {
  const bricks = generateBrickGrid(3, 5, 500, 150);
  assert.equal(bricks.length, 15);
  assert.ok(bricks[0].label.length > 0);
  assert.ok(bricks[0].points > 0);
  assert.ok(bricks[0].width > 0);
});

test('getLeaderboardWithPlayer ranks high score properly', () => {
  const board = getLeaderboardWithPlayer(4000, 'Champion', 'walle_runner');
  assert.equal(board[0].score, 4000);
  assert.equal(board[0].rank, 1);
  assert.equal(board[0].isCurrentUser, true);
});
