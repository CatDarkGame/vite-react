import { SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_MIN, MAX_ENEMIES, ENEMY_BASE } from '../const/balance';
import type { Enemy } from '../types/combat';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyData: Map<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, Enemy> = new Map();
  private spawnTimer: number = 0;
  private timeElapsed: number = 0;

  constructor(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.enemies = enemies;
  }

  update(dt: number): void {
    this.timeElapsed += dt;
    this.spawnTimer += dt;

    // Calculate dynamic spawn interval based on time
    const interval = Phaser.Math.Clamp(
      SPAWN_INTERVAL_BASE - this.timeElapsed * 0.002,
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_BASE
    );

    // Check if we should spawn and haven't reached enemy limit
    if (this.spawnTimer >= interval && this.enemies.countActive(true) < MAX_ENEMIES) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Clean up off-screen enemies
    this.cleanupOffscreenEnemies();
  }

  private spawnEnemy(): void {
    const camera = this.scene.cameras.main;
    const groundY = 480; // Based on GROUND_Y from original code
    const spawnX = camera.worldView.right + 32;

    // Get or create enemy sprite
    let enemySprite = this.enemies.get(spawnX, groundY);
    
    if (!enemySprite) {
      enemySprite = this.scene.physics.add.sprite(spawnX, groundY, 'enemy');
      this.enemies.add(enemySprite);
    }

    enemySprite.setActive(true);
    enemySprite.setVisible(true);
    enemySprite.body.setVelocityX(-ENEMY_BASE.speed);

    // Create enemy data
    const enemyData: Enemy = {
      sprite: enemySprite,
      hp: ENEMY_BASE.hp,
      def: ENEMY_BASE.def,
      speed: ENEMY_BASE.speed,
      contactDamage: ENEMY_BASE.contactDamage
    };

    this.enemyData.set(enemySprite, enemyData);
  }

  private cleanupOffscreenEnemies(): void {
    const camera = this.scene.cameras.main;
    const leftBound = camera.worldView.left - 50;

    this.enemies.children.entries.forEach((sprite: any) => {
      if (sprite.active && sprite.x < leftBound) {
        this.enemyData.delete(sprite);
        sprite.setActive(false);
        sprite.setVisible(false);
      }
    });
  }

  getEnemyData(sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): Enemy | undefined {
    return this.enemyData.get(sprite);
  }

  removeEnemy(sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    this.enemyData.delete(sprite);
    sprite.setActive(false);
    sprite.setVisible(false);
  }

  getEnemyCount(): number {
    return this.enemies.countActive(true);
  }
}