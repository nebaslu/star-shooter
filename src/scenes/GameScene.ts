import Phaser from 'phaser';
import {
  BULLET_SPEED,
  ENEMY_BASE_SPEED,
  ENEMY_SPEED_PER_WAVE,
  ENEMY_SWEEP_AMPLITUDE,
  FIRE_COOLDOWN_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  HIGH_SCORE_KEY,
  PLAYER_SPEED,
  START_LIVES,
} from '../config';
import { AudioFX } from '../systems/AudioFX';

interface EnemyState {
  baseX: number;
  phase: number;
  speed: number;
}

type ArcadeObject =
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.GameObjects.GameObject
  | Phaser.Tilemaps.Tile;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private scoreText!: Phaser.GameObjects.Text;
  private highText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private gameOverText!: Phaser.GameObjects.Text;
  private pausedText!: Phaser.GameObjects.Text;
  private score = 0;
  private highScore = 0;
  private lives = START_LIVES;
  private wave = 0;
  private waveInProgress = false;
  private gameOver = false;
  private paused = false;
  private invulnerable = false;
  private lastShot = 0;
  private readonly touch = { left: false, right: false, fire: false };
  private readonly audio = new AudioFX();

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.gameOver = false;
    this.paused = false;
    this.invulnerable = false;
    this.score = 0;
    this.lives = START_LIVES;
    this.wave = 0;
    this.waveInProgress = false;
    this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);

    this.cameras.main.setBackgroundColor('#05060f');
    this.makeStars();
    this.makeHud();

    this.player = this.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'player');
    this.player.setCollideWorldBounds(true);

    this.bullets = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyHitPlayer, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,R,P') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-R', () => {
      if (this.gameOver) this.restart();
    });
    this.input.keyboard!.on('keydown-P', () => this.togglePause());
    this.input.on('pointerdown', () => {
      if (this.gameOver) this.restart();
    });

    this.makeTouchControls();
    this.nextWave();
  }

  update(time: number, delta: number): void {
    if (this.gameOver || this.paused) return;
    this.movePlayer();
    this.handleFire(time);
    this.updateBullets();
    this.updateEnemies(delta);
    if (this.waveInProgress && this.enemies.countActive(true) === 0) {
      this.waveInProgress = false;
      this.time.delayedCall(1200, () => this.nextWave());
    }
  }

  private makeStars(): void {
    for (let i = 0; i < 80; i++) {
      this.add
        .image(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 'star')
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.9))
        .setDepth(-1);
    }
  }

  private makeHud(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' };
    this.scoreText = this.add.text(16, 12, 'Puntos: 0', style);
    this.highText = this.add
      .text(GAME_WIDTH - 16, 12, `Récord: ${this.highScore}`, { ...style, fontSize: '16px', color: '#9adcff' })
      .setOrigin(1, 0);
    this.waveText = this.add
      .text(GAME_WIDTH / 2, 12, 'Oleada: 1', { ...style, color: '#ffd166' })
      .setOrigin(0.5, 0);
    this.livesContainer = this.add.container(16, 44);
    this.refreshLives();
    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', { ...style, fontSize: '32px', align: 'center' })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
    this.pausedText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSA\nPulsa P para continuar', { ...style, fontSize: '28px', align: 'center' })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
  }

  private refreshLives(): void {
    this.livesContainer.removeAll(true);
    for (let i = 0; i < this.lives; i++) {
      this.livesContainer.add(this.add.image(i * 28, 0, 'player').setScale(0.6));
    }
  }

  private makeTouchControls(): void {
    if (!this.sys.game.device.input.touch) return;
    const y = GAME_HEIGHT - 60;
    const style: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' };
    const mk = (x: number, label: string, onDown: () => void, onUp: () => void): void => {
      const zone = this.add.rectangle(x, y, 90, 70, 0xffffff, 0.12).setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, style).setOrigin(0.5);
      zone.on('pointerdown', onDown);
      zone.on('pointerup', onUp);
      zone.on('pointerout', onUp);
    };
    mk(60, '◀', () => (this.touch.left = true), () => (this.touch.left = false));
    mk(170, '▶', () => (this.touch.right = true), () => (this.touch.right = false));
    mk(GAME_WIDTH - 60, 'FUEGO', () => (this.touch.fire = true), () => (this.touch.fire = false));
  }

  private movePlayer(): void {
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touch.right;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    this.player.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);
  }

  private handleFire(time: number): void {
    const wantFire = this.cursors.space.isDown || this.keys.SPACE.isDown || this.touch.fire;
    if (!wantFire || time - this.lastShot < FIRE_COOLDOWN_MS) return;
    this.lastShot = time;
    const b = this.bullets.get(this.player.x, this.player.y - 24, 'bullet') as Phaser.Physics.Arcade.Image | null;
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.setVelocity(0, -BULLET_SPEED);
    this.audio.shoot();
  }

  private updateBullets(): void {
    for (const child of this.bullets.getChildren()) {
      const b = child as Phaser.Physics.Arcade.Image;
      if (b.active && b.y < -20) {
        b.setActive(false).setVisible(false);
        b.setVelocity(0, 0);
      }
    }
  }

  private updateEnemies(_delta: number): void {
    for (const child of this.enemies.getChildren()) {
      const e = child as Phaser.Physics.Arcade.Image;
      if (!e.active) return;
      const state = e.getData('state') as EnemyState;
      (e.body as Phaser.Physics.Arcade.Body).setVelocityY(state.speed);
      e.x = state.baseX + Math.sin(this.time.now / 500 + state.phase) * ENEMY_SWEEP_AMPLITUDE;
      if (e.y > GAME_HEIGHT - 30) {
        e.destroy();
        this.loseLife();
      }
    }
  }

  private nextWave(): void {
    this.wave += 1;
    this.waveInProgress = true;
    this.waveText.setText(`Oleada: ${this.wave}`);
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `OLEADA ${this.wave}`, {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: hint, alpha: 0, duration: 1500, onComplete: () => hint.destroy() });
    this.audio.wave();

    const count = 3 + this.wave * 2;
    const speed = ENEMY_BASE_SPEED + this.wave * ENEMY_SPEED_PER_WAVE;
    for (let i = 0; i < count; i++) {
      const baseX = 80 + (i * (GAME_WIDTH - 160)) / Math.max(count - 1, 1) + Phaser.Math.Between(-20, 20);
      const e = this.enemies.get(baseX, -40 - i * 40, 'enemy') as Phaser.Physics.Arcade.Image | null;
      if (!e) continue;
      e.setActive(true).setVisible(true);
      e.setData('state', { baseX, phase: Phaser.Math.FloatBetween(0, Math.PI * 2), speed } satisfies EnemyState);
    }
  }

  private onBulletHitEnemy(bulletObj: ArcadeObject, enemyObj: ArcadeObject): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as Phaser.Physics.Arcade.Image;
    bullet.setActive(false).setVisible(false).setVelocity(0, 0);
    this.explode(enemy.x, enemy.y);
    enemy.destroy();
    this.score += 100;
    this.scoreText.setText(`Puntos: ${this.score}`);
    this.audio.explosion();
  }

  private onEnemyHitPlayer(_playerObj: ArcadeObject, enemyObj: ArcadeObject): void {
    if (this.invulnerable) return;
    const enemy = enemyObj as Phaser.Physics.Arcade.Image;
    this.explode(enemy.x, enemy.y);
    enemy.destroy();
    this.loseLife();
    this.cameras.main.shake(200, 0.01);
    this.audio.hit();
  }

  private explode(x: number, y: number): void {
    const p = this.add.particles(0, 0, 'explosion', {
      speed: { min: 60, max: 220 },
      scale: { start: 1, end: 0 },
      lifespan: 450,
      quantity: 14,
      tint: 0xffa94d,
    });
    p.explode(14, x, y);
  }

  private loseLife(): void {
    this.lives -= 1;
    this.refreshLives();
    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.invulnerable = true;
      this.player.setTint(0xff0000);
      this.time.delayedCall(1500, () => {
        this.invulnerable = false;
        this.player.clearTint();
      });
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.physics.pause();
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
    this.highText.setText(`Récord: ${this.highScore}`);
    this.gameOverText
      .setText(`GAME OVER\nPuntos: ${this.score}\nRécord: ${this.highScore}\n\nPulsa R o toca la pantalla para reiniciar`)
      .setVisible(true);
  }

  private restart(): void {
    this.scene.restart();
  }

  private togglePause(): void {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.pausedText.setVisible(true);
    } else {
      this.physics.resume();
      this.pausedText.setVisible(false);
    }
  }
}
