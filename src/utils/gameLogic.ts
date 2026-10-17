/**
 * Pure game logic, collision detection, scoring, and level data for CollabFlow Break Time Arcade.
 * Decoupled from UI and canvas for unit testing and deterministic simulation.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Axis-Aligned Bounding Box (AABB) intersection check with optional inset margin.
 */
export function checkAABBCollision(a: Rect, b: Rect, margin: number = 0): boolean {
  return (
    a.x + margin < b.x + b.width - margin &&
    a.x + a.width - margin > b.x + margin &&
    a.y + margin < b.y + b.height - margin &&
    a.y + a.height - margin > b.y + margin
  );
}

/**
 * Circle-to-Rect collision detection with normal reflection vector.
 */
export function checkCircleRectCollision(circle: Circle, rect: Rect): {
  collided: boolean;
  normalX: number;
  normalY: number;
} {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  if (distanceSquared < circle.radius * circle.radius) {
    // Normal direction
    let normalX = 0;
    let normalY = 0;
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      normalX = distanceX > 0 ? 1 : -1;
    } else {
      normalY = distanceY > 0 ? 1 : -1;
    }
    return { collided: true, normalX, normalY };
  }

  return { collided: false, normalX: 0, normalY: 0 };
}

/**
 * Calculate combo multiplier based on consecutive items collected or bricks broken.
 */
export function calculateScoreWithMultiplier(
  basePoints: number,
  streak: number
): { points: number; multiplier: number } {
  let multiplier = 1;
  if (streak >= 15) {
    multiplier = 4;
  } else if (streak >= 10) {
    multiplier = 3;
  } else if (streak >= 5) {
    multiplier = 2;
  }
  return {
    points: basePoints * multiplier,
    multiplier,
  };
}

/**
 * Calculate bounce angle on paddle based on hit point [-1 to 1]
 */
export function calculatePaddleBounce(hitRatio: number, speed: number): { vx: number; vy: number } {
  // Clamp ratio between -0.9 and 0.9 to avoid purely horizontal trajectories
  const clamped = Math.max(-0.85, Math.min(0.85, hitRatio));
  const maxAngle = (Math.PI / 3); // 60 degrees max
  const angle = clamped * maxAngle;

  return {
    vx: Math.sin(angle) * speed,
    vy: -Math.abs(Math.cos(angle) * speed), // Always bounces upwards
  };
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  points: number;
  color: string;
  label: string;
  hasPowerup?: 'multiball' | 'laser' | 'wide' | 'shield';
}

/**
 * Generate a grid of breakable workspace bricks for Bug Blaster.
 */
export function generateBrickGrid(
  rows: number = 4,
  cols: number = 7,
  containerWidth: number = 560,
  containerHeight: number = 180
): Brick[] {
  const bricks: Brick[] = [];
  const paddingX = 8;
  const paddingY = 8;
  const startY = 30;
  const brickWidth = Math.floor((containerWidth - (cols + 1) * paddingX) / cols);
  const brickHeight = 26;

  const categories = [
    { label: 'P0 Bug', color: '#f43f5e', points: 300, health: 2 },
    { label: 'Blocker', color: '#f97316', points: 200, health: 2 },
    { label: 'Stale PR', color: '#eab308', points: 150, health: 1 },
    { label: '99+ DMs', color: '#8b5cf6', points: 100, health: 1 },
    { label: 'Memory Leak', color: '#06b6d4', points: 250, health: 2 },
  ];

  const powerupTypes: Array<'multiball' | 'laser' | 'wide' | 'shield'> = [
    'multiball',
    'wide',
    'shield',
    'laser',
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cat = categories[(r + c) % categories.length];
      const hasPowerup = (r + c) % 5 === 2 ? powerupTypes[(r + c) % powerupTypes.length] : undefined;
      bricks.push({
        id: `brick-${r}-${c}`,
        x: paddingX + c * (brickWidth + paddingX),
        y: startY + r * (brickHeight + paddingY),
        width: brickWidth,
        height: brickHeight,
        health: cat.health,
        maxHealth: cat.health,
        points: cat.points,
        color: cat.color,
        label: cat.label,
        hasPowerup,
      });
    }
  }

  return bricks;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  role: string;
  score: number;
  game: 'walle_runner' | 'bug_blaster';
  avatar: string;
  isCurrentUser?: boolean;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Elena Vance',
    role: 'Staff Architect',
    score: 3420,
    game: 'walle_runner',
    avatar: 'EV',
  },
  {
    rank: 2,
    name: 'Alex Chen',
    role: 'Principal SRE',
    score: 2980,
    game: 'walle_runner',
    avatar: 'AC',
  },
  {
    rank: 3,
    name: 'Sophia Wu',
    role: 'Frontend Lead',
    score: 2640,
    game: 'walle_runner',
    avatar: 'SW',
  },
  {
    rank: 4,
    name: 'David Kim',
    role: 'Platform Engineer',
    score: 2150,
    game: 'walle_runner',
    avatar: 'DK',
  },
  {
    rank: 5,
    name: 'WALL-E Bot',
    role: 'Robotic Mascot',
    score: 1980,
    game: 'walle_runner',
    avatar: '🤖',
  },
];

/**
 * Merge and sort player high scores with team leaderboard
 */
export function getLeaderboardWithPlayer(
  playerScore: number,
  playerName: string = 'You',
  game: 'walle_runner' | 'bug_blaster' = 'walle_runner'
): LeaderboardEntry[] {
  const list = [...DEFAULT_LEADERBOARD.filter((e) => e.game === game)];

  if (playerScore > 0) {
    list.push({
      rank: 0,
      name: `${playerName} (You)`,
      role: 'Player',
      score: playerScore,
      game,
      avatar: '⭐',
      isCurrentUser: true,
    });
  }

  // Sort descending by score
  list.sort((a, b) => b.score - a.score);

  // Re-assign ranks
  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
