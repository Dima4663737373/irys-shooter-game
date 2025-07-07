export class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('#gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Оптимізація Canvas для високих FPS
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'medium'; // Змінюємо з 'high' на 'medium' для FPS
    
    // Кеш для позицій бульбашок (spatial optimization)
    this.activeBubbles = new Map(); // row,col -> {x, y, type}
    this.bubbleQuadTree = new Map(); // spatial partitioning for collision
    
    this.canvas.width = 400;
    this.canvas.height = 600;
    this.playAreaWidth = this.canvas.width;
    this.playAreaHeight = this.canvas.height - 100;
    
    this.bubbleRadius = 18;
    this.cols = 12; // Зменшуємо з 13 до 12 для більшого простору
    this.rows = 12; // Зменшуємо з 14 до 12 для менш переповненого поля
    this.sidePadding = 60; // Було 25, тепер 60px для вужчого поля
    this.shooterY = this.canvas.height - this.bubbleRadius * 2; // Більше місця для стрільця
    
    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan']; // Прибрали stone
    this.grid = [];
    this.shootingBubble = null;
    this.score = 0;
    this.gameMode = 'endless';
    this.timeLeft = 60;
    this.dropTimer = 10;
    this.lastTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.explodingBubbles = [];
    this.particles = [];
    
    // FPS tracking
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.currentFPS = 0;
    
    // === НОВІ СИСТЕМИ ДЛЯ СКЛАДНОСТІ ===
    this.difficulty = 1; // Початкова складність
    this.difficultyMultiplier = 1; // Множник складності для endless
    this.difficultyInterval = null; // Таймер підвищення складності
    this.shotsCount = 0; // Лічильник пострілів
    this.consecutiveHits = 0; // Послідовні влучення
    this.bubbleGenerationCounter = 0; // Лічильник генерацій
    this.recentColors = []; // Останні кольори на полі
    this.colorDistribution = new Map(); // Розподіл кольорів на полі
    this.lastPatternType = null; // Останній згенерований патерн
    
    this.bubbleImages = {};
    this.sounds = {};
    
    this.allowedBottomRows = 1; // Лише 1 рядок запасу
    
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.frameCounter = 0;
    
    this.threatRowTimer = null;
    
    this.createGrid();
    this.loadImages().then(() => {
      this.spawnShootingBubble();
    });
    this.initSounds();
  }

  async loadImages() {
    console.log('loadImages: Starting to load bubble images:', this.bubbleTypes);
    
    const imagePromises = this.bubbleTypes.map(type => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`loadImages: Successfully loaded ${type}`);
          resolve({ type, img });
        };
        img.onerror = (error) => {
          console.error(`loadImages: Failed to load ${type}:`, error);
                     reject(error);
        };
        img.src = `/ball-${type}.png`;
        console.log(`loadImages: Loading ${type} from /ball-${type}.png`);
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);
      loadedImages.forEach(({type, img}) => {
        this.bubbleImages[type] = img;
        console.log(`loadImages: Added ${type} to bubbleImages`);
      });
      console.log('loadImages: All images loaded successfully');
    } catch (error) {
      console.error('loadImages: Error loading images:', error);
    }
  }

  initSounds() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loadSounds();
      // === Музика для головного меню відключена ===
      // if (!this.menuMusic) {
      //   this.menuMusic = new Audio('main-menu.mp3');
      //   this.menuMusic.loop = true;
      //   this.menuMusic.volume = 0.4;
      // }
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

  // Функція для швидких переходів в грі БЕЗ fade ефектів
  smoothGameTransition(newContent, callback = null) {
    // Миттєва заміна контенту без затримок
    this.container.innerHTML = newContent;
    if (callback) callback();
  }

  showModeSelection() {
    console.log('showModeSelection called');
    const content = `
      <div id="mode-selection" style="background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:32px; text-align:center; width:400px; margin:0 auto; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4); animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
        <h2 id="mode-title" style="margin:0 0 24px 0; color:#333; font-size:2rem; font-weight:bold; animation: bounceIn 1s ease-out 0.3s both; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎮 Select game mode</h2>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="endless-mode" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInLeft 0.6s ease-out 0.5s both;">
            🎯 Endless mode
          </button>
          <button id="timed-mode" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#4096ee; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInUp 0.6s ease-out 0.7s both;">
            ⏱️ 1 minute
          </button>
          <button id="back-to-menu" style="flex:1; padding:12px; font-size:1.1rem; border-radius:8px; border:none; background:#e74c3c; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInRight 0.6s ease-out 0.9s both;">
            🏠 Back
          </button>
        </div>
        <div id="floating-bubbles" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; border-radius:20px;">
        </div>
      </div>
    `;

    this.smoothGameTransition(content, () => {
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

      // Встановлюємо фон через main.js
      if (typeof window.setGlobalBackground === 'function') {
        window.setGlobalBackground();
      }
    });
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
    
    const content = `
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

    this.smoothGameTransition(content, () => {
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
      this.difficultyMultiplier = 1;
      if (this.difficultyInterval) clearInterval(this.difficultyInterval);
      this.startGame();
    });
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
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = null;
      }
    }
    // Стартові ряди не доходять до allowedBottomRows
    const startingRows = Math.max(1, this.rows - this.allowedBottomRows - 1);
    for (let row = 0; row < startingRows; row++) {
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
      for (let col = 0; col < colsInRow; col++) {
        if (Math.random() < 0.8) {
              // Використовуємо всі доступні типи кульок
    const colorTypes = this.bubbleTypes;
          const bubbleType = Math.random() < 0.6 ? colorTypes[Math.floor(Math.random() * colorTypes.length)] : colorTypes[Math.floor(Math.random() * colorTypes.length)];
          this.grid[row][col] = {
            type: bubbleType,
            row: row,
            col: col
          };
        }
      }
    }
    // Додаємо 1-2 кам'яних кульки у випадкові зайняті місця стартових рядів
    const stoneCount = Math.floor(Math.random() * 2) + 1;
    let placed = 0;
    let attempts = 0;
    while (placed < stoneCount && attempts < 100) {
      const row = Math.floor(Math.random() * startingRows);
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
      const col = Math.floor(Math.random() * colsInRow);
      if (this.grid[row][col] && this.grid[row][col].type !== 'stone') {
        this.grid[row][col] = {
          type: 'stone',
          row: row,
          col: col
        };
        placed++;
        console.log('STONE placed at', row, col);
      }
      attempts++;
    }
    this.updateColorDistribution();
    this.rebuildActiveBubblesCache();
  }

  // === НОВА ЛОГІКА РОЗУМНОЇ ГЕНЕРАЦІЇ ===
  generateSmartStartingBubbles() {
    const startingRows = 4;
    for (let row = 0; row < startingRows; row++) {
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
      for (let col = 0; col < colsInRow; col++) {
        if (Math.random() < 0.8) { // Було 0.75, тепер 80% заповнення
          // 60% шанс кластерної генерації, 40% balanced
          const bubbleType = Math.random() < 0.6 ? this.getClusteredBubbleType(row, col) : this.getBalancedBubbleType();
          this.grid[row][col] = {
            type: bubbleType,
            row: row,
            col: col
          };
        }
      }
    }
    this.updateColorDistribution();
  }

  // Розумний вибір типу кульки
  getSmartBubbleType(row, col, strategy = 'adaptive') {
    switch (strategy) {
      case 'balanced':
        return this.getBalancedBubbleType();
      case 'clustered':
        return this.getClusteredBubbleType(row, col);
      case 'challenging':
        return this.getChallengingBubbleType(row, col);
      case 'strategic':
        return this.getStrategicBubbleType();
      default:
        return this.getAdaptiveBubbleType(row, col);
    }
  }

  // Збалансований вибір кольору
  getBalancedBubbleType() {
    // stone не може бути для звичайних кульок
    let minCount = Infinity;
    let rareColors = [];
    for (const type of this.bubbleTypes) {
      if (type === 'stone') continue;
      const count = this.colorDistribution.get(type) || 0;
      if (count < minCount) {
        minCount = count;
        rareColors = [type];
      } else if (count === minCount) {
        rareColors.push(type);
      }
    }
    return rareColors[Math.floor(Math.random() * rareColors.length)];
  }

  // Кластерний вибір (схожі кольори поруч)
  getClusteredBubbleType(row, col) {
    const neighbors = this.getNeighbors(row, col);
    const neighborColors = neighbors
      .filter(({r, c}) => this.grid[r] && this.grid[r][c] && this.grid[r][c].type !== 'stone')
      .map(({r, c}) => this.grid[r][c].type);
    if (neighborColors.length > 0) {
      if (Math.random() < 0.7) {
        return neighborColors[Math.floor(Math.random() * neighborColors.length)];
      }
    }
    // stone не може бути для кластерних
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  // Складний вибір (уникати легких комбінацій)
  getChallengingBubbleType(row, col) {
    const neighbors = this.getNeighbors(row, col);
    const neighborColors = neighbors
      .filter(({r, c}) => this.grid[r] && this.grid[r][c] && this.grid[r][c].type !== 'stone')
      .map(({r, c}) => this.grid[r][c].type);
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    const availableColors = colorTypes.filter(type => !neighborColors.includes(type));
    if (availableColors.length > 0) {
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    }
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  // Стратегічний вибір (базується на кульці гравця)
  getStrategicBubbleType() {
    if (this.shootingBubble) {
      const currentType = this.shootingBubble.type;
      if (currentType === 'stone') return this.getBalancedBubbleType();
      if (Math.random() < 0.4) {
        return currentType;
      }
      if (Math.random() < 0.3) {
        return this.getBalancedBubbleType();
      }
    }
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  // Адаптивний вибір (базується на складності)
  getAdaptiveBubbleType(row, col) {
    const difficultyFactor = Math.min(this.difficulty * this.difficultyMultiplier, 5);
    if (difficultyFactor < 2) {
      return this.getBalancedBubbleType();
    } else if (difficultyFactor < 3) {
      return Math.random() < Math.min(0.8 * this.difficultyMultiplier, 1) ? this.getBalancedBubbleType() : this.getClusteredBubbleType(row, col);
    } else if (difficultyFactor < 4) {
      return Math.random() < Math.min(0.8 * this.difficultyMultiplier, 1) ? this.getClusteredBubbleType(row, col) : this.getChallengingBubbleType(row, col);
    } else {
      // Максимальна складність
      const strategies = ['challenging', 'strategic', 'clustered'];
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      return this.getSmartBubbleType(row, col, strategy);
    }
  }

  // Отримати сусідів клітинки
  getNeighbors(row, col) {
    const isEvenRow = row % 2 === 0;
    return [
      {r: row-1, c: isEvenRow ? col-1 : col},
      {r: row-1, c: isEvenRow ? col : col+1},
      {r: row, c: col-1},
      {r: row, c: col+1},
      {r: row+1, c: isEvenRow ? col-1 : col},
      {r: row+1, c: isEvenRow ? col : col+1}
    ].filter(({r, c}) => r >= 0 && r < this.rows && c >= 0 && c < this.cols);
  }

  // Оновити розподіл кольорів
  updateColorDistribution() {
    this.colorDistribution.clear();
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          const type = this.grid[row][col].type;
          this.colorDistribution.set(type, (this.colorDistribution.get(type) || 0) + 1);
        }
      }
    }
  }

  // Динамічне підвищення складності
  updateDifficulty() {
    const baseScore = this.score;
    const newDifficulty = Math.floor(baseScore / 1000) + 1; // Кожні 1000 очок = +1 складність
    
    // Додаткова складність за послідовні влучення
    if (this.consecutiveHits >= 5) {
      this.difficulty = Math.max(this.difficulty, newDifficulty + 1);
    } else {
      this.difficulty = newDifficulty;
    }
    
    // Обмежуємо максимальну складність
    this.difficulty = Math.min(this.difficulty, 6);
  }

  // Генерація спеціальних патернів
  generateSpecialPattern() {
    if (Math.random() > Math.max(0.3 * this.difficultyMultiplier, 1)) return;
    const patterns = ['wall', 'pyramid', 'checker', 'threat', 'stoneRow'];
    let availablePatterns = patterns.filter(p => p !== this.lastPatternType);
    if (availablePatterns.length === 0) {
      availablePatterns = patterns;
    }
    const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    this.lastPatternType = pattern;
    switch (pattern) {
      case 'wall':
        this.generateWallPattern();
        break;
      case 'pyramid':
        this.generatePyramidPattern();
        break;
      case 'checker':
        this.generateCheckerPattern();
        break;
      case 'threat':
        this.generateThreatPattern();
        break;
      case 'stoneRow':
        this.generateStoneThreatRow();
        break;
    }
  }

  generateWallPattern() {
    // Створюємо стіну з одного кольору в центрі
    const startCol = Math.floor(this.cols * 0.3);
    const endCol = Math.floor(this.cols * 0.7);
    const wallColor = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    
    for (let col = startCol; col < endCol; col++) {
      this.grid[0][col] = {
        type: wallColor,
        row: 0,
        col: col
      };
    }
  }

  generatePyramidPattern() {
    // Створюємо піраміду з центру
    const centerCol = Math.floor(this.cols / 2);
    const pyramidColor = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    
    // Центральна кулька
    this.grid[0][centerCol] = {
      type: pyramidColor,
      row: 0,
      col: centerCol
    };
    
    // Бокові кульки
    if (centerCol > 0) {
      this.grid[0][centerCol - 1] = {
        type: pyramidColor,
        row: 0,
        col: centerCol - 1
      };
    }
    if (centerCol < this.cols - 1) {
      this.grid[0][centerCol + 1] = {
        type: pyramidColor,
        row: 0,
        col: centerCol + 1
      };
    }
  }

  generateCheckerPattern() {
    // Шахова дошка з двох кольорів
    const color1 = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    let color2 = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    while (color2 === color1) {
      color2 = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    }
    
    for (let col = 0; col < this.cols; col++) {
      const color = col % 2 === 0 ? color1 : color2;
      this.grid[0][col] = {
        type: color,
        row: 0,
        col: col
      };
    }
  }

  generateThreatPattern() {
    // Створюємо загрозливий патерн - кульки близько до середини знизу
    const dangerousColors = this.bubbleTypes.slice(); // Копія всіх кольорів
    const centerStart = Math.floor(this.cols * 0.25);
    const centerEnd = Math.floor(this.cols * 0.75);
    
    for (let col = centerStart; col < centerEnd; col++) {
      if (Math.random() < 0.8) { // 80% шанс
        const color = dangerousColors[Math.floor(Math.random() * dangerousColors.length)];
        this.grid[0][col] = {
          type: color,
          row: 0,
          col: col
        };
      }
    }
  }

  generateStoneThreatRow() {
    // Ряд з каменями та одним кольором
    const color = this.bubbleTypes[Math.floor(Math.random() * (this.bubbleTypes.length - 1))];
    for (let col = 0; col < this.cols; col++) {
      this.grid[0][col] = {
        type: Math.random() < 0.6 ? 'stone' : color,
        row: 0,
        col: col
      };
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
      p.x += p.dx * deltaTime * 60;
      p.y += p.dy * deltaTime * 60;
      p.life -= p.decay * deltaTime * 60;
      if (p.life > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        this.ctx.restore();
        return true;
      }
      return false;
    });
  }

  spawnShootingBubble() {
    // stone не може бути для стрільця
    let type;
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    if (Math.random() < 0.6 && this.colorDistribution.size > 0) {
      const availableColors = Array.from(this.colorDistribution.keys()).filter(t => t !== 'stone');
      type = availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
      type = colorTypes[Math.floor(Math.random() * colorTypes.length)];
    }
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
    if (this.shootingBubble.moving || this.isPaused || this.isGameOver) return;
    
    this.playSound('shoot');
    
    // Оновлюємо лічильники
    this.shotsCount++;
    this.updateDifficulty();
    
    const speed = 850; // Збільшуємо швидкість з 780 до 850 для кращого відчуття
    this.shootingBubble.dx = Math.cos(this.shootingAngle) * speed;
    this.shootingBubble.dy = -Math.sin(Math.abs(this.shootingAngle)) * speed; // Negative for upward movement
    this.shootingBubble.moving = true;
  }

  startGame() {
    this.isPaused = false;
    this.score = 0;
    this.isGameOver = false;
    this.lastTime = 0;
    if (this.gameMode === 'timed') {
      this.timeLeft = 60;
      this.dropTimer = 10;
      this.updateTimer();
    }
    // === Додаємо таймер складності для endless ===
    if (this.gameMode === 'endless') {
      this.difficultyMultiplier = 1;
      if (this.difficultyInterval) clearInterval(this.difficultyInterval);
      this.difficultyInterval = setInterval(() => {
        this.difficultyMultiplier = Math.min(this.difficultyMultiplier * 1.5, 10);
        // Можна показати повідомлення або анімацію про підвищення складності
      }, 20000);
      if (this.threatRowTimer) clearInterval(this.threatRowTimer);
      this.threatRowTimer = setInterval(() => {
        this.generateStoneThreatRow();
      }, 35000); // кожні 35 секунд
    }
    this.updateScore();
    requestAnimationFrame((time) => this.loop(time));

    // Зупиняємо музику головного меню
    if (this.menuMusic && !this.menuMusic.paused) {
      this.menuMusic.pause();
      this.menuMusic.currentTime = 0;
    }

    // Встановлюємо фон під час гри
    if (typeof window.setGlobalBackground === 'function') {
      window.setGlobalBackground();
    }
  }

  loop(currentTime) {
    if (this.isPaused || this.isGameOver) return;
    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    // FPS
    this.frameCounter++;
    if (currentTime - this.lastFpsUpdate > 1000) {
      this.fps = this.frameCounter;
      this.frameCounter = 0;
      this.lastFpsUpdate = currentTime;
    }
    // Game mode logic
    if (this.gameMode === 'timed') {
      this.timeLeft -= deltaTime;
      this.dropTimer -= deltaTime;
      this.updateTimer();
      
      if (this.dropTimer <= 0) {
        this.dropBubblesOneRow();
        this.dropTimer = 10;
      }
      
      if (this.timeLeft <= 0) {
        this.gameOver();
        return;
      }
    }
    
    // Update explosion animations with optimized deltaTime
    if (this.explodingBubbles.length > 0) {
      const explosionSpeed = deltaTime * 5.0; // Прискорюємо анімацію
      
      for (let i = this.explodingBubbles.length - 1; i >= 0; i--) {
        const b = this.explodingBubbles[i];
        b.progress += explosionSpeed;
        
        // Create particles only once at start
        if (b.progress < 0.15 && !b.particlesCreated) {
          const {x, y} = this.gridToPixel(b.row, b.col);
          this.createParticles(x, y, b.type, 6); // Fewer particles for performance
          b.particlesCreated = true;
        }
        
        // Remove completed explosions immediately
        if (b.progress >= 1) {
          this.grid[b.row][b.col] = null;
          this.updateActiveBubblesCache(b.row, b.col, null); // Update cache
          this.explodingBubbles.splice(i, 1);
        }
      }
    }
    
    // Clear canvas once per frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Optimized render calls
    this.drawGrid();
    this.drawShootingBubble();
    this.drawAimLine();
    
    // Update systems
    this.updateShootingBubble(deltaTime);
    this.updateParticles(deltaTime);
    
    // Draw FPS
    this.drawFPS();
    
    // Next frame
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
    console.log('drawBubble called with type:', type, 'at position:', x, y);
    this.ctx.save();
    
    // Кольори для кульок
    const colors = {
      'blue': '#4A90E2',
      'red': '#E74C3C',
      'yellow': '#F1C40F',
      'kyan': '#1ABC9C'
    };
    
    console.log('Using color:', colors[type] || '#999999', 'for type:', type);
    
    // Тінь
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 2;
    
    // Основна кулька
    const color = colors[type] || '#999999';
    console.log('Setting fillStyle to:', color);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.fill();
    console.log('Bubble drawn with color:', this.ctx.fillStyle);
    
    // Глянець
    this.ctx.shadowColor = 'transparent';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(x - 6, y - 6, this.bubbleRadius / 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Рамка
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawBubbleAnimated(x, y, type, progress) {
    this.ctx.save();
    // Easing: scale та opacity
    const scale = 1 + 0.5 * Math.sin(Math.PI * progress);
    const alpha = 1 - progress;
    this.ctx.globalAlpha = alpha;
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-x, -y);
    this.drawBubble(x, y, type);
    this.ctx.restore();
  }

  gridToPixel(row, col) {
    const evenRow = row % 2 === 0;
    const bubbleSpacing = this.bubbleRadius * 2.1; // Збільшуємо простір між кульками
    const x = this.sidePadding + (evenRow ? 0 : this.bubbleRadius) + col * bubbleSpacing;
    const y = row * this.bubbleRadius * 1.9 + this.bubbleRadius + 20; // Більший вертикальний простір
    return { x, y };
  }

  pixelToGrid(x, y) {
    const bubbleSpacing = this.bubbleRadius * 2.1;
    const row = Math.floor((y - this.bubbleRadius - 20) / (this.bubbleRadius * 1.9));
    const evenRow = row % 2 === 0;
    const col = Math.floor((x - this.sidePadding - (evenRow ? 0 : this.bubbleRadius)) / bubbleSpacing);
    return { row, col };
  }

  drawShootingBubble() {
    if (this.isGameOver || !this.shootingBubble) return;
    
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
    if (!this.shootingBubble || this.isGameOver) return;
    const prevX = this.shootingBubble.x;
    const prevY = this.shootingBubble.y;
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
      
      if (col >= 0 && col < this.cols && !this.grid[0][col]) {
        this.attachBubbleToGrid(0, col);
      } else {
        this.gameOver();
      }
      return;
    }

    // OPTIMIZED: Use new collision detection system
    const collision = this.checkCollisionOptimized(this.shootingBubble.x, this.shootingBubble.y, prevX, prevY);
    if (collision) {
      // Знаходимо всі сусідні клітинки навколо точки зіткнення
      const neighborOffsets = [
        {dr: 1, dc: 0},
        {dr: 1, dc: -1},
        {dr: 1, dc: 1},
        {dr: 0, dc: -1},
        {dr: 0, dc: 1},
        {dr: -1, dc: 0}
      ];
      const isEvenRow = collision.row % 2 === 0;
      const neighborCoords = [
        {row: collision.row + 1, col: collision.col},
        {row: collision.row + 1, col: isEvenRow ? collision.col - 1 : collision.col + 1},
        {row: collision.row, col: collision.col - 1},
        {row: collision.row, col: collision.col + 1},
        {row: collision.row - 1, col: collision.col},
        {row: collision.row - 1, col: isEvenRow ? collision.col - 1 : collision.col + 1}
      ];
      // Знаходимо найближчу вільну клітинку
      let minDist = Infinity;
      let bestPos = null;
      for (const pos of neighborCoords) {
        if (
          pos.row >= 0 && pos.row < this.rows &&
          pos.col >= 0 && pos.col < this.cols &&
          !this.grid[pos.row][pos.col]
        ) {
          const {x, y} = this.gridToPixel(pos.row, pos.col);
          const dx = this.shootingBubble.x - x;
          const dy = this.shootingBubble.y - y;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            bestPos = pos;
          }
        }
      }
      if (bestPos) {
        this.attachBubbleToGrid(bestPos.row, bestPos.col);
        return;
      } else {
        // Якщо немає вільного місця серед сусідів — шукаємо найнижчу вільну клітинку у цій колонці
        let fallbackRow = null;
        for (let row = this.rows - 1; row >= 0; row--) {
          if (!this.grid[row][collision.col]) {
            fallbackRow = row;
            break;
          }
        }
        if (fallbackRow !== null) {
          this.attachBubbleToGrid(fallbackRow, collision.col);
          return;
        }
        this.gameOver();
        this.shootingBubble = null;
        return;
      }
    }

    // Check if bubble went out of bounds at the bottom
    if (this.shootingBubble.y > this.canvas.height) {
      this.spawnShootingBubble();
    }
  }

  attachBubbleToGrid(hitRow, hitCol) {
    if (hitRow >= 0 && hitRow < this.rows && hitCol >= 0 && hitCol < this.cols) {
      if (hitRow >= this.rows - this.allowedBottomRows) {
        this.gameOver();
        this.shootingBubble = null;
        return;
      }
      this.grid[hitRow][hitCol] = {
        type: this.shootingBubble.type,
        row: hitRow,
        col: hitCol
      };
      // Оновлюємо кеш для оптимізації FPS
      this.updateActiveBubblesCache(hitRow, hitCol, this.grid[hitRow][hitCol]);
      const matches = this.findAndRemoveGroups(hitRow, hitCol);
      if (matches.length >= 3) {
        this.playSound('pop');
        let points = 0;
        if (matches.length === 3) points = 30;
        else if (matches.length === 4) points = 50;
        else if (matches.length >= 5) points = 100;
        this.score += points;
        // Оновлюємо лічильники
        this.consecutiveHits++;
        this.updateDifficulty();
        this.updateScore();
        // Додаємо рандомний ефект вибуху
        matches.forEach(match => {
          match.explosionDelay = Math.random() * 0.2;
          match.particlesCreated = false; // Для оптимізації
          // Видаляємо тільки ці кульки з grid
          this.grid[match.row][match.col] = null;
          this.updateActiveBubblesCache(match.row, match.col, null);
        });
        this.explodingBubbles = matches;
        this.checkFloatingBubbles();
      } else {
        // Reset consecutive hits if no match
        this.consecutiveHits = 0;
      }
      // Оновлюємо розподіл кольорів
      this.updateColorDistribution();
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
    // stone падає як звичайна кулька
    this.checkFloatingBubbles();
  }

  gameOver() {
    this.isGameOver = true;
    this.playSound('game-over');
    this.shootingBubble = null;
    if (this.difficultyInterval) clearInterval(this.difficultyInterval);
    if (this.threatRowTimer) clearInterval(this.threatRowTimer);
    
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
    // Встановлюємо правильний фон перед поверненням в меню
    if (typeof window.setGlobalBackground === 'function') window.setGlobalBackground();
    if (typeof window.showMainMenu === 'function') window.showMainMenu();
  }

  updateScore() {
    this.scoreEl.textContent = `Score: ${this.score}`;
  }

  // Функція для опускання всіх кульок на один ряд вниз
  dropBubblesOneRow() {
    // Зсуваємо всі ряди вниз на 1, не ущільнюючи кульки
    const lastRow = this.rows - 1;
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
    this.bubbleGenerationCounter++;
    if (this.bubbleGenerationCounter % 5 === 0) {
      this.generateSpecialPattern();
    } else {
      for (let col = 0; col < this.cols; col++) {
        const bubbleType = this.getSmartBubbleType(0, col, 'adaptive');
        this.grid[0][col] = {
          type: bubbleType,
          row: 0,
          col: col
        };
      }
    }
    this.updateColorDistribution();
    this.rebuildActiveBubblesCache();
  }

  // Нова функція для перевірки завершення гри
  checkGameOver() {
    // Видалено перевірку програшу по shooterY
    return false;
  }

  // Cache management for optimized collision detection
  updateActiveBubblesCache(row, col, bubble) {
    const key = `${row},${col}`;
    if (bubble === null) {
      this.activeBubbles.delete(key);
    } else {
      const {x, y} = this.gridToPixel(row, col);
      this.activeBubbles.set(key, {x, y, type: bubble.type, row, col});
    }
  }
  
  rebuildActiveBubblesCache() {
    this.activeBubbles.clear();
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          this.updateActiveBubblesCache(row, col, this.grid[row][col]);
        }
      }
    }
  }
  
  // Optimized collision detection using spatial partitioning
  checkCollisionOptimized(bubbleX, bubbleY, prevX = null, prevY = null) {
    // Якщо prevX/prevY не задані — перевіряємо лише поточну позицію (старий режим)
    if (prevX === null || prevY === null) {
      const searchRadius = this.bubbleRadius * 2.2;
      for (const [key, activeBubble] of this.activeBubbles) {
        const dx = bubbleX - activeBubble.x;
        const dy = bubbleY - activeBubble.y;
        if (Math.abs(dx) > searchRadius || Math.abs(dy) > searchRadius) continue;
        const distanceSquared = dx * dx + dy * dy;
        const collisionDistanceSquared = (this.bubbleRadius * 2) * (this.bubbleRadius * 2);
        if (distanceSquared < collisionDistanceSquared) {
          return activeBubble;
        }
      }
      return null;
    }
    // RAYCAST: перевіряємо колізію по всій траєкторії між prevX,prevY і bubbleX,bubbleY
    const steps = Math.ceil(Math.max(Math.abs(bubbleX - prevX), Math.abs(bubbleY - prevY)) / (this.bubbleRadius / 2));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = prevX + (bubbleX - prevX) * t;
      const y = prevY + (bubbleY - prevY) * t;
      const searchRadius = this.bubbleRadius * 2.2;
      for (const [key, activeBubble] of this.activeBubbles) {
        const dx = x - activeBubble.x;
        const dy = y - activeBubble.y;
        if (Math.abs(dx) > searchRadius || Math.abs(dy) > searchRadius) continue;
        const distanceSquared = dx * dx + dy * dy;
        const collisionDistanceSquared = (this.bubbleRadius * 2) * (this.bubbleRadius * 2);
        if (distanceSquared < collisionDistanceSquared) {
          return activeBubble;
        }
      }
    }
    return null;
  }

  // FPS лічильник
  drawFPS() {
    this.ctx.save();
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 22);
    this.ctx.restore();
  }
} 