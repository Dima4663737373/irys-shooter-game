export class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.isPaused = false;
    this.score = 0;
    this.rows = 11;
    this.cols = 14;  // Зменшуємо кількість колонок для правильного відступу
    this.bubbleRadius = 20;
    this.bubbleImages = {};
    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan', 'heart'];
    this.grid = [];
    this.shootingBubble = null;
    this.shootingAngle = Math.PI / 2;
    this.isShooting = false;
    this.explodingBubbles = [];
    this.particles = []; // Для ефекту частинок
    this.isGameOver = false;
    this.lastTime = 0;
    this.gameMode = null; // 'endless' або 'timed'
    this.timeLeft = 60; // для режиму на 1 хвилину
    this.dropTimer = 9; // Таймер для опускання кульок
    this.shooterY = 0; // Позиція стрільця по Y
    
    // Sound system
    this.sounds = {};
    this.soundEnabled = true;
    this.audioContext = null;
    
    // Animation system
    this.animationTime = 0;
    this.menuAnimationOffset = 0;
    
    this.loadImages().then(() => {
      this.initSounds();
      this.showModeSelection();
    });
  }

  async loadImages() {
    const imagePromises = this.bubbleTypes.map(type => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ type, img });
        img.onerror = reject;
        img.src = `ball-${type}.png`;
      });
    });

    const loadedImages = await Promise.all(imagePromises);
    loadedImages.forEach(({type, img}) => {
      this.bubbleImages[type] = img;
    });
  }

  initSounds() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loadSounds();
    } catch (e) {
      console.warn('Audio not supported');
      this.soundEnabled = false;
    }
  }

  async loadSounds() {
    const soundFiles = ['shoot', 'pop', 'menu', 'game-over', 'start'];
    
    for (const soundName of soundFiles) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 0.3;
        // Fallback to generated sounds via Web Audio API
        this.sounds[soundName] = audio;
      } catch (e) {
        console.warn(`Could not load sound: ${soundName}`);
      }
    }
  }

  playSound(soundName) {
    if (!this.soundEnabled) return;
    
    if (soundName === 'shoot') {
      this.generateAndPlayTone(800, 400, 0.2, 0.3, 'exponential');
    } else if (soundName === 'pop') {
      this.generateAndPlayTone(200, 1000, 0.3, 0.4, 'linear');
    } else if (soundName === 'menu') {
      this.generateAndPlayTone(600, 200, 0.15, 0.2, 'exponential');
    } else if (soundName === 'game-over') {
      this.generateAndPlayTone(400, -300, 1.0, 0.3, 'exponential');
    } else if (soundName === 'start') {
      this.generateAndPlayTone(300, 500, 0.8, 0.4, 'exponential');
    }
  }

  generateAndPlayTone(startFreq, freqChange, duration, volume, curve = 'exponential') {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
      if (curve === 'exponential') {
        oscillator.frequency.exponentialRampToValueAtTime(
          startFreq + freqChange, 
          this.audioContext.currentTime + duration
        );
      } else {
        oscillator.frequency.linearRampToValueAtTime(
          startFreq + freqChange, 
          this.audioContext.currentTime + duration
        );
      }
      
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Could not play sound');
    }
  }

  showModeSelection() {
    this.container.innerHTML = `
      <div id="mode-selection" style="background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:32px; text-align:center; width:400px; margin:0 auto; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4); animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
        <h2 id="mode-title" style="margin:0 0 24px 0; color:#333; font-size:2rem; font-weight:bold; animation: bounceIn 1s ease-out 0.3s both; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎮 Select game mode</h2>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="endless-mode" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.3s; animation: slideInLeft 0.6s ease-out 0.5s both;">
            🎯 Endless mode
          </button>
          <button id="timed-mode" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#4096ee; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.3s; animation: slideInUp 0.6s ease-out 0.7s both;">
            ⏱️ 1 minute
          </button>
          <button id="back-to-menu" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#e74c3c; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.3s; animation: slideInRight 0.6s ease-out 0.9s both;">
            🏠 Back
          </button>
        </div>
        <div id="floating-bubbles" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; border-radius:20px;">
        </div>
      </div>
    `;

    // Додаємо hover ефекти та звуки
    const buttons = this.container.querySelectorAll('button');
    buttons.forEach(button => {
      button.onmouseover = () => {
        this.playSound('menu');
        button.style.transform = 'scale(1.05) translateY(-2px)';
        button.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
      };
      button.onmouseout = () => {
        button.style.transform = 'scale(1) translateY(0)';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      };
    });

    this.container.querySelector('#endless-mode').onclick = () => {
      this.playSound('start');
      this.animateStartTransition(() => {
        this.gameMode = 'endless';
        this.init();
      });
    };
    
    this.container.querySelector('#timed-mode').onclick = () => {
      this.playSound('start');
      this.animateStartTransition(() => {
        this.gameMode = 'timed';
        this.timeLeft = 60;
        this.init();
      });
    };

    this.container.querySelector('#back-to-menu').onclick = () => {
      this.playSound('menu');
      if (typeof window.showMainMenu === 'function') {
        window.showMainMenu();
      }
    };

    // Додаємо анімацію плаваючих кульок
    this.startFloatingBubblesAnimation();
  }

  animateStartTransition(callback) {
    const modeSelection = this.container.querySelector('#mode-selection');
    if (modeSelection) {
      modeSelection.style.animation = 'zoomOut 0.5s ease-in forwards';
      setTimeout(callback, 500);
    } else {
      callback();
    }
  }

  startFloatingBubblesAnimation() {
    const floatingContainer = this.container.querySelector('#floating-bubbles');
    if (!floatingContainer) return;

    // Створюємо 5 плаваючих кульок
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.createFloatingBubble(floatingContainer);
      }, i * 800);
    }

    // Періодично додаємо нові кульки
    setInterval(() => {
      if (this.container.querySelector('#floating-bubbles')) {
        this.createFloatingBubble(floatingContainer);
      }
    }, 3000);
  }

  createFloatingBubble(container) {
    const colors = ['#43cea2', '#4096ee', '#e74c3c', '#f39c12', '#9b59b6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 20 + Math.random() * 20;
    const startX = Math.random() * 100;
    const duration = 8 + Math.random() * 4;
    
    const bubble = document.createElement('div');
    bubble.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle at 30% 30%, ${color}aa, ${color});
      border-radius: 50%;
      left: ${startX}%;
      bottom: -50px;
      animation: floatUp ${duration}s linear forwards;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 2px solid rgba(255,255,255,0.3);
    `;
    
    container.appendChild(bubble);
    
    // Видаляємо кульку після анімації
    setTimeout(() => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
    }, duration * 1000);
  }

  init() {
    const gameWidth = 620;
    const playAreaWidth = 600;
    const gameHeight = 600;
    const totalBubblesWidth = this.cols * this.bubbleRadius * 2;
    const sidePadding = (gameWidth - totalBubblesWidth) / 2;
    
    this.container.innerHTML = `
      <div style="width:${gameWidth}px; margin:0 auto;">
        <div class="game-header" style="background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4); padding:12px 16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:12px; align-items:center;">
            <span id="score" class="score-badge" style="display:inline-block; padding:8px 16px; font-size:1.1rem; border-radius:8px; background:#43cea2; color:#fff; font-weight:bold;">Score: 0</span>
            ${this.gameMode === 'timed' ? `<span id="timer" style="display:inline-block; padding:8px 16px; font-size:1.1rem; border-radius:8px; background:#FF6B6B; color:#fff; font-weight:bold;">Time: 60s</span>` : ''}
          </div>
          <button id="pause-btn" class="pause-btn" style="padding:8px 16px; font-size:1.1rem; border-radius:8px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer;">Pause</button>
        </div>
        <div style="position:relative;">
          <canvas id="game-canvas" width="${gameWidth}" height="${gameHeight}" style="background:#666; border-radius:12px;"></canvas>
          <div id="pause-menu" class="hidden">
            <h2>Paused</h2>
            <button id="resume-btn">Resume</button>
            <button id="exit-btn" style="background:#e74c3c; color:#fff;">🚪 Exit</button>
          </div>
          <div id="game-over" class="hidden" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:30px; border-radius:20px; text-align:center; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4);">
            <h2 style="margin:0 0 20px 0; color:#2C3E50;">Game Over!</h2>
            <p style="margin:0 0 25px 0; color:#7F8C8D;">Final Score: <span id="final-score">0</span></p>
            <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
              <button id="play-again-btn" style="padding:12px 30px; font-size:1.1rem; border-radius:12px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; width:160px;">Play Again</button>
              <button id="back-to-menu-btn" style="padding:12px 30px; font-size:1.1rem; border-radius:12px; border:none; background:#e74c3c; color:#fff; font-weight:bold; cursor:pointer; width:160px;">Back to Menu</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pauseMenu = this.container.querySelector('#pause-menu');
    this.gameOverMenu = this.container.querySelector('#game-over');
    this.scoreEl = this.container.querySelector('#score');
    this.timerEl = this.gameMode === 'timed' ? this.container.querySelector('#timer') : null;
    this.playAreaWidth = playAreaWidth;
    this.sidePadding = sidePadding;
    this.shooterY = gameHeight - this.bubbleRadius * 1.5; // Опускаємо стрілець трохи нижче
    this.addEventListeners();
    this.createGrid();
    this.spawnShootingBubble();
    this.startGame();
  }

  addEventListeners() {
    this.container.querySelector('#pause-btn').onclick = () => this.pauseGame();
    this.container.querySelector('#resume-btn').onclick = () => this.resumeGame();
    this.container.querySelector('#exit-btn').onclick = () => this.exitGame();
    this.container.querySelector('#play-again-btn').onclick = () => this.showModeSelection();
    this.container.querySelector('#back-to-menu-btn').onclick = () => this.exitGame();
    this.canvas.addEventListener('mousemove', (e) => this.aim(e));
    this.canvas.addEventListener('click', (e) => this.shoot(e));
  }

  createGrid() {
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      const arr = [];
      for (let col = 0; col < this.cols; col++) {
        if (row < 7) {
          // Перевіряємо колір зліва та зверху для уникнення занадто простих комбінацій
          let availableColors = [...this.bubbleTypes];
          
          // Перевіряємо колір зліва
          if (col > 0 && arr[col - 1]) {
            const leftColor = arr[col - 1].type;
            // 70% шанс уникнути такого ж кольору
            if (Math.random() < 0.7) {
              availableColors = availableColors.filter(color => color !== leftColor);
            }
          }
          
          // Перевіряємо колір зверху
          if (row > 0 && this.grid[row - 1][col]) {
            const topColor = this.grid[row - 1][col].type;
            // 70% шанс уникнути такого ж кольору
            if (Math.random() < 0.7) {
              availableColors = availableColors.filter(color => color !== topColor);
            }
          }
          
          // Якщо не залишилось доступних кольорів, використовуємо всі
          if (availableColors.length === 0) {
            availableColors = [...this.bubbleTypes];
          }
          
          const type = availableColors[Math.floor(Math.random() * availableColors.length)];
          arr.push({
            type,
            row,
            col
          });
        } else {
          arr.push(null);
        }
      }
      this.grid.push(arr);
    }
  }

  createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.life -= p.decay;
      
      if (p.life > 0) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });
  }

  spawnShootingBubble() {
    const type = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    this.shootingBubble = {
      type,
      x: this.canvas.width / 2,
      y: this.shooterY,
      dx: 0,
      dy: 0,
      moving: false
    };
  }

  aim(e) {
    if (this.shootingBubble.moving) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - this.shootingBubble.x;
    const dy = my - this.shootingBubble.y;
    
    // Calculate angle but invert Y to make upward = negative
    this.shootingAngle = Math.atan2(-dy, dx);
    
    // Restrict angle to shoot only upwards (between 0.15π and 0.85π)
    if (this.shootingAngle > 0) {
      this.shootingAngle = Math.min(Math.PI * 0.85, this.shootingAngle);
    } else {
      this.shootingAngle = Math.max(-Math.PI * 0.85, this.shootingAngle);
    }
  }

  shoot(e) {
    if (this.shootingBubble.moving) return;
    
    this.playSound('shoot');
    const BUBBLE_SPEED = 600;
    // Shoot in the direction of aim, but invert Y velocity for upward motion
    this.shootingBubble.dx = Math.cos(this.shootingAngle) * BUBBLE_SPEED;
    this.shootingBubble.dy = -Math.sin(Math.abs(this.shootingAngle)) * BUBBLE_SPEED;
    this.shootingBubble.moving = true;
  }

  startGame() {
    this.isPaused = false;
    this.score = 0;
    this.isGameOver = false;
    this.lastTime = 0;
    if (this.gameMode === 'timed') {
      this.timeLeft = 60;
      this.dropTimer = 9; // Таймер для опускання кульок
      this.updateTimer();
    }
    this.updateScore();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    if (this.isPaused || this.isGameOver) return;

    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.gameMode === 'timed') {
      this.timeLeft -= deltaTime;
      this.dropTimer -= deltaTime;
      this.updateTimer();
      
      // Опускаємо кульки кожні 9 секунд
      if (this.dropTimer <= 0) {
        this.dropBubblesOneRow();
        this.dropTimer = 9; // Скидаємо таймер
      }
      
      if (this.timeLeft <= 0) {
        this.gameOver();
        return;
      }
    }
    
    if (this.explodingBubbles.length > 0) {
      for (const b of this.explodingBubbles) {
        b.progress += 0.08;
        if (b.progress < 0.1) {
          const {x, y} = this.gridToPixel(b.row, b.col);
          this.createParticles(x, y, b.type, 8);
        }
      }
      if (this.explodingBubbles[0].progress >= 1) {
        for (const b of this.explodingBubbles) {
          this.grid[b.row][b.col] = null;
        }
        this.explodingBubbles = [];
      }
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawShootingBubble();
    this.drawAimLine();
    this.updateShootingBubble(deltaTime);
    this.updateParticles(deltaTime);
    requestAnimationFrame((time) => this.loop(time));
  }

  updateTimer() {
    if (this.timerEl) {
      const seconds = Math.max(0, Math.ceil(this.timeLeft));
      this.timerEl.textContent = `Time: ${seconds}s`;
    }
  }

  drawGrid() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          // Якщо кулька вибухає — малюємо з анімацією
          const exploding = this.explodingBubbles.find(b => b.row === row && b.col === col);
          if (exploding) {
            const { x, y } = this.gridToPixel(row, col);
            this.drawBubbleAnimated(x, y, bubble.type, exploding.progress);
          } else {
            const { x, y } = this.gridToPixel(row, col);
            this.drawBubble(x, y, bubble.type);
          }
        }
      }
    }
  }

  drawBubble(x, y, type) {
    this.ctx.save();
    
    // Enable image smoothing for better quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Draw shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 3;
    
    // Draw white circle background
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    
    // Create clipping path for the sprite
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius - 2, 0, Math.PI * 2);
    this.ctx.clip();
    
    // Draw the bubble image with proper size
    const img = this.bubbleImages[type];
    if (img) {
      // Draw the sprite slightly smaller than the bubble radius
      const spriteSize = this.bubbleRadius * 1.8; // Reduced size to ensure it fits inside
      this.ctx.drawImage(
        img,
        x - spriteSize / 2,
        y - spriteSize / 2,
        spriteSize,
        spriteSize
      );
    }
    
    this.ctx.restore();
    
    // Draw a subtle border
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawBubbleAnimated(x, y, type, progress) {
    this.ctx.save();
    this.ctx.globalAlpha = 1 - progress;
    this.ctx.translate(x, y);
    const scale = 1 - progress;
    this.ctx.scale(scale, scale);
    
    // Enable image smoothing for better quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Draw shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 3;
    
    // Draw white circle background
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    
    // Create clipping path for the sprite
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bubbleRadius - 2, 0, Math.PI * 2);
    this.ctx.clip();
    
    // Draw the bubble image
    const img = this.bubbleImages[type];
    if (img) {
      // Draw the sprite slightly smaller than the bubble radius
      const spriteSize = this.bubbleRadius * 1.8;
      this.ctx.drawImage(
        img,
        -spriteSize / 2,
        -spriteSize / 2,
        spriteSize,
        spriteSize
      );
    }
    
    this.ctx.restore();
    
    // Draw a subtle border
    this.ctx.save();
    this.ctx.globalAlpha = 1 - progress;
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.restore();
  }

  gridToPixel(row, col) {
    const evenRow = row % 2 === 0;
    const x = this.sidePadding + (evenRow ? 0 : this.bubbleRadius) + col * this.bubbleRadius * 2;
    const y = row * this.bubbleRadius * 1.8 + this.bubbleRadius;
    return { x, y };
  }

  pixelToGrid(x, y) {
    const row = Math.floor((y - this.bubbleRadius) / (this.bubbleRadius * 1.8));
    const evenRow = row % 2 === 0;
    const col = Math.floor((x - this.sidePadding - (evenRow ? 0 : this.bubbleRadius)) / (this.bubbleRadius * 2));
    return { row, col };
  }

  drawShootingBubble() {
    if (!this.shootingBubble) return;
    
    this.ctx.save();
    if (this.shootingBubble.moving) {
      // Add motion blur effect
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 16;
      this.ctx.globalAlpha = 0.96;
    }
    
    this.drawBubble(
      this.shootingBubble.x,
      this.shootingBubble.y,
      this.shootingBubble.type
    );
    
    this.ctx.restore();
  }

  drawAimLine() {
    if (!this.shootingBubble.moving) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([8, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.shootingBubble.x, this.shootingBubble.y);
      
      // Draw aim line upward
      const lineLength = 200;
      const tx = this.shootingBubble.x + Math.cos(this.shootingAngle) * lineLength;
      const ty = this.shootingBubble.y - Math.sin(Math.abs(this.shootingAngle)) * lineLength;
      
      this.ctx.lineTo(tx, ty);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.restore();
    }
  }

  updateShootingBubble(deltaTime) {
    if (!this.shootingBubble.moving) return;
    
    // Store previous position
    const prevX = this.shootingBubble.x;
    const prevY = this.shootingBubble.y;

    // Move the bubble using deltaTime
    this.shootingBubble.x += this.shootingBubble.dx * deltaTime;
    this.shootingBubble.y += this.shootingBubble.dy * deltaTime;

    // Calculate boundaries with proper spacing
    const gridWidth = this.cols * (this.bubbleRadius * 2 + 6);
    const padding = (this.playAreaWidth - gridWidth) / 2 + this.sidePadding;
    const leftBoundary = padding + this.bubbleRadius;
    const rightBoundary = this.canvas.width - padding - this.bubbleRadius;
    
    if (this.shootingBubble.x <= leftBoundary || 
        this.shootingBubble.x >= rightBoundary) {
      // Restore position and reverse X direction
      this.shootingBubble.x = prevX;
      this.shootingBubble.dx *= -1;
    }

    // Check if bubble hit the top edge
    if (this.shootingBubble.y <= this.bubbleRadius) {
      const col = Math.round((this.shootingBubble.x - this.bubbleRadius - padding) / (this.bubbleRadius * 2));
      
      // Перевіряємо чи є місце в верхньому ряду
      if (col >= 0 && col < this.cols && !this.grid[0][col]) {
        this.attachBubbleToGrid(0, col);
      } else {
        // Якщо немає місця в верхньому ряду - програш
        this.gameOver();
      }
      return;
    }

    // Check collision with other bubbles
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          const {x, y} = this.gridToPixel(row, col);
          const dx = this.shootingBubble.x - x;
          const dy = this.shootingBubble.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.bubbleRadius * 2) {
            // Find the nearest empty spot
            const possiblePositions = [
              {row: row + 1, col: col},
              {row: row + 1, col: col - 1},
              {row: row + 1, col: col + 1},
              {row: row, col: col - 1},
              {row: row, col: col + 1},
              {row: row - 1, col: col}
            ];

            let foundValidPosition = false;
            for (const pos of possiblePositions) {
              if (pos.row >= 0 && pos.row < this.rows && 
                  pos.col >= 0 && pos.col < this.cols && 
                  !this.grid[pos.row][pos.col]) {
                this.attachBubbleToGrid(pos.row, pos.col);
                foundValidPosition = true;
                return;
              }
            }
            
            // Якщо не знайдено жодної валідної позиції - програш
            if (!foundValidPosition) {
              this.gameOver();
              return;
            }
          }
        }
      }
    }

    // Check if bubble went out of bounds at the bottom
    if (this.shootingBubble.y > this.canvas.height) {
      this.spawnShootingBubble();
    }
  }

  attachBubbleToGrid(hitRow, hitCol) {
    if (hitRow >= 0 && hitRow < this.rows && hitCol >= 0 && hitCol < this.cols) {
      // Дозволяємо кулькам опускатися майже до стрільця
      // Залишаємо мінімальну відстань між останніми кульками і стрільцем
      const {y} = this.gridToPixel(hitRow, hitCol);
      const minDistanceToShooter = this.bubbleRadius * 0.2; // Дуже мала відстань до стрільця
      if (y + this.bubbleRadius >= this.shooterY - minDistanceToShooter) {
        this.gameOver();
        return;
      }

      this.grid[hitRow][hitCol] = {
        type: this.shootingBubble.type,
        row: hitRow,
        col: hitCol
      };
      
      const matches = this.findAndRemoveGroups(hitRow, hitCol);
      if (matches.length >= 3) {
        this.playSound('pop');
        let points = 0;
        if (matches.length === 3) points = 30;
        else if (matches.length === 4) points = 50;
        else if (matches.length >= 5) points = 100;
        
        this.score += points;
        this.updateScore();
        
        // Додаємо рандомний ефект вибуху
        matches.forEach(match => {
          match.explosionDelay = Math.random() * 0.2;
        });
        
        this.explodingBubbles = matches;
        this.checkFloatingBubbles();
      }
      
      this.spawnShootingBubble();
    }
  }

  checkFloatingBubbles() {
    const connected = new Set();
    
    // Find all bubbles connected to the top row
    const checkConnected = (row, col) => {
      const key = `${row},${col}`;
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
          connected.has(key) || !this.grid[row][col]) {
        return;
      }
      
      connected.add(key);
      
      // Check all 6 neighbors in hexagonal grid
      const isEvenRow = row % 2 === 0;
      const neighbors = [
        {r: row-1, c: isEvenRow ? col-1 : col}, // top-left
        {r: row-1, c: isEvenRow ? col : col+1}, // top-right
        {r: row, c: col-1}, // left
        {r: row, c: col+1}, // right
        {r: row+1, c: isEvenRow ? col-1 : col}, // bottom-left
        {r: row+1, c: isEvenRow ? col : col+1}  // bottom-right
      ];
      
      for (const {r, c} of neighbors) {
        checkConnected(r, c);
      }
    };
    
    // Start from top row
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[0][col]) {
        checkConnected(0, col);
      }
    }
    
    // Mark floating bubbles for removal
    const floatingBubbles = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] && !connected.has(`${row},${col}`)) {
          floatingBubbles.push({
            row: row,
            col: col,
            type: this.grid[row][col].type,
            progress: 0
          });
          this.grid[row][col] = null;
        }
      }
    }
    
    // Add floating bubbles to explosion animation if any found
    if (floatingBubbles.length > 0) {
      this.explodingBubbles = [...this.explodingBubbles, ...floatingBubbles];
      this.score += floatingBubbles.length * 10;
      this.updateScore();
    }
  }

  findAndRemoveGroups(row, col) {
    const type = this.grid[row][col].type;
    const visited = new Set();
    const matches = [];
    
    const checkNeighbor = (r, c) => {
      const key = `${r},${c}`;
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols || 
          visited.has(key) || !this.grid[r][c] || 
          this.grid[r][c].type !== type) {
        return;
      }
      
      visited.add(key);
      matches.push({
        row: r,
        col: c,
        type: type,
        progress: 0
      });
      
      const isEvenRow = r % 2 === 0;
      const neighbors = [
        {r: r-1, c: isEvenRow ? c-1 : c},
        {r: r-1, c: isEvenRow ? c : c+1},
        {r: r, c: c-1},
        {r: r, c: c+1},
        {r: r+1, c: isEvenRow ? c-1 : c},
        {r: r+1, c: isEvenRow ? c : c+1}
      ];
      
      for (const {r: nr, c: nc} of neighbors) {
        checkNeighbor(nr, nc);
      }
    };
    
    checkNeighbor(row, col);
    return matches;
  }

  removeFloatingBubbles() {
    // This method is now deprecated, using checkFloatingBubbles instead
    this.checkFloatingBubbles();
  }

  gameOver() {
    this.isGameOver = true;
    this.playSound('game-over');
    
    // Зберігаємо результат в лідерборд з інформацією про режим
    if (typeof window.saveToLeaderboard === 'function') {
      window.saveToLeaderboard(this.score, this.gameMode);
    }
    
    // Анімація появи меню game over
    this.gameOverMenu.classList.remove('hidden');
    this.gameOverMenu.style.animation = 'bounceIn 0.8s ease-out';
    this.gameOverMenu.querySelector('#final-score').textContent = this.score;
  }

  pauseGame() {
    this.isPaused = true;
    this.pauseMenu.classList.remove('hidden');
  }

  resumeGame() {
    this.isPaused = false;
    this.pauseMenu.classList.add('hidden');
    this.loop();
  }

  exitGame() {
    if (typeof window.showMainMenu === 'function') window.showMainMenu();
  }

  updateScore() {
    this.scoreEl.textContent = `Score: ${this.score}`;
  }

  // Функція для опускання всіх кульок на один ряд вниз
  dropBubblesOneRow() {
    // СПОЧАТКУ перевіряємо чи можуть ВСІ кульки безпечно опуститися на один рівень
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          // Обчислюємо де буде кулька після опускання на один рівень
          const newRow = row + 1;
          if (newRow < this.rows) {
            const {y} = this.gridToPixel(newRow, col);
            const minDistanceToShooter = this.bubbleRadius * 0.2;
            // Якщо кулька після опускання досягне критичного рівня - програш
            if (y + this.bubbleRadius >= this.shooterY - minDistanceToShooter) {
              this.gameOver();
              return; // Виходимо без опускання кульок
            }
          }
        }
      }
    }

    // Якщо перевірка пройшла успішно - опускаємо ВСІ кульки на один рівень
    const lastRow = this.rows - 1;
    
    // Опускаємо всі кульки на один ряд вниз
    for (let row = lastRow; row > 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = this.grid[row - 1][col];
        if (this.grid[row][col]) {
          this.grid[row][col].row = row;
        }
      }
    }

    // Очищаємо перший ряд
    for (let col = 0; col < this.cols; col++) {
      this.grid[0][col] = null;
    }

    // Створюємо новий ряд кульок зверху (тепер це безпечно)
    for (let col = 0; col < this.cols; col++) {
      const type = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
      this.grid[0][col] = {
        type,
        row: 0,
        col
      };
    }
  }

  // Нова функція для перевірки завершення гри
  checkGameOver() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          const {y} = this.gridToPixel(row, col);
          const minDistanceToShooter = this.bubbleRadius * 0.2;
          if (y + this.bubbleRadius >= this.shooterY - minDistanceToShooter) {
            this.gameOver();
            return true; // Повертаємо true якщо гра закінчена
          }
        }
      }
    }
    return false; // Гра продовжується
  }
} 