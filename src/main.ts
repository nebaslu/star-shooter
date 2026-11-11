import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault();
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#05060f',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PreloadScene, GameScene],
};

new Phaser.Game(config);
