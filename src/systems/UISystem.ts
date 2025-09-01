import type { StatBlock } from '../types/combat';
import { CombatSystem } from './CombatSystem';

export class UISystem {
  private scene: Phaser.Scene;
  private combat: CombatSystem;
  private playerStats: StatBlock;
  private enemies: Phaser.Physics.Arcade.Group;
  
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private dpsText!: Phaser.GameObjects.Text;
  private enemyCountText!: Phaser.GameObjects.Text;
  
  private updateTimer: number = 0;
  private readonly UPDATE_INTERVAL = 0.2; // Update UI every 200ms for performance

  constructor(
    scene: Phaser.Scene, 
    combat: CombatSystem, 
    playerStats: StatBlock, 
    enemies: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.combat = combat;
    this.playerStats = playerStats;
    this.enemies = enemies;
    
    this.createUI();
  }

  private createUI(): void {
    // HP Bar Background
    this.scene.add.rectangle(120, 30, 200, 20, 0x333333)
      .setOrigin(0, 0.5)
      .setScrollFactor(0); // Fixed to camera
    
    // HP Bar
    this.hpBar = this.scene.add.rectangle(120, 30, 200, 16, 0xe74c3c)
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    
    // HP Text
    this.hpText = this.scene.add.text(16, 20, `HP: ${this.playerStats.hp}/${this.playerStats.hp}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // DPS Text
    this.dpsText = this.scene.add.text(16, 50, 'DPS: 0', {
      fontSize: '16px',
      color: '#f39c12',
      fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Enemy Count Text
    this.enemyCountText = this.scene.add.text(16, 80, 'Enemies: 0', {
      fontSize: '16px',
      color: '#9b59b6',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    // Debug info (if debug mode)
    if (this.isDebugMode()) {
      this.createDebugUI();
    }
  }

  private createDebugUI(): void {
    // Add debug information
    this.scene.add.text(16, 110, 'DEBUG MODE', {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'Arial'
    }).setScrollFactor(0);
  }

  private isDebugMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === '1';
  }

  update(dt: number): void {
    this.updateTimer += dt;
    
    // Update UI elements at reduced frequency for performance
    if (this.updateTimer >= this.UPDATE_INTERVAL) {
      this.updateHPBar();
      this.updateDPSText();
      this.updateEnemyCount();
      this.updateTimer = 0;
    }
  }

  private updateHPBar(): void {
    const hpPercentage = Math.max(0, this.playerStats.hp / this.getMaxHP());
    const barWidth = 200 * hpPercentage;
    
    this.hpBar.setSize(barWidth, 16);
    this.hpText.setText(`HP: ${Math.max(0, this.playerStats.hp)}/${this.getMaxHP()}`);
    
    // Change color based on HP percentage
    if (hpPercentage > 0.6) {
      this.hpBar.setFillStyle(0x27ae60); // Green
    } else if (hpPercentage > 0.3) {
      this.hpBar.setFillStyle(0xf39c12); // Orange
    } else {
      this.hpBar.setFillStyle(0xe74c3c); // Red
    }
  }

  private updateDPSText(): void {
    const dps = this.combat.getDPS();
    this.dpsText.setText(`DPS: ${dps}`);
  }

  private updateEnemyCount(): void {
    const count = this.enemies.countActive(true);
    this.enemyCountText.setText(`Enemies: ${count}`);
  }

  private getMaxHP(): number {
    // This should ideally be stored separately, but for now use a fixed value
    return 120; // PLAYER_BASE.hp from balance.ts
  }

  // Method to update player HP from external systems
  updatePlayerHP(currentHP: number): void {
    this.playerStats.hp = currentHP;
  }

  // Method to handle player death
  showDeathScreen(): void {
    const camera = this.scene.cameras.main;
    const centerX = camera.worldView.centerX;
    const centerY = camera.worldView.centerY;
    
    const deathText = this.scene.add.text(centerX, centerY, 'YOU DIED', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    
    const respawnText = this.scene.add.text(centerX, centerY + 60, 'Respawning in 1 second...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);
    
    // Auto-remove death screen after 1 second
    this.scene.time.delayedCall(1000, () => {
      deathText.destroy();
      respawnText.destroy();
    });
  }
}