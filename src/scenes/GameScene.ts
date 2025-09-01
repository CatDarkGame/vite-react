import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle
  private enemies!: Phaser.GameObjects.Group
  private gold: number = 0
  private goldText!: Phaser.GameObjects.Text
  private playerStats = {
    attack: 10,
    health: 100,
    speed: 100
  }

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.createPlayer()
    this.createEnemies()
    this.createUI()
    this.setupEvents()
  }

  private createPlayer() {
    this.player = this.add.rectangle(100, 300, 40, 60, 0x3498db)
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
    const enemy = this.add.rectangle(1200, 300, 30, 50, 0xe74c3c)
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
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.x < -50) {
        enemy.destroy()
      }
    })
  }
}