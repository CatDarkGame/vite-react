import Phaser from 'phaser';
import { RUN_SPEED, PLAYER_BASE, MAX_ENEMIES, MAX_PROJECTILES } from '../const/balance';
import type { StatBlock } from '../types/combat';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { UISystem } from '../systems/UISystem';

export class GameScene extends Phaser.Scene {
  private playerStats: StatBlock;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  
  // Systems
  private spawnSystem!: SpawnSystem;
  private combatSystem!: CombatSystem;
  private uiSystem!: UISystem;
  
  // Background layers for parallax
  private backgroundLayers: Phaser.GameObjects.Rectangle[] = [];
  
  // Player state
  private isDead: boolean = false;
  private respawnTimer: number = 0;

  constructor() {
    super({ key: 'GameScene' });
    
    // Initialize player stats
    this.playerStats = {
      atk: PLAYER_BASE.atk,
      as: PLAYER_BASE.as,
      crit: PLAYER_BASE.crit,
      critMul: PLAYER_BASE.critMul,
      hp: PLAYER_BASE.hp,
      def: PLAYER_BASE.def
    };
  }

  preload() {
    // Load hit sound effect
    this.load.audio('hitSound', 'Resources/SFX/minecraft-hit-sfx.mp3');
    
    // Generate simple textures for game objects
    this.generateTextures();
  }

  private generateTextures(): void {
    // Player texture - blue rectangle
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 40, 60)
      .generateTexture('player', 40, 60)
      .destroy();
    
    // Enemy texture - red rectangle
    this.add.graphics()
      .fillStyle(0xe74c3c)
      .fillRect(0, 0, 30, 50)
      .generateTexture('enemy', 30, 50)
      .destroy();
    
    // Projectile texture - yellow circle
    this.add.graphics()
      .fillStyle(0xf1c40f)
      .fillCircle(4, 4, 4)
      .generateTexture('projectile', 8, 8)
      .destroy();
  }

  create() {
    // Initialize physics world
    this.physics.world.gravity.y = 0;
    
    // Create parallax background
    this.createParallaxBackground();
    
    // Create ground
    this.createGround();
    
    // Create physics groups with pooling
    this.enemies = this.physics.add.group({
      maxSize: MAX_ENEMIES,
      runChildUpdate: false
    });
    
    this.projectiles = this.physics.add.group({
      maxSize: MAX_PROJECTILES,
      runChildUpdate: false
    });
    
    // Initialize systems
    this.spawnSystem = new SpawnSystem(this, this.enemies);
    this.combatSystem = new CombatSystem(this, this.playerStats, this.projectiles, this.enemies);
    this.uiSystem = new UISystem(this, this.combatSystem, this.playerStats, this.enemies);
    
    // Setup collision handlers
    this.setupCollisions();
    
    // Debug mode setup
    if (this.isDebugMode()) {
      this.physics.world.debugGraphic.visible = true;
    }
  }

  private createParallaxBackground(): void {
    // Create simple colored background layers for parallax effect
    const bgFar = this.add.rectangle(600, 240, 1200, 480, 0x34495e);
    const bgMid = this.add.rectangle(600, 290, 1200, 380, 0x2c3e50);
    const bgNear = this.add.rectangle(600, 340, 1200, 280, 0x1e2836);
    
    this.backgroundLayers.push(bgFar, bgMid, bgNear);
  }

  private createGround(): void {
    const groundY = 480;
    const ground = this.add.rectangle(600, groundY + 60, 1200, 120, 0x27ae60);
    this.physics.add.existing(ground, true);
  }

  private setupCollisions(): void {
    // Projectiles hit enemies
    this.physics.add.overlap(
      this.projectiles, 
      this.enemies, 
      this.handleProjectileHit, 
      undefined, 
      this
    );
    
    // Player contact damage (if player has physics body)
    // This would be implemented if player had a physics body for contact damage
  }

  private handleProjectileHit(projectile: any, enemySprite: any): void {
    const enemy = this.spawnSystem.getEnemyData(enemySprite);
    if (!enemy) return;
    
    // Handle hit through combat system
    this.combatSystem.handleProjectileHit(projectile, enemy);
    
    // Check if enemy is dead
    if (enemy.hp <= 0) {
      this.spawnSystem.removeEnemy(enemySprite);
    }
  }

  private isDebugMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === '1';
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000; // Convert to seconds
    
    // Move camera right continuously
    this.cameras.main.scrollX += RUN_SPEED * dt;
    
    // Handle player death and respawn
    if (this.isDead) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= 1.0) {
        this.respawn();
      }
      return; // Don't update other systems while dead
    }
    
    // Check for player death
    if (this.playerStats.hp <= 0 && !this.isDead) {
      this.handlePlayerDeath();
      return;
    }
    
    // Update parallax background
    this.updateParallaxBackground(dt);
    
    // Update systems
    this.spawnSystem.update(dt);
    this.combatSystem.update(dt);
    this.uiSystem.update(dt);
    
    // Handle contact damage (simplified - enemies touching player area)
    this.handleContactDamage();
  }

  private updateParallaxBackground(dt: number): void {
    this.backgroundLayers.forEach((layer, index) => {
      const speed = (index + 1) * 0.3; // Different speeds for depth
      layer.x -= speed * RUN_SPEED * dt;
      
      // Reset position for continuous scrolling
      if (layer.x < -600) {
        layer.x = 1800;
      }
    });
  }

  private handleContactDamage(): void {
    const camera = this.cameras.main;
    const playerX = camera.worldView.left + camera.width * 0.35;
    const playerY = 480;
    const contactRange = 50;
    
    this.enemies.children.entries.forEach((enemySprite: any) => {
      if (!enemySprite.active) return;
      
      const distance = Phaser.Math.Distance.Between(playerX, playerY, enemySprite.x, enemySprite.y);
      if (distance < contactRange) {
        const enemy = this.spawnSystem.getEnemyData(enemySprite);
        if (enemy) {
          // Apply contact damage (simplified - once per enemy)
          this.playerStats.hp -= enemy.contactDamage;
          this.sound.play('hitSound', { volume: 0.2 });
          
          // Remove enemy after contact
          this.spawnSystem.removeEnemy(enemySprite);
        }
      }
    });
  }

  private handlePlayerDeath(): void {
    this.isDead = true;
    this.respawnTimer = 0;
    this.uiSystem.showDeathScreen();
  }

  private respawn(): void {
    this.isDead = false;
    this.respawnTimer = 0;
    this.playerStats.hp = PLAYER_BASE.hp; // Full heal
    this.uiSystem.updatePlayerHP(this.playerStats.hp);
  }
}