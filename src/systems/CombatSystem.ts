import { PROJECTILE_SPEED, MAX_PROJECTILES } from '../const/balance';
import type { StatBlock, Enemy, Projectile } from '../types/combat';

export function calcDamage(attacker: StatBlock, enemyDef: number, skillMul: number = 1): number {
  const raw = Math.max(1, attacker.atk * skillMul - enemyDef);
  const isCrit = Math.random() < attacker.crit;
  const damage = Math.floor(raw * (isCrit ? attacker.critMul : 1));
  return damage;
}

export class CombatSystem {
  private scene: Phaser.Scene;
  private playerStats: StatBlock;
  private projectiles: Phaser.Physics.Arcade.Group;
  private enemies: Phaser.Physics.Arcade.Group;
  private attackTimer: number = 0;
  private damageHistory: Array<{ time: number; amount: number }> = [];
  private currentTarget: Enemy | null = null;

  constructor(
    scene: Phaser.Scene,
    playerStats: StatBlock,
    projectiles: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.playerStats = playerStats;
    this.projectiles = projectiles;
    this.enemies = enemies;
  }

  update(dt: number): void {
    this.attackTimer += dt;
    this.updateDamageHistory();
    
    // Find closest target
    this.currentTarget = this.findClosestEnemy();
    
    // Attack if target exists and cooldown is ready
    const attackPeriod = 1 / this.playerStats.as;
    if (this.currentTarget && this.attackTimer >= attackPeriod) {
      this.fireProjectile();
      this.attackTimer = 0;
    }

    // Clean up off-screen projectiles
    this.cleanupProjectiles();
  }

  private findClosestEnemy(): Enemy | null {
    const camera = this.scene.cameras.main;
    const playerX = camera.worldView.left + camera.width * 0.35; // 35% from left
    const playerY = 480; // Ground level
    
    let closest: Enemy | null = null;
    let closestDistance = Infinity;

    this.enemies.children.entries.forEach((sprite: any) => {
      if (!sprite.active) return;
      
      // Check if enemy is on screen
      if (sprite.x < camera.worldView.left || sprite.x > camera.worldView.right) return;
      
      const distance = Phaser.Math.Distance.Between(playerX, playerY, sprite.x, sprite.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        // We need to get enemy data from SpawnSystem - this will be handled in GameScene
        closest = { sprite, hp: 40, def: 1, speed: 55, contactDamage: 8 } as Enemy;
      }
    });

    return closest;
  }

  private fireProjectile(): void {
    if (!this.currentTarget || this.projectiles.countActive(true) >= MAX_PROJECTILES) return;

    const camera = this.scene.cameras.main;
    const playerX = camera.worldView.left + camera.width * 0.35;
    const playerY = 480;

    // Get or create projectile
    let projectile = this.projectiles.get(playerX, playerY);
    if (!projectile) {
      projectile = this.scene.physics.add.sprite(playerX, playerY, 'projectile');
      this.projectiles.add(projectile);
    }

    projectile.setActive(true);
    projectile.setVisible(true);

    // Calculate direction to target
    const targetX = this.currentTarget.sprite.x;
    const targetY = this.currentTarget.sprite.y;
    
    const angle = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);
    const velocityX = Math.cos(angle) * PROJECTILE_SPEED;
    const velocityY = Math.sin(angle) * PROJECTILE_SPEED;
    
    projectile.body.setVelocity(velocityX, velocityY);
  }

  private cleanupProjectiles(): void {
    const camera = this.scene.cameras.main;
    const bounds = {
      left: camera.worldView.left - 100,
      right: camera.worldView.right + 100,
      top: -100,
      bottom: 700
    };

    this.projectiles.children.entries.forEach((projectile: any) => {
      if (!projectile.active) return;
      
      if (projectile.x < bounds.left || projectile.x > bounds.right ||
          projectile.y < bounds.top || projectile.y > bounds.bottom) {
        projectile.setActive(false);
        projectile.setVisible(false);
      }
    });
  }

  handleProjectileHit(projectile: Projectile, enemy: Enemy): void {
    // Calculate damage
    const damage = calcDamage(this.playerStats, enemy.def);
    const isCrit = Math.random() < this.playerStats.crit;
    
    // Apply damage
    enemy.hp -= damage;
    
    // Record damage for DPS calculation
    this.damageHistory.push({
      time: this.scene.time.now,
      amount: damage
    });

    // Play hit sound
    this.scene.sound.play('hitSound', { volume: 0.3 });
    
    // Show damage text
    this.showDamageText(enemy.sprite.x, enemy.sprite.y - 30, damage, isCrit);
    
    // Remove projectile
    projectile.setActive(false);
    projectile.setVisible(false);

    // Create hit effect
    this.createHitEffect(enemy);
  }

  private showDamageText(x: number, y: number, damage: number, isCrit: boolean): void {
    const color = isCrit ? '#ffff00' : '#ff0000';
    const fontSize = isCrit ? '18px' : '16px';
    
    const damageText = this.scene.add.text(x, y, `-${damage}`, {
      fontSize,
      color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });
  }

  private createHitEffect(enemy: Enemy): void {
    // Flash effect
    const originalTint = enemy.sprite.tint;
    enemy.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      enemy.sprite.setTint(originalTint);
    });
  }

  private updateDamageHistory(): void {
    const currentTime = this.scene.time.now;
    const threeSecondsAgo = currentTime - 3000;
    
    // Remove damage entries older than 3 seconds
    this.damageHistory = this.damageHistory.filter(entry => entry.time > threeSecondsAgo);
  }

  getDPS(): number {
    if (this.damageHistory.length === 0) return 0;
    
    const totalDamage = this.damageHistory.reduce((sum, entry) => sum + entry.amount, 0);
    return Math.round(totalDamage / 3); // Average over 3 seconds
  }

  getCurrentTarget(): Enemy | null {
    return this.currentTarget;
  }
}