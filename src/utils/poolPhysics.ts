// Physics engine for 8-ball pool game

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'cue' | 'solid' | 'stripe' | '8ball';
  pocketed: boolean;
  number: number;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

const FRICTION = 0.98;
const BALL_RADIUS = 12;
const POCKET_RADIUS = 20;

export class PoolPhysics {
  balls: Ball[];
  pockets: Pocket[];
  tableWidth: number;
  tableHeight: number;

  constructor(tableWidth: number, tableHeight: number) {
    this.tableWidth = tableWidth;
    this.tableHeight = tableHeight;
    this.balls = [];
    this.pockets = [];
    this.initializePockets();
    this.initializeBalls();
  }

  initializePockets() {
    const offset = 15;
    this.pockets = [
      { x: offset, y: offset, radius: POCKET_RADIUS },
      { x: this.tableWidth / 2, y: offset, radius: POCKET_RADIUS },
      { x: this.tableWidth - offset, y: offset, radius: POCKET_RADIUS },
      { x: offset, y: this.tableHeight - offset, radius: POCKET_RADIUS },
      { x: this.tableWidth / 2, y: this.tableHeight - offset, radius: POCKET_RADIUS },
      { x: this.tableWidth - offset, y: this.tableHeight - offset, radius: POCKET_RADIUS },
    ];
  }

  initializeBalls() {
    const colors = [
      '#FFFFFF', // 0 - cue ball
      '#FCD307', '#0D47A1', '#DC2626', '#7C3AED', '#EA580C', '#059669', '#92400E', '#000000', // 1-8
      '#FCD307', '#0D47A1', '#DC2626', '#7C3AED', '#EA580C', '#059669', '#92400E', // 9-15 (stripes)
    ];

    // Cue ball
    this.balls.push({
      id: 0,
      x: this.tableWidth / 4,
      y: this.tableHeight / 2,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: colors[0],
      type: 'cue',
      pocketed: false,
      number: 0,
    });

    // Rack the balls in triangle formation
    const startX = (this.tableWidth * 3) / 4;
    const startY = this.tableHeight / 2;
    const spacing = BALL_RADIUS * 2 + 2;

    let ballIndex = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        if (ballIndex > 15) break;

        const x = startX + row * spacing * Math.cos(Math.PI / 6);
        const y = startY + (col - row / 2) * spacing;

        let type: 'solid' | 'stripe' | '8ball' = ballIndex <= 7 ? 'solid' : 'stripe';
        if (ballIndex === 8) type = '8ball';

        this.balls.push({
          id: ballIndex,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: BALL_RADIUS,
          color: colors[ballIndex],
          type,
          pocketed: false,
          number: ballIndex,
        });

        ballIndex++;
      }
    }
  }

  update() {
    // Update ball positions
    this.balls.forEach((ball) => {
      if (ball.pocketed) return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Apply friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Stop if velocity is too low
      if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.1) ball.vy = 0;

      // Wall collisions
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.tableWidth) {
        ball.vx *= -0.8;
        ball.x = Math.max(ball.radius, Math.min(this.tableWidth - ball.radius, ball.x));
      }
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.tableHeight) {
        ball.vy *= -0.8;
        ball.y = Math.max(ball.radius, Math.min(this.tableHeight - ball.radius, ball.y));
      }
    });

    // Ball-to-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        this.checkBallCollision(this.balls[i], this.balls[j]);
      }
    }

    // Check for pocketed balls
    this.balls.forEach((ball) => {
      if (ball.pocketed) return;
      
      this.pockets.forEach((pocket) => {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pocket.radius) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
        }
      });
    });
  }

  checkBallCollision(ball1: Ball, ball2: Ball) {
    if (ball1.pocketed || ball2.pocketed) return;

    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball1.radius + ball2.radius) {
      // Collision detected
      const angle = Math.atan2(dy, dx);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      // Rotate velocities
      const vx1 = ball1.vx * cos + ball1.vy * sin;
      const vy1 = ball1.vy * cos - ball1.vx * sin;
      const vx2 = ball2.vx * cos + ball2.vy * sin;
      const vy2 = ball2.vy * cos - ball2.vx * sin;

      // Swap velocities (elastic collision)
      const tempVx = vx1;
      ball1.vx = (vx2 * cos - vy1 * sin) * 0.95;
      ball1.vy = (vy1 * cos + vx2 * sin) * 0.95;
      ball2.vx = (tempVx * cos - vy2 * sin) * 0.95;
      ball2.vy = (vy2 * cos + tempVx * sin) * 0.95;

      // Separate balls
      const overlap = ball1.radius + ball2.radius - distance;
      ball1.x -= (overlap / 2) * cos;
      ball1.y -= (overlap / 2) * sin;
      ball2.x += (overlap / 2) * cos;
      ball2.y += (overlap / 2) * sin;
    }
  }

  isMoving(): boolean {
    return this.balls.some((ball) => !ball.pocketed && (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1));
  }

  getCueBall(): Ball | undefined {
    return this.balls.find((b) => b.type === 'cue' && !b.pocketed);
  }

  shootCueBall(power: number, angle: number) {
    const cueBall = this.getCueBall();
    if (!cueBall) return;

    cueBall.vx = Math.cos(angle) * power;
    cueBall.vy = Math.sin(angle) * power;
  }
}
