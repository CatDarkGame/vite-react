import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle
  private enemies!: Phaser.GameObjects.Group
  private gold: number = 0
  private goldText!: Phaser.GameObjects.Text
  private ground!: Phaser.GameObjects.Rectangle
  private backgroundLayers: Phaser.GameObjects.Rectangle[] = []
  private playerStats = {
    attack: 10,
    health: 100,
    speed: 100
  }
  
  private readonly GROUND_HEIGHT = 120 // 20% of 600px screen height
  private readonly GROUND_Y = 600 - 60 // Bottom 20% positioned

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.createParallaxBackground()
    this.createGround()
    this.createPlayer()
    this.createEnemies()
    this.createUI()
    this.setupEvents()
  }

  private createParallaxBackground() {
    // Create simple colored rectangles for parallax background layers
    const bgFar = this.add.rectangle(600, 240, 1200, 480, 0x34495e)
    const bgMid = this.add.rectangle(600, 290, 1200, 380, 0x2c3e50) 
    const bgNear = this.add.rectangle(600, 340, 1200, 280, 0x1e2836)
    
    // Store layers for parallax movement
    this.backgroundLayers.push(bgFar, bgMid, bgNear)
  }

  private createGround() {
    this.ground = this.add.rectangle(600, this.GROUND_Y, 1200, this.GROUND_HEIGHT, 0x27ae60)
    this.physics.add.existing(this.ground, true) // Static body
  }

  private createPlayer() {
    const playerY = this.GROUND_Y - this.GROUND_HEIGHT/2 - 30
    this.player = this.add.rectangle(100, playerY, 40, 60, 0x3498db)
    this.physics.add.existing(this.player)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
  }

  private createEnemies() {
    this.enemies = this.add.group()
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    })
  }

  private spawnEnemy() {
    const enemyY = this.GROUND_Y - this.GROUND_HEIGHT/2 - 25
    const enemy = this.add.rectangle(1200, enemyY, 30, 50, 0xe74c3c)
    this.physics.add.existing(enemy)
    this.enemies.add(enemy)
    
    const body = enemy.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(-50)
  }

  private createUI() {
    this.goldText = this.add.text(16, 16, `Gold: ${this.gold}`, {
      fontSize: '24px',
      color: '#f39c12'
    })

    this.add.text(16, 50, `ATK: ${this.playerStats.attack}`, {
      fontSize: '18px',
      color: '#ffffff'
    })

    const upgradeButton = this.add.rectangle(1100, 50, 80, 30, 0x27ae60)
    this.add.text(1100, 50, 'Upgrade', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)

    upgradeButton.setInteractive()
    upgradeButton.on('pointerdown', () => {
      if (this.gold >= 50) {
        this.gold -= 50
        this.playerStats.attack += 5
        this.updateUI()
      }
    })
  }

  private setupEvents() {
    this.physics.add.overlap(this.player, this.enemies, this.attackEnemy, undefined, this)
  }

  private attackEnemy(_player: any, enemy: any) {
    enemy.destroy()
    this.gold += 10
    this.updateUI()
  }

  private updateUI() {
    this.goldText.setText(`Gold: ${this.gold}`)
  }

  update() {
    // Update parallax background - move rectangles with different speeds
    this.backgroundLayers.forEach((layer, index) => {
      const speed = (index + 1) * 0.3 // Different speeds for each layer
      layer.x -= speed
      
      // Reset position when off-screen for continuous scrolling
      if (layer.x < -600) {
        layer.x = 1800
      }
    })

    // Clean up off-screen enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.x < -50) {
        enemy.destroy()
      }
    })
  }
}