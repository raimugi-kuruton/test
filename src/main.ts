import './style.css'

interface GameObject {
  x: number
  y: number
  width: number
  height: number
}

interface Enemy extends GameObject {
  element: HTMLElement
  speed: number
}

class DodgeGame {
  private gameArea: HTMLElement
  private player: HTMLElement
  private playerPos: number = 50
  private playerWidth: number = 40
  private playerHeight: number = 40
  private gameAreaWidth: number = 0
  private gameAreaHeight: number = 0

  private enemies: Enemy[] = []
  private particlesContainer: HTMLElement
  private score: number = 0
  private level: number = 1
  private health: number = 3
  private gameRunning: boolean = false
  private gamePaused: boolean = false
  private gameOverScreen: HTMLElement
  private enemySpawnRate: number = 1500
  private enemySpeed: number = 3
  private spawnTimer: ReturnType<typeof setInterval> | null = null
  private gameTimer: ReturnType<typeof setInterval> | null = null
  private keys: { [key: string]: boolean } = {}

  constructor() {
    this.gameArea = document.querySelector('#app .game-area')!
    this.player = document.querySelector('#player')!
    this.particlesContainer = document.querySelector('#particles')!
    this.gameOverScreen = document.querySelector('#gameOverScreen')!

    this.gameAreaWidth = this.gameArea.offsetWidth
    this.gameAreaHeight = this.gameArea.offsetHeight

    this.setupEventListeners()
    this.updateUI()
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true

      if (e.key === ' ') {
        e.preventDefault()
        this.toggleGame()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false
    })

    document.querySelector('#restartBtn')?.addEventListener('click', () => {
      this.restart()
    })
  }

  private toggleGame(): void {
    if (!this.gameRunning) {
      this.startGame()
    } else {
      this.gamePaused = !this.gamePaused
    }
  }

  private startGame(): void {
    this.gameRunning = true
    this.gameOverScreen.classList.add('hidden')

    this.spawnTimer = setInterval(() => {
      if (!this.gamePaused) {
        this.spawnEnemy()
      }
    }, this.enemySpawnRate)

    this.gameTimer = setInterval(() => {
      if (!this.gamePaused) {
        this.updateGame()
      }
    }, 20)
  }

  private updateGame(): void {
    this.movePlayer()
    this.updateEnemies()
    this.checkCollisions()

    if (this.score % 500 === 0 && this.score > 0 && this.score !== this.level * 500) {
      this.levelUp()
    }
  }

  private movePlayer(): void {
    const speed = 5
    const leftPressed = this.keys['ArrowLeft'] || this.keys['a']
    const rightPressed = this.keys['ArrowRight'] || this.keys['d']

    if (leftPressed && this.playerPos > 0) {
      this.playerPos -= speed
    }
    if (rightPressed && this.playerPos < 100 - (this.playerWidth / this.gameAreaWidth * 100)) {
      this.playerPos += speed
    }

    this.player.style.left = this.playerPos + '%'
  }

  private spawnEnemy(): void {
    const enemy = document.createElement('div')
    enemy.className = 'enemy'
    const enemies = ['🔴', '💀', '⚡', '🎯', '🔥']
    enemy.textContent = enemies[Math.floor(Math.random() * enemies.length)]

    const randomX = Math.random() * (this.gameAreaWidth - 40)
    enemy.style.left = randomX + 'px'
    enemy.style.top = '-50px'

    this.gameArea.appendChild(enemy)

    const enemyObj: Enemy = {
      x: randomX,
      y: -50,
      width: 40,
      height: 40,
      element: enemy,
      speed: this.enemySpeed + (this.level - 1) * 0.5
    }

    this.enemies.push(enemyObj)
  }

  private updateEnemies(): void {
    this.enemies.forEach((enemy, index) => {
      enemy.y += enemy.speed
      enemy.element.style.top = enemy.y + 'px'

      if (enemy.y > this.gameAreaHeight) {
        enemy.element.remove()
        this.enemies.splice(index, 1)
        this.addScore(10)
      }
    })
  }

  private checkCollisions(): void {
    const playerX = (this.playerPos / 100) * this.gameAreaWidth
    const playerY = this.gameAreaHeight - this.playerHeight - 20

    this.enemies.forEach((enemy, index) => {
      if (this.isColliding(
        playerX, playerY, this.playerWidth, this.playerHeight,
        enemy.x, enemy.y, enemy.width, enemy.height
      )) {
        this.createExplosion(enemy.x, enemy.y)
        enemy.element.remove()
        this.enemies.splice(index, 1)
        this.takeDamage()
      }
    })
  }

  private isColliding(x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
  }

  private createExplosion(x: number, y: number): void {
    const particles = ['💥', '✨', '⭐']
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.textContent = particles[Math.floor(Math.random() * particles.length)]
      particle.style.left = x + 'px'
      particle.style.top = y + 'px'
      this.particlesContainer.appendChild(particle)

      setTimeout(() => particle.remove(), 500)
    }
  }

  private addScore(points: number): void {
    this.score += points
    this.updateUI()
  }

  private takeDamage(): void {
    this.health--
    this.updateUI()

    if (this.health <= 0) {
      this.endGame()
    }
  }

  private levelUp(): void {
    this.level++
    this.enemySpawnRate = Math.max(800, 1500 - (this.level - 1) * 150)

    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = setInterval(() => {
        if (!this.gamePaused) {
          this.spawnEnemy()
        }
      }, this.enemySpawnRate)
    }

    this.updateUI()
  }

  private updateUI(): void {
    document.querySelector('#score')!.textContent = this.score.toString()
    document.querySelector('#level')!.textContent = this.level.toString()
    document.querySelector('#health')!.textContent = this.health.toString()
  }

  private endGame(): void {
    this.gameRunning = false
    if (this.spawnTimer) clearInterval(this.spawnTimer)
    if (this.gameTimer) clearInterval(this.gameTimer)

    this.enemies.forEach(enemy => enemy.element.remove())
    this.enemies = []

    document.querySelector('#finalScore')!.textContent = this.score.toString()
    document.querySelector('#finalLevel')!.textContent = this.level.toString()
    this.gameOverScreen.classList.remove('hidden')
  }

  private restart(): void {
    this.playerPos = 50
    this.score = 0
    this.level = 1
    this.health = 3
    this.gameRunning = false
    this.gamePaused = false
    this.enemies = []

    if (this.spawnTimer) clearInterval(this.spawnTimer)
    if (this.gameTimer) clearInterval(this.gameTimer)

    this.enemies.forEach(enemy => enemy.element.remove())
    this.player.style.left = '50%'
    this.gameOverScreen.classList.add('hidden')
    this.updateUI()

    this.startGame()
  }
}

new DodgeGame()
