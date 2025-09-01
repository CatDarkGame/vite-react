import Phaser from 'phaser'

interface Character {
  sprite: Phaser.GameObjects.Rectangle
  maxHp: number
  currentHp: number
  attack: number
  lastAttackTime: number
}

export class GameScene extends Phaser.Scene {
  private player!: Character
  private enemies!: Phaser.GameObjects.Group
  private enemyData: Map<Phaser.GameObjects.Rectangle, Character> = new Map()
  private gold: number = 0
  private goldText!: Phaser.GameObjects.Text
  private playerHpText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private ground!: Phaser.GameObjects.Rectangle
  private backgroundLayers: Phaser.GameObjects.Rectangle[] = []
  
  // Wave system
  private currentWave = 1
  private enemiesInWave = 3
  private enemiesKilled = 0
  
  private readonly GROUND_HEIGHT = 120
  private readonly GROUND_Y = 600 - 60
  private readonly ATTACK_COOLDOWN = 500 // 0.5 seconds (2x faster)
  private readonly COMBAT_RANGE = 80

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
    this.startNextWave()
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
    const sprite = this.add.rectangle(100, playerY, 40, 60, 0x3498db)
    this.physics.add.existing(sprite)
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)
    
    this.player = {
      sprite,
      maxHp: 100,
      currentHp: 100,
      attack: 20,
      lastAttackTime: 0
    }
  }

  private createEnemies() {
    this.enemies = this.add.group()
  }

  private startNextWave() {
    this.enemiesKilled = 0
    this.enemiesInWave = 2 + this.currentWave // Increase enemies per wave
    
    for (let i = 0; i < this.enemiesInWave; i++) {
      this.time.delayedCall(i * 500, () => {
        this.spawnEnemy()
      })
    }
  }

  private spawnEnemy() {
    const enemyY = this.GROUND_Y - this.GROUND_HEIGHT/2 - 25
    const sprite = this.add.rectangle(1200, enemyY, 30, 50, 0xe74c3c)
    this.physics.add.existing(sprite)
    this.enemies.add(sprite)
    
    const body = sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(-100) // 2x faster movement
    
    const enemyData: Character = {
      sprite,
      maxHp: 30 + (this.currentWave * 10),
      currentHp: 30 + (this.currentWave * 10),
      attack: 15 + (this.currentWave * 5),
      lastAttackTime: 0
    }
    
    this.enemyData.set(sprite, enemyData)
  }

  private createUI() {
    this.goldText = this.add.text(16, 16, `Gold: ${this.gold}`, {
      fontSize: '24px',
      color: '#f39c12'
    })

    this.playerHpText = this.add.text(16, 50, `HP: ${this.player.currentHp}/${this.player.maxHp}`, {
      fontSize: '18px',
      color: '#e74c3c'
    })

    this.waveText = this.add.text(16, 84, `Wave: ${this.currentWave}`, {
      fontSize: '18px',
      color: '#9b59b6'
    })

    this.add.text(16, 118, `ATK: ${this.player.attack}`, {
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
        this.player.attack += 10
        this.updateUI()
      }
    })
  }

  private setupEvents() {
    this.physics.add.overlap(this.player.sprite, this.enemies, this.handleCombat, undefined, this)
  }

  private handleCombat(_playerSprite: any, enemySprite: any) {
    const enemy = this.enemyData.get(enemySprite)
    if (!enemy) return

    const currentTime = this.time.now
    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x, this.player.sprite.y,
      enemySprite.x, enemySprite.y
    )

    if (distance <= this.COMBAT_RANGE) {
      // Player attacks enemy
      if (currentTime - this.player.lastAttackTime > this.ATTACK_COOLDOWN) {
        this.attackCharacter(this.player, enemy)
        this.player.lastAttackTime = currentTime
      }

      // Enemy attacks player
      if (currentTime - enemy.lastAttackTime > this.ATTACK_COOLDOWN) {
        this.attackCharacter(enemy, this.player)
        enemy.lastAttackTime = currentTime
      }
    }
  }

  private attackCharacter(attacker: Character, target: Character) {
    target.currentHp -= attacker.attack
    
    // Hit effects
    this.createHitEffect(target)
    this.showDamageText(target.sprite.x, target.sprite.y - 30, attacker.attack)
    
    if (target.currentHp <= 0) {
      if (target === this.player) {
        this.gameOver()
      } else {
        this.killEnemy(target)
      }
    }
  }

  private createHitEffect(character: Character) {
    // Flash effect - change color temporarily
    const originalColor = character.sprite.fillColor
    character.sprite.setFillStyle(0xff0000)
    this.time.delayedCall(100, () => {
      character.sprite.setFillStyle(originalColor)
    })
    
    // Knockback
    const knockback = character === this.player ? 20 : -20
    character.sprite.x += knockback
  }

  private showDamageText(x: number, y: number, damage: number) {
    const damageText = this.add.text(x, y, `-${damage}`, {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    })
  }

  private killEnemy(enemy: Character) {
    enemy.sprite.destroy()
    this.enemyData.delete(enemy.sprite)
    this.gold += 20
    this.enemiesKilled++
    
    if (this.enemiesKilled >= this.enemiesInWave) {
      this.waveComplete()
    }
    
    this.updateUI()
  }

  private waveComplete() {
    this.currentWave++
    this.gold += this.currentWave * 10 // Bonus gold
    
    this.time.delayedCall(2000, () => {
      this.startNextWave()
    })
    
    this.updateUI()
  }

  private gameOver() {
    this.scene.pause()
    this.add.text(600, 300, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  private updateUI() {
    this.goldText.setText(`Gold: ${this.gold}`)
    this.playerHpText.setText(`HP: ${this.player.currentHp}/${this.player.maxHp}`)
    this.waveText.setText(`Wave: ${this.currentWave}`)
  }

  update() {
    // Update parallax background - move rectangles with different speeds (2x faster)
    this.backgroundLayers.forEach((layer, index) => {
      const speed = (index + 1) * 0.6 // 2x faster parallax
      layer.x -= speed
      
      // Reset position when off-screen for continuous scrolling
      if (layer.x < -600) {
        layer.x = 1800
      }
    })

    // Clean up off-screen enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.x < -50) {
        this.enemyData.delete(enemy)
        enemy.destroy()
      }
    })
  }
}