import Phaser from 'phaser';

function makeShip(scene: Phaser.Scene, key: string, color: number, inverted: boolean): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(color, 1);
  if (inverted) {
    g.fillTriangle(2, 2, 30, 2, 16, 30);
  } else {
    g.fillTriangle(16, 0, 30, 30, 2, 30);
    g.fillStyle(0xffffff, 1);
    g.fillRect(14, 8, 4, 8);
  }
  g.generateTexture(key, 32, 32);
  g.destroy();
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    makeShip(this, 'player', 0x4ef0ff, false);
    makeShip(this, 'enemy', 0xff5566, true);

    const bullet = this.make.graphics({ x: 0, y: 0 }, false);
    bullet.fillStyle(0xffe066, 1);
    bullet.fillRect(0, 0, 4, 14);
    bullet.generateTexture('bullet', 4, 14);
    bullet.destroy();

    const explosion = this.make.graphics({ x: 0, y: 0 }, false);
    explosion.fillStyle(0xffffff, 1);
    explosion.fillCircle(8, 8, 8);
    explosion.generateTexture('explosion', 16, 16);
    explosion.destroy();

    const star = this.make.graphics({ x: 0, y: 0 }, false);
    star.fillStyle(0xffffff, 1);
    star.fillRect(0, 0, 2, 2);
    star.generateTexture('star', 2, 2);
    star.destroy();

    this.scene.start('GameScene');
  }
}
