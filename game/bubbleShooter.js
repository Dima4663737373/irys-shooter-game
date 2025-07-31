// Імпортуємо методи таймера ходу
import {
  startMoveTimer,
  updateMoveTimer,
  autoShoot,
  stopMoveTimer,
  createMoveTimerUI,
  updateMoveTimerUI,
  hideMoveTimerUI
} from './moveTimer.js';

export class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('#gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Максимальна якість зображень для чітких спрайтів
    this.ctx.imageSmoothingEnabled = false; // Відключаємо згладжування для чітких пікселевих спрайтів

    // Кеш для позицій бульбашок (spatial optimization)
    this.activeBubbles = new Map(); // row,col -> {x, y, type}
    this.bubbleQuadTree = new Map(); // spatial partitioning for collision

    this.canvas.width = 480; // Збільшуємо з 400 до 480 для кращої якості
    this.canvas.height = 720; // Збільшуємо з 600 до 720 для кращої якості
    this.playAreaWidth = this.canvas.width;
    this.playAreaHeight = this.canvas.height - 120;

    this.bubbleRadius = 22; // Збільшуємо з 18 до 22 для кращої деталізації спрайтів
    this.cols = 12; // Зменшуємо з 13 до 12 для більшого простору
    this.rows = 12; // Зменшуємо з 14 до 12 для менш переповненого поля
    this.sidePadding = 60; // Було 25, тепер 60px для вужчого поля
    this.shooterY = this.canvas.height - this.bubbleRadius * 1.5; // Позиція стрільця нижче

    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan', 'heart']; // Всі кастомні спрайти
    this.grid = [];
    this.shootingBubble = null;
    this.score = 0;
    this.gameMode = 'endless';
    this.timeLeft = 60;
    this.dropTimer = 10;
    this.lastTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.scoreSubmitted = false; // Флаг для відстеження чи результат вже збережений
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

    // 🔍 ГЛОБАЛЬНА СИСТЕМА МОНІТОРИНГУ GRID
    this.gridMonitor = {
      enabled: true,
      operations: [],
      maxOperations: 500
    };

    this.createGrid();
    this.loadImages().then(() => {
      this.spawnShootingBubble();
    });
    this.initSounds();

    // Робимо гру доступною глобально для відладки
    if (typeof window !== 'undefined') {
      window.debugGame = this;
    }

    // Додаємо методи таймера ходу до класу
    this.startMoveTimer = startMoveTimer.bind(this);
    this.updateMoveTimer = updateMoveTimer.bind(this);
    this.autoShoot = autoShoot.bind(this);
    this.stopMoveTimer = stopMoveTimer.bind(this);
    this.createMoveTimerUI = createMoveTimerUI.bind(this);
    this.updateMoveTimerUI = updateMoveTimerUI.bind(this);
    this.hideMoveTimerUI = hideMoveTimerUI.bind(this);

    // Очищуємо будь-які залишкові таймери при створенні нового екземпляра
    const existingTimer = document.getElementById('move-timer');
    if (existingTimer) {
      existingTimer.remove();
      console.log('Timer UI removed in constructor');
    }
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
      loadedImages.forEach(({ type, img }) => {
        this.bubbleImages[type] = img;
        console.log(`loadImages: Added ${type} to bubbleImages`);
      });
      console.log('loadImages: All images loaded successfully');
    } catch (error) {
      console.error('loadImages: Error loading images:', error);
    }
  }

  initSounds() {
    this.soundEnabled = true; // Спочатку звуки включені
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loadSounds();
      console.log('Sounds initialized successfully');
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
    console.log(`Trying to play sound: ${soundName}, soundEnabled: ${this.soundEnabled}`);
    if (!this.soundEnabled) {
      console.log('Sound disabled, not playing');
      return;
    }

    if (soundName === 'shoot') {
      this.generateAndPlayTone(800, 400, 0.2, 0.3, 'exponential');
    } else if (soundName === 'pop') {
      this.generateAndPlayTone(200, 1000, 0.3, 0.4, 'linear');
    } else if (soundName === 'menu') {
      console.log('Playing menu hover sound');
      this.generateAndPlayTone(600, 200, 0.15, 0.2, 'exponential');
    } else if (soundName === 'game-over') {
      this.generateAndPlayTone(400, -300, 1.0, 0.3, 'exponential');
    } else if (soundName === 'start') {
      this.generateAndPlayTone(300, 500, 0.8, 0.4, 'exponential');
    }
  }

  generateAndPlayTone(startFreq, freqChange, duration, volume, curve = 'exponential') {
    if (!this.audioContext) {
      console.warn('No audio context available');
      return;
    }

    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

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
      console.log(`Sound tone generated: freq ${startFreq}, duration ${duration}, volume ${volume}`);
    } catch (e) {
      console.warn('Could not play sound:', e);
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

    // Приховуємо таймер ходу, якщо він активний
    this.stopMoveTimer();

    // Миттєво видаляємо таймер з DOM
    const existingTimer = document.getElementById('move-timer');
    if (existingTimer) {
      existingTimer.remove();
      console.log('Timer UI forcefully removed');
    }

    const content = `
      <div id="mode-selection" style="
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
        border: 3px solid transparent;
        background-clip: padding-box;
        border-radius: 24px;
        box-shadow: 
          0 20px 60px rgba(0,0,0,0.15),
          0 8px 32px rgba(67,206,162,0.2),
          inset 0 1px 0 rgba(255,255,255,0.8);
        padding: 40px 32px;
        text-align: center;
        width: 480px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      ">
        <!-- Декоративний градієнт фон -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(67,206,162,0.05) 0%, rgba(24,90,157,0.05) 100%);
          border-radius: 24px;
          z-index: -1;
          animation: backgroundShimmer 4s ease-in-out infinite alternate;
        "></div>
        
        <!-- Декоративна рамка -->
        <div style="
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #43cea2 0%, #185a9d 50%, #43cea2 100%);
          border-radius: 26px;
          z-index: -2;
          animation: borderGlow 3s ease-in-out infinite alternate;
        "></div>
        
        <h2 id="mode-title" style="margin:0 0 32px 0; color:#333; font-size:2rem; font-weight:bold; animation: bounceIn 1s ease-out 0.3s both; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎮 Select game mode</h2>
        <div style="display:flex; flex-direction:column; gap:16px; align-items:center;">
          <div style="display:flex; gap:16px; width:100%; justify-content:center;">
            <button id="endless-mode" style="flex:1; max-width:180px; padding:14px 16px; font-size:1rem; border-radius:10px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInLeft 0.6s ease-out 0.5s both; box-shadow:0 4px 12px rgba(67,206,162,0.3);">
              🎯 Endless Mode
            </button>
            <button id="timed-mode" style="flex:1; max-width:180px; padding:14px 16px; font-size:1rem; border-radius:10px; border:none; background:#4096ee; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInRight 0.6s ease-out 0.5s both; box-shadow:0 4px 12px rgba(64,150,238,0.3);">
              ⏱️ 1 Minute Mode
            </button>
          </div>
          <button id="back-to-menu" style="width:200px; padding:12px 16px; font-size:1rem; border-radius:10px; border:none; background:#e74c3c; color:#fff; font-weight:bold; cursor:pointer; transition:all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); animation: slideInUp 0.6s ease-out 0.7s both; box-shadow:0 4px 12px rgba(231,76,60,0.3);">
            🏠 Back
          </button>
        </div>
        <div id="floating-bubbles" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; border-radius:24px;">
        </div>
        
        <style>
          @keyframes borderGlow {
            0% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          
          @keyframes backgroundShimmer {
            0% { opacity: 0.3; }
            100% { opacity: 0.7; }
          }
        </style>
      </div>
    `;

    this.smoothGameTransition(content, () => {
      // Додаємо hover ефекти та звуки
      const buttons = this.container.querySelectorAll('button');
      console.log(`Found ${buttons.length} buttons for mode selection`);
      buttons.forEach((button, index) => {
        console.log(`Adding hover events to button ${index}: ${button.id}`);
        button.onmouseover = () => {
          console.log(`Button ${button.id} hovered`);
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
    // Очищуємо будь-які залишкові таймери перед ініціалізацією
    this.stopMoveTimer();
    const existingTimer = document.getElementById('move-timer');
    if (existingTimer) {
      existingTimer.remove();
      console.log('Timer UI removed in init()');
    }

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
          <button id="pause-btn" class="pause-btn" style="padding:8px 16px; font-size:1.1rem; border-radius:8px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer;">⏸️ Pause</button>
      </div>
      <div style="position:relative;">
          <canvas id="game-canvas" width="${gameWidth}" height="${gameHeight}" style="background:#666; border-radius:12px;"></canvas>
        <div id="pause-menu" class="hidden">
          <h2>Paused</h2>
          <button id="resume-btn">▶️ Resume</button>
          <button id="exit-btn" style="background:#e74c3c; color:#fff;">🚪 Exit</button>
          </div>
          <div id="game-over" class="hidden" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); padding:30px; border-radius:20px; text-align:center; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4);">
            <h2 style="margin:0 0 20px 0; color:#2C3E50;">Game Over!</h2>
            <p style="margin:0 0 25px 0; color:#7F8C8D;">Final Score: <span id="final-score">0</span></p>
            <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
              <button id="play-again-btn" style="padding:12px 30px; font-size:1.1rem; border-radius:12px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; width:160px;">🔄 Play Again</button>
              <button id="back-to-menu-btn" style="padding:12px 30px; font-size:1.1rem; border-radius:12px; border:none; background:#e74c3c; color:#fff; font-weight:bold; cursor:pointer; width:160px;">🏠 Back to Menu</button>
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
    try {
      // Safe button event listeners with existence checks
      const pauseBtn = this.container.querySelector('#pause-btn');
      const resumeBtn = this.container.querySelector('#resume-btn');
      const exitBtn = this.container.querySelector('#exit-btn');
      const playAgainBtn = this.container.querySelector('#play-again-btn');
      const backToMenuBtn = this.container.querySelector('#back-to-menu-btn');
      
      if (pauseBtn) {
        pauseBtn.onclick = () => {
          console.log('Pause button clicked');
          this.pauseGame();
        };
      }
      if (resumeBtn) {
        resumeBtn.onclick = () => {
          console.log('Resume button clicked');
          this.resumeGame();
        };
      }
      if (exitBtn) {
        exitBtn.onclick = () => {
          console.log('Exit button clicked');
          this.exitGame();
        };
      }
      if (playAgainBtn) {
        playAgainBtn.onclick = () => {
          console.log('Play again button clicked');
          this.showModeSelection();
        };
      }
      if (backToMenuBtn) {
        backToMenuBtn.onclick = () => {
          console.log('Back to menu button clicked');
          this.exitGame();
        };
      }
      
      // Safe canvas event listeners
      if (this.canvas) {
        this.canvas.addEventListener('mousemove', (e) => {
          try {
            this.aim(e);
          } catch (error) {
            console.error('Error in mousemove handler:', error);
          }
        });
        this.canvas.addEventListener('click', (e) => {
          try {
            console.log('Canvas clicked');
            this.shoot(e);
          } catch (error) {
            console.error('Error in click handler:', error);
          }
        });
      }
      
      console.log('Event listeners added successfully');
    } catch (error) {
      console.error('Error adding event listeners:', error);
    }
  }

  createGrid() {
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = null; // Initial null setup is OK
      }
    }
    // Генеруємо на 3 ряди менше для вищого розташування
    const startingRows = Math.max(1, this.rows - this.allowedBottomRows - 4); // Було -1, тепер -4

    // Спочатку створюємо базову структуру з гарантованими шариками
    this.createBalancedStructure(startingRows);

    // Потім додаємо випадкові шарики для рознообразності, уникаючи великих пустот
    this.fillEmptyAreas(startingRows);
    // Частіше додаємо кам'яні кульки для більш загруженого поля (1-2 замість 0-1)
    const stoneCount = Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : 2) : 0; // 70% шанс 1-2 каменів
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
        this.updateActiveBubblesCache(row, col, this.grid[row][col]);
        placed++;
        console.log('STONE placed at', row, col);
      }
      attempts++;
    }
    this.updateColorDistribution();
    this.rebuildActiveBubblesCache();
  }

  // Створюємо збалансовану базову структуру
  createBalancedStructure(startingRows) {
    for (let row = 0; row < startingRows; row++) {
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;

      // Створюємо паттерн з регулярними інтервалами
      for (let col = 0; col < colsInRow; col++) {
        // Кожен 2-й шарик у шаховому порядку - гарантований
        const isGuaranteedPosition = (row + col) % 3 !== 2; // ~67% позицій

        if (isGuaranteedPosition) {
          const bubbleType = this.selectBubbleTypeAvoidingSequence(row, col);
          this.grid[row][col] = {
            type: bubbleType,
            row: row,
            col: col
          };
          this.updateActiveBubblesCache(row, col, this.grid[row][col]);
        }
      }
    }
  }

  // Заповнюємо пусті області, уникаючи великих пустот
  fillEmptyAreas(startingRows) {
    for (let row = 0; row < startingRows; row++) {
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;

      for (let col = 0; col < colsInRow; col++) {
        // Пропускаємо вже заповнені клітинки
        if (this.grid[row][col]) continue;

        // Перевіряємо, чи створить пустота велику пустую зону
        const emptyNeighbors = this.countEmptyNeighbors(row, col);
        const shouldFill = emptyNeighbors >= 3 || Math.random() < 0.3;

        if (shouldFill) {
          const bubbleType = this.selectBubbleTypeAvoidingSequence(row, col);
          this.grid[row][col] = {
            type: bubbleType,
            row: row,
            col: col
          };
          this.updateActiveBubblesCache(row, col, this.grid[row][col]);
        }
      }
    }
  }

  // Рахує кількість пустих сусідів навколо позиції
  countEmptyNeighbors(row, col) {
    const neighbors = this.getNeighbors(row, col);
    let emptyCount = 0;

    for (const { r, c } of neighbors) {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        if (!this.grid[r][c]) {
          emptyCount++;
        }
      } else {
        // Позиції за межами поля рахуємо як пусті
        emptyCount++;
      }
    }

    return emptyCount;
  }

  // Функція для вибору типу кульки, уникаючи довгих послідовностей
  selectBubbleTypeAvoidingSequence(row, col) {
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    const avoidTypes = new Set();

    // Перевіряємо горизонтальну послідовність зліва
    let consecutiveCount = 0;
    let lastType = null;
    for (let checkCol = col - 1; checkCol >= 0; checkCol--) {
      if (this.grid[row][checkCol] && this.grid[row][checkCol].type !== 'stone') {
        if (lastType === null) {
          lastType = this.grid[row][checkCol].type;
          consecutiveCount = 1;
        } else if (this.grid[row][checkCol].type === lastType) {
          consecutiveCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Якщо є 2+ однакових підряд горизонтально, уникаємо цього кольору
    if (consecutiveCount >= 2 && lastType) {
      avoidTypes.add(lastType);
    }

    // Перевіряємо вертикальну послідовність зверху
    consecutiveCount = 0;
    lastType = null;
    for (let checkRow = row - 1; checkRow >= 0; checkRow--) {
      if (this.grid[checkRow][col] && this.grid[checkRow][col].type !== 'stone') {
        if (lastType === null) {
          lastType = this.grid[checkRow][col].type;
          consecutiveCount = 1;
        } else if (this.grid[checkRow][col].type === lastType) {
          consecutiveCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Якщо є 2+ однакових підряд вертикально, уникаємо цього кольору
    if (consecutiveCount >= 2 && lastType) {
      avoidTypes.add(lastType);
    }

    // Вибираємо з доступних кольорів, уникаючи проблемних
    const availableTypes = colorTypes.filter(type => !avoidTypes.has(type));

    if (availableTypes.length > 0) {
      return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    // Якщо всі кольори заборонені (рідкісний випадок), повертаємо випадковий
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

  // === НОВА ЛОГІКА РОЗУМНОЇ ГЕНЕРАЦІЇ ===
  generateSmartStartingBubbles() {
    // Генеруємо тільки 2-3 ряди для вищого розташування і більш рассіяного поля
    const startingRows = Math.max(2, this.rows - this.allowedBottomRows - 4);

    // Використовуємо ту ж збалансовану логіку
    this.createBalancedStructure(startingRows);
    this.fillEmptyAreas(startingRows);

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
      .filter(({ r, c }) => this.grid[r] && this.grid[r][c] && this.grid[r][c].type !== 'stone')
      .map(({ r, c }) => this.grid[r][c].type);
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
      .filter(({ r, c }) => this.grid[r] && this.grid[r][c] && this.grid[r][c].type !== 'stone')
      .map(({ r, c }) => this.grid[r][c].type);
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
      { r: row - 1, c: isEvenRow ? col - 1 : col },
      { r: row - 1, c: isEvenRow ? col : col + 1 },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
      { r: row + 1, c: isEvenRow ? col - 1 : col },
      { r: row + 1, c: isEvenRow ? col : col + 1 }
    ].filter(({ r, c }) => r >= 0 && r < this.rows && c >= 0 && c < this.cols);
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
      this.updateActiveBubblesCache(0, col, this.grid[0][col]);
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
    this.updateActiveBubblesCache(0, centerCol, this.grid[0][centerCol]);

    // Бокові кульки
    if (centerCol > 0) {
      this.grid[0][centerCol - 1] = {
        type: pyramidColor,
        row: 0,
        col: centerCol - 1
      };
      this.updateActiveBubblesCache(0, centerCol - 1, this.grid[0][centerCol - 1]);
    }
    if (centerCol < this.cols - 1) {
      this.grid[0][centerCol + 1] = {
        type: pyramidColor,
        row: 0,
        col: centerCol + 1
      };
      this.updateActiveBubblesCache(0, centerCol + 1, this.grid[0][centerCol + 1]);
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
      this.updateActiveBubblesCache(0, col, this.grid[0][col]);
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
        this.updateActiveBubblesCache(0, col, this.grid[0][col]);
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
      this.updateActiveBubblesCache(0, col, this.grid[0][col]);
    }
  }

  // Отримати кольори частинок на основі типу кульки (основний + відтінки)
  getBubbleParticleColors(bubbleType) {
    const colorMap = {
      'blue': {
        primary: '#4A90E2',    // Основний синій
        variants: ['#5DADE2', '#3498DB', '#2E86C1'] // Відтінки синього
      },
      'red': {
        primary: '#E74C3C',    // Основний червоний
        variants: ['#EC7063', '#E55039', '#C0392B'] // Відтінки червоного
      },
      'yellow': {
        primary: '#F1C40F',    // Основний жовтий
        variants: ['#F4D03F', '#F7DC6F', '#D4AC0D'] // Відтінки жовтого
      },
      'kyan': {
        primary: '#1ABC9C',    // Основний бірюзовий
        variants: ['#48C9B0', '#17A2B8', '#138D75'] // Відтінки бірюзового
      },
      'heart': {
        primary: '#E91E63',    // Основний рожевий
        variants: ['#F06292', '#AD1457', '#C2185B'] // Відтінки рожевого
      },
      'stone': {
        primary: '#7F8C8D',    // Основний сірий
        variants: ['#95A5A6', '#BDC3C7', '#566573'] // Відтінки сірого
      }
    };
    
    const colors = colorMap[bubbleType] || {
      primary: '#FFD700',
      variants: ['#FFC107', '#FF9800', '#F57C00']
    };
    
    return colors;
  }

  // Отримати випадковий колір частинки для типу кульки
  getBubbleParticleColor(bubbleType) {
    const colors = this.getBubbleParticleColors(bubbleType);
    const allColors = [colors.primary, ...colors.variants];
    return allColors[Math.floor(Math.random() * allColors.length)];
  }

  createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5; // Додаємо випадковість до кута
      const speed = 2 + Math.random() * 3; // Збільшуємо варіативність швидкості
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10, // Додаємо випадковість до початкової позиції
        y: y + (Math.random() - 0.5) * 10,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 4, // Більша варіативність розміру
        life: 0.8 + Math.random() * 0.4, // Варіативність тривалості життя
        decay: 0.015 + Math.random() * 0.025 // Варіативність швидкості зникання
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
      moving: false,
      timeAlive: 0 // Додаємо лічильник часу життя кулі
    };
    // Ініціалізуємо кут прицілювання прямо вгору
    this.shootingAngle = Math.PI / 2; // 90 градусів (вгору)

    // ⏱️ ЗАПУСКАЄМО ТАЙМЕР ХОДУ для безкінечного режиму
    // Тільки якщо гра дійсно почалася (є gameStartTime)
    if (this.gameMode === 'endless' && !this.isPaused && !this.isGameOver && this.gameStartTime) {
      this.startMoveTimer();
    }
  }

  aim(e) {
    // Додаємо перевірку на існування shootingBubble
    if (!this.shootingBubble || this.shootingBubble.moving) return;
    
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
    if (!this.shootingBubble || this.shootingBubble.moving || this.isPaused || this.isGameOver) return;

    this.playSound('shoot');

    // ⏹️ ЗУПИНЯЄМО ТАЙМЕР ХОДУ (гравець зробив постріл)
    if (this.gameMode === 'endless') {
      this.stopMoveTimer();
    }

    // Оновлюємо лічильники
    this.shotsCount++;
    this.updateDifficulty();

    const speed = 850; // Збільшуємо швидкість з 780 до 850 для кращого відчуття
    this.shootingBubble.dx = Math.cos(this.shootingAngle) * speed;
    this.shootingBubble.dy = -Math.sin(this.shootingAngle) * speed; // Negative for upward movement
    this.shootingBubble.moving = true;

    console.log('Shooting bubble:', {
      angle: this.shootingAngle,
      dx: this.shootingBubble.dx,
      dy: this.shootingBubble.dy,
      position: { x: this.shootingBubble.x, y: this.shootingBubble.y }
    });
  }

  startGame() {
    this.isPaused = false;
    this.score = 0;
    this.isGameOver = false;
    this.scoreSubmitted = false; // Скидаємо флаг збереження результату при новій грі
    this.lastTime = null; // Змінено з 0 на null
    if (this.gameMode === 'timed') {
      this.timeLeft = 60;
      this.dropTimer = 10;
      this.updateTimer();
    }
    // 🔥 ПОКРАЩЕНА СИСТЕМА СКЛАДНОСТІ ДЛЯ ENDLESS РЕЖИМУ
    if (this.gameMode === 'endless') {
      this.difficultyMultiplier = 1;
      this.dropSpeed = 12; // Початкова швидкість опускання (секунди)
      this.specialBubbleChance = 0.05; // 5% шанс спеціальних куль
      this.difficultyLevel = 1;
      this.gameStartTime = Date.now();

      // ⏱️ СИСТЕМА ОБМЕЖЕННЯ ЧАСУ НА ХІД
      this.moveTimeLimit = 3.0; // Початковий ліміт часу на хід (секунди)
      this.moveStartTime = null; // Час початку ходу
      this.moveTimeRemaining = this.moveTimeLimit;
      this.isMoveActive = false;
      this.moveTimePhase = 1; // Фаза часових обмежень (1, 2, 3)

      // Очищуємо старі таймери
      if (this.difficultyInterval) clearInterval(this.difficultyInterval);
      if (this.threatRowTimer) clearInterval(this.threatRowTimer);
      if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
      if (this.specialEventTimer) clearInterval(this.specialEventTimer);
      if (this.moveTimerInterval) clearInterval(this.moveTimerInterval);

      // 📈 ПРОГРЕСИВНЕ ПІДВИЩЕННЯ СКЛАДНОСТІ (кожні 20 секунд)
      this.difficultyInterval = setInterval(() => {
        // Перевіряємо чи гра не на паузі та не закінчена
        if (this.isPaused || this.isGameOver) return;
        
        this.difficultyLevel++;
        this.difficultyMultiplier = Math.min(this.difficultyMultiplier * 1.4, 8);
        this.dropSpeed = Math.max(this.dropSpeed * 0.9, 4); // Швидше опускання
        this.specialBubbleChance = Math.min(this.specialBubbleChance + 0.03, 0.3); // Більше спеціальних куль

        console.log(`🔥 DIFFICULTY UP! Level ${this.difficultyLevel}: Speed=${this.dropSpeed.toFixed(1)}s, Special=${(this.specialBubbleChance * 100).toFixed(0)}%`);
        this.showDifficultyNotification();

        // Оновлюємо швидкість опускання
        if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
        this.dropSpeedTimer = setInterval(() => {
          if (!this.isPaused && !this.isGameOver) {
            this.dropBubblesOneRow();
          }
        }, this.dropSpeed * 1000);

      }, 20000);

      // 🪨 ЗАГРОЗЛИВІ РЯДИ (частіше з часом)
      this.threatRowTimer = setInterval(() => {
        // Перевіряємо чи гра не на паузі та не закінчена
        if (this.isPaused || this.isGameOver) return;
        
        const threatChance = 0.2 + (this.difficultyLevel * 0.05);
        if (Math.random() < threatChance) {
          this.generateAdvancedThreatPattern();
          console.log(`🪨 ADVANCED THREAT generated at level ${this.difficultyLevel}`);
        }
      }, Math.max(30000 - (this.difficultyLevel * 1500), 10000));

      // ⚡ ПОЧАТКОВЕ ОПУСКАННЯ
      this.dropSpeedTimer = setInterval(() => {
        if (!this.isPaused && !this.isGameOver) {
          this.dropBubblesOneRow();
        }
      }, this.dropSpeed * 1000);

      // 🎯 СПЕЦІАЛЬНІ ПОДІЇ (кожні 45 секунд)
      this.specialEventTimer = setInterval(() => {
        // Перевіряємо чи гра не на паузі та не закінчена
        if (this.isPaused || this.isGameOver) return;
        
        this.triggerSpecialEvent();
      }, 45000);

      // ⏱️ ЗАПУСКАЄМО ТАЙМЕР ХОДУ (тільки для endless режиму)
      this.startMoveTimer();
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
    let deltaTime = (currentTime - this.lastTime) / 1000; // Змінено const на let
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
      // Перевіряємо deltaTime на коректність
      if (isNaN(deltaTime) || deltaTime < 0 || deltaTime > 1) {
        console.warn('⚠️ Invalid deltaTime detected:', deltaTime);
        deltaTime = 1/60; // Тепер це працюватиме правильно
      }
      
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

    // ВИДАЛЕНО: Логіка explodingBubbles більше не потрібна

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
      // Додаткова перевірка на NaN та некоректні значення
      if (isNaN(this.timeLeft) || this.timeLeft === undefined || this.timeLeft === null) {
        console.warn('⚠️ timeLeft is NaN or invalid, resetting to 0');
        this.timeLeft = 0;
      }
      
      const seconds = Math.max(0, Math.ceil(this.timeLeft));
      this.timerEl.textContent = `Time: ${seconds}s`;
    }
  }

  drawGrid() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          const { x, y } = this.gridToPixel(row, col);
          this.drawBubble(x, y, bubble.type);
        }
      }
    }
  }

  drawBubble(x, y, type) {
    this.ctx.save();

    // Кольори для кульок
    const colors = {
      'blue': '#4A90E2',
      'red': '#E74C3C',
      'yellow': '#F1C40F',
      'kyan': '#1ABC9C',
      'heart': '#FF69B4'
    };

    // Тінь для кульки
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 2;

    // Основна кулька
    const color = colors[type] || '#999999';
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
    this.ctx.fill();

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

    // Спрайт всередині кульки (якщо є)
    if (this.bubbleImages[type]) {
      // Зберігаємо стан без тіні для спрайту
      this.ctx.shadowColor = 'transparent';

      // Налаштування для максимальної якості спрайтів
      this.ctx.imageSmoothingEnabled = false; // Чітке відображення

      // Розмір спрайту - зменшений для кращого вигляду
      const spriteSize = Math.round(this.bubbleRadius * 1.2); // Зменшуємо до 26.4, округлюємо до 26
      const spritePosX = Math.round(x - spriteSize / 2);
      const spritePosY = Math.round(y - spriteSize / 2);

      this.ctx.drawImage(
        this.bubbleImages[type],
        spritePosX,
        spritePosY,
        spriteSize,
        spriteSize
      );
    }

    this.ctx.restore();
  }



  gridToPixel(row, col) {
    const evenRow = row % 2 === 0;
    const bubbleSpacing = this.bubbleRadius * 2.1; // Збільшуємо простір між кульками
    const x = this.sidePadding + (evenRow ? 0 : this.bubbleRadius) + col * bubbleSpacing;
    const y = row * this.bubbleRadius * 2.0 + this.bubbleRadius + 20; // Збільшуємо вертикальний простір
    return { x, y };
  }

  pixelToGrid(x, y) {
    const bubbleSpacing = this.bubbleRadius * 2.1;
    const row = Math.floor((y - this.bubbleRadius - 20) / (this.bubbleRadius * 2.0)); // Оновлюємо відповідно
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
    if (!this.shootingBubble || !this.shootingBubble.moving) return;

    // Оновлюємо час життя кулі
    this.shootingBubble.timeAlive += deltaTime;

    // Якщо куля летить занадто довго (5 секунд), знищуємо її
    if (this.shootingBubble.timeAlive > 5) {
      console.log(`⏰ ТАЙМАУТ: Куля летить занадто довго (${this.shootingBubble.timeAlive.toFixed(1)}с), знищуємо`);
      this.shootingBubble = null;
      this.spawnShootingBubble();
      return;
    }

    const prevX = this.shootingBubble.x;
    const prevY = this.shootingBubble.y;

    // Рухаємо кулю
    this.shootingBubble.x += this.shootingBubble.dx * deltaTime;
    this.shootingBubble.y += this.shootingBubble.dy * deltaTime;

    console.log(`🎯 Куля рухається: x=${this.shootingBubble.x.toFixed(1)}, y=${this.shootingBubble.y.toFixed(1)}, canvas=${this.canvas.width}x${this.canvas.height}`);

    // Перевіряємо межі по горизонталі (відбиття від стін)
    if (this.shootingBubble.x <= this.bubbleRadius) {
      console.log(`🏀 ВІДБИТТЯ від лівої стіни на x=${this.shootingBubble.x}`);
      this.shootingBubble.x = this.bubbleRadius + 2; // Додаємо невеликий зсув від стіни
      this.shootingBubble.dx = Math.abs(this.shootingBubble.dx); // Забезпечуємо рух вправо
    } else if (this.shootingBubble.x >= this.canvas.width - this.bubbleRadius) {
      console.log(`🏀 ВІДБИТТЯ від правої стіни на x=${this.shootingBubble.x}`);
      this.shootingBubble.x = this.canvas.width - this.bubbleRadius - 2; // Додаємо невеликий зсув від стіни
      this.shootingBubble.dx = -Math.abs(this.shootingBubble.dx); // Забезпечуємо рух вліво
    }

    // Перевіряємо верхню межу
    if (this.shootingBubble.y <= this.bubbleRadius) {
      console.log(`🏀 ВЛУЧЕННЯ в верхню стіну на y=${this.shootingBubble.y}`);
      const attachRow = 0;
      let attachCol = Math.round((this.shootingBubble.x - this.getRowOffsetX(attachRow)) / (this.bubbleRadius * 2));

      // Перевіряємо межі колонки
      const maxCol = attachRow % 2 === 0 ? this.cols - 1 : this.cols - 2;
      attachCol = Math.max(0, Math.min(attachCol, maxCol));

      console.log(`📍 Розміщення в верхньому ряду: col=${attachCol} (межі: 0-${maxCol})`);
      this.attachBubbleToGrid(attachRow, attachCol);
      return;
    }

    // Перевіряємо нижню межу (куля зникає)
    if (this.shootingBubble.y >= this.canvas.height) {
      console.log(`❌ КУЛЯ ВИЛЕТІЛА ЗА МЕЖІ на y=${this.shootingBubble.y} (висота canvas=${this.canvas.height})`);
      this.shootingBubble = null;
      return;
    }

    // OPTIMIZED: Use new collision detection system
    const collision = this.checkCollisionOptimized(this.shootingBubble.x, this.shootingBubble.y, prevX, prevY);
    if (collision) {
      console.log(`💥 КОЛІЗІЯ ЗНАЙДЕНА з кулею на позиції (${collision.row}, ${collision.col}) типу ${collision.type}`);

      // Знаходимо всі сусідні клітинки навколо точки зіткнення
      const neighbors = this.getAttachmentNeighbors(collision.row, collision.col);

      console.log(`🔍 Знайдено ${neighbors.length} потенційних позицій для розміщення`);

      // Знаходимо найкращу позицію для прикріплення
      let bestPos = null;
      let minDistance = Infinity;

      for (const neighbor of neighbors) {
        if (neighbor.row >= 0 && neighbor.row < this.rows &&
          neighbor.col >= 0 && neighbor.col < this.cols &&
          !this.grid[neighbor.row][neighbor.col]) {

          const pos = this.getBubblePosition(neighbor.row, neighbor.col);
          const distance = Math.sqrt(
            Math.pow(this.shootingBubble.x - pos.x, 2) +
            Math.pow(this.shootingBubble.y - pos.y, 2)
          );

          console.log(`  Позиція (${neighbor.row},${neighbor.col}): відстань=${distance.toFixed(1)}`);

          if (distance < minDistance) {
            minDistance = distance;
            bestPos = neighbor;
          }
        }
      }
      if (bestPos) {
        console.log(`📍 ЗНАЙДЕНА ПОЗІЦІЯ для розміщення кулі: (${bestPos.row}, ${bestPos.col})`);
        this.attachBubbleToGrid(bestPos.row, bestPos.col);
        return;
      } else {
        console.log(`❌ НЕ ЗНАЙДЕНА позіція для розміщення - куля зникає`);
        this.shootingBubble = null;
        return;
      }
    }
  }

  attachBubbleToGrid(hitRow, hitCol) {
    console.log(`🚀 ФУНКЦІЯ attachBubbleToGrid ВИКЛИКАНА з параметрами (${hitRow}, ${hitCol})`);

    // Додаткова перевірка валідності shootingBubble
    if (!this.shootingBubble) {
      console.log(`❌ ПОМИЛКА: shootingBubble не існує!`);
      return;
    }

    if (hitRow >= 0 && hitRow < this.rows && hitCol >= 0 && hitCol < this.cols) {
      if (hitRow >= this.rows - this.allowedBottomRows) {
        console.log(`💀 GAME OVER: куля досягла забороненої зони (ряд ${hitRow})`);
        this.shootingBubble = null;
        this.gameOver();
        return;
      }

      // Перевіряємо що позиція вільна, якщо ні - шукаємо альтернативну
      if (this.grid[hitRow][hitCol]) {
        console.log(`❌ ПОЗИЦІЯ ЗАЙНЯТА: (${hitRow},${hitCol}) зайнята кулею типу ${this.grid[hitRow][hitCol].type}`);

        // Шукаємо альтернативну позицію поруч
        const alternativePos = this.findAlternativePosition(hitRow, hitCol);
        if (alternativePos) {
          console.log(`✅ ЗНАЙДЕНА АЛЬТЕРНАТИВА: використовуємо позицію (${alternativePos.row},${alternativePos.col})`);
          hitRow = alternativePos.row;
          hitCol = alternativePos.col;
        } else {
          console.log(`❌ АЛЬТЕРНАТИВА НЕ ЗНАЙДЕНА: створюємо нову кулю`);
          this.shootingBubble = null;
          this.spawnShootingBubble();
          return;
        }
      }

      // Розміщуємо кулю в grid
      this.grid[hitRow][hitCol] = {
        type: this.shootingBubble.type,
        row: hitRow,
        col: hitCol
      };
      this.updateActiveBubblesCache(hitRow, hitCol, this.grid[hitRow][hitCol]);

      console.log(`🎯 ВЛУЧЕННЯ: Розміщена куля типу ${this.shootingBubble.type} на позиції (${hitRow},${hitCol})`);

      // ПРОФЕСІЙНИЙ BFS АЛГОРИТМ - знаходимо групу одного кольору (≥3)
      const connectedGroup = this.findConnectedGroup(hitRow, hitCol);

      console.log(`🔍 ПОШУК ГРУПИ: Знайдено ${connectedGroup.length} куль типу ${this.shootingBubble.type}`);
      if (connectedGroup.length > 0) {
        console.log(`📝 ДЕТАЛІ ГРУПИ: Позиції куль одного кольору:`);
        connectedGroup.forEach((pos, index) => {
          const bubble = this.grid[pos.row][pos.col];
          console.log(`  ${index + 1}. (${pos.row},${pos.col}) - тип: ${bubble ? bubble.type : 'NULL'}`);
        });
      }

      if (connectedGroup.length >= 3) {
        this.playSound('pop');
        this.score += connectedGroup.length * 10;
        this.updateScore();

        console.log(`💥 ЗНИЩЕННЯ ГРУПИ: Видаляємо ТІЛЬКИ ${connectedGroup.length} куль типу ${this.shootingBubble.type}`);

        // МИТТЄВО видаляємо ТІЛЬКИ групу одного кольору з grid
        connectedGroup.forEach(pos => {
          const bubble = this.grid[pos.row][pos.col];
          if (bubble && bubble.type === this.shootingBubble.type) {
            console.log(`  ❌ Видаляємо кулю типу ${bubble.type} на (${pos.row},${pos.col})`);
            this.grid[pos.row][pos.col] = null;
            this.updateActiveBubblesCache(pos.row, pos.col, null);
          } else {
            console.log(`  ⚠️ ПРОПУСКАЄМО кулю іншого типу на (${pos.row},${pos.col}): ${bubble ? bubble.type : 'NULL'}`);
          }
        });

        console.log(`✅ ЗНИЩЕННЯ ЗАВЕРШЕНО: Видалено тільки кулі типу ${this.shootingBubble.type}`);
        console.log(`🚫 ПЛАВАЮЧІ КУЛІ НЕ ВИДАЛЯЮТЬСЯ: Залишаємо всі інші кулі на місці`);

        // Створюємо візуальні ефекти тільки для знищених куль одного кольору
        this.createExplosionEffects(connectedGroup, this.shootingBubble.type);

        this.consecutiveHits++;
        this.updateDifficulty();
      } else {
        console.log(`❌ ГРУПА ЗАМАЛА: Група з ${connectedGroup.length} куль недостатня для знищення (потрібно ≥3)`);
        this.consecutiveHits = 0;
      }

      this.updateColorDistribution();
      this.shootingBubble = null;
      this.spawnShootingBubble();
    }
  }

  // ПРОФЕСІЙНИЙ BFS АЛГОРИТМ для пошуку груп одного кольору
  // Базується на алгоритмах з rembound.com та GitHub проектів
  findConnectedGroup(row, col) {
    const bubble = this.grid[row][col];
    if (!bubble || bubble.type === 'stone') return [];

    const targetType = bubble.type;
    const toProcess = [{ row, col }];
    const processed = new Set();
    const foundCluster = [];

    // Позначаємо початкову кулю як оброблену
    processed.add(`${row},${col}`);

    while (toProcess.length > 0) {
      const currentTile = toProcess.shift(); // Використовуємо shift() для правильного BFS
      const { row: currentRow, col: currentCol } = currentTile;

      // Перевіряємо межі
      if (currentRow < 0 || currentRow >= this.rows || currentCol < 0 || currentCol >= this.cols) {
        continue;
      }

      const currentBubble = this.grid[currentRow][currentCol];

      // Пропускаємо пусті кулі
      if (!currentBubble || currentBubble.type === null) {
        continue;
      }

      // Перевіряємо, чи має куля ТОЧНО ТАКИЙ САМИЙ тип
      if (currentBubble.type === targetType) {
        // Додаємо кулю до кластера
        foundCluster.push({ row: currentRow, col: currentCol });

        // Отримуємо сусідів поточної кулі
        const neighbors = this.getNeighbors(currentRow, currentCol);

        // Перевіряємо кожного сусіда
        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.r},${neighbor.c}`;
          if (!processed.has(neighborKey)) {
            // Додаємо сусіда до черги обробки
            toProcess.push({ row: neighbor.r, col: neighbor.c });
            processed.add(neighborKey);
          }
        }
      }
    }

    return foundCluster;
  }

  // ВИПРАВЛЕНИЙ АЛГОРИТМ для пошуку плаваючих куль з детальним логуванням
  findFloatingBubbles() {
    console.log(`🔍 СТАРТ ПОШУКУ ПЛАВАЮЧИХ: Аналізуємо поточний стан grid`);

    // Спочатку виводимо поточний стан grid для діагностики
    console.log(`📊 ПОТОЧНИЙ СТАН GRID:`);
    for (let row = 0; row < this.rows; row++) {
      let rowStr = `  Ряд ${row}: `;
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        rowStr += bubble ? `${bubble.type}(${row},${col}) ` : `EMPTY(${row},${col}) `;
      }
      console.log(rowStr);
    }

    // Крок 1: Знаходимо всі кулі, що прикріплені до верху
    const attachedToTop = new Set();
    const toProcess = [];

    // Додаємо всі кулі з верхнього ряду як початкові точки
    console.log(`🔍 КРОК 1: Шукаємо початкові точки в верхньому ряду`);
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[0][col]) {
        const key = `0,${col}`;
        attachedToTop.add(key);
        toProcess.push({ row: 0, col: col });
        console.log(`  ⚓ Початкова точка: (0,${col}) типу ${this.grid[0][col].type}`);
      }
    }

    if (toProcess.length === 0) {
      console.log(`❌ ПОМИЛКА: Немає куль у верхньому ряду! Всі кулі будуть вважатися плаваючими`);
    }

    // BFS для знаходження всіх куль, з'єднаних з верхом
    console.log(`🔍 КРОК 2: BFS пошук всіх прикріплених куль`);
    while (toProcess.length > 0) {
      const current = toProcess.shift();
      const neighbors = this.getNeighbors(current.row, current.col);

      console.log(`    🔍 Перевіряємо сусідів кулі (${current.row},${current.col})`);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.r},${neighbor.c}`;

        // Перевіряємо чи сусід існує і ще не оброблений
        if (neighbor.r >= 0 && neighbor.r < this.rows &&
          neighbor.c >= 0 && neighbor.c < this.cols &&
          this.grid[neighbor.r][neighbor.c] &&
          !attachedToTop.has(neighborKey)) {

          attachedToTop.add(neighborKey);
          toProcess.push({ row: neighbor.r, col: neighbor.c });
          console.log(`      ⚓ Додано прикріплену кулю: (${neighbor.r},${neighbor.c}) типу ${this.grid[neighbor.r][neighbor.c].type}`);
        } else if (neighbor.r >= 0 && neighbor.r < this.rows && neighbor.c >= 0 && neighbor.c < this.cols) {
          if (!this.grid[neighbor.r][neighbor.c]) {
            console.log(`      ⭕ Сусід (${neighbor.r},${neighbor.c}) порожній`);
          } else if (attachedToTop.has(neighborKey)) {
            console.log(`      ✅ Сусід (${neighbor.r},${neighbor.c}) вже оброблений`);
          }
        }
      }
    }

    // Крок 3: Всі кулі, що не прикріплені до верху, є плаваючими
    console.log(`🔍 КРОК 3: Визначаємо плаваючі кулі`);
    const floatingBubbles = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const key = `${row},${col}`;

        if (this.grid[row][col] && !attachedToTop.has(key)) {
          floatingBubbles.push({ row, col });
          console.log(`  🎈 ПЛАВАЮЧА КУЛЯ: (${row},${col}) типу ${this.grid[row][col].type}`);

          // Додаткова діагностика - чому ця куля плаваюча?
          console.log(`    🔍 ДІАГНОСТИКА: Чому куля (${row},${col}) плаваюча?`);
          const neighbors = this.getNeighbors(row, col);
          let hasAttachedNeighbor = false;
          for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.r},${neighbor.c}`;
            if (neighbor.r >= 0 && neighbor.r < this.rows && neighbor.c >= 0 && neighbor.c < this.cols) {
              if (this.grid[neighbor.r][neighbor.c] && attachedToTop.has(neighborKey)) {
                hasAttachedNeighbor = true;
                console.log(`      ⚓ Має прикріпленого сусіда: (${neighbor.r},${neighbor.c}) типу ${this.grid[neighbor.r][neighbor.c].type}`);
              }
            }
          }
          if (!hasAttachedNeighbor) {
            console.log(`      ❌ НЕ МАЄ прикріплених сусідів - справді плаваюча`);
          } else {
            console.log(`      ⚠️ УВАГА: Має прикріплених сусідів, але все одно вважається плаваючою!`);
          }
        }
      }
    }

    console.log(`🎈 РЕЗУЛЬТАТ: Знайдено ${floatingBubbles.length} плаваючих куль (з ${attachedToTop.size} прикріплених)`);
    return floatingBubbles;
  }



  // ПРОСТА ФУНКЦІЯ для візуальних ефектів
  createExplosionEffects(positions, bubbleType) {
    // Створюємо частинки для кожної видаленої кулі
    positions.forEach(pos => {
      const { x, y } = this.gridToPixel(pos.row, pos.col);
      
      // Створюємо кілька хвиль частинок з різними кольорами
      for (let wave = 0; wave < 2; wave++) {
        setTimeout(() => {
          const particleColor = this.getBubbleParticleColor(bubbleType);
          const particleCount = wave === 0 ? 8 : 4; // Перша хвиля більша
          this.createParticles(x, y, particleColor, particleCount);
        }, wave * 100); // Затримка між хвилями
      }
    });
  }







  gameOver() {
    this.isGameOver = true;
    this.playSound('game-over');
    this.shootingBubble = null;

    // Очищуємо всі таймери
    if (this.difficultyInterval) clearInterval(this.difficultyInterval);
    if (this.threatRowTimer) clearInterval(this.threatRowTimer);
    if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
    if (this.specialEventTimer) clearInterval(this.specialEventTimer);
    if (this.moveTimerInterval) clearInterval(this.moveTimerInterval);

    // Зупиняємо таймер ходу та приховуємо UI
    this.stopMoveTimer();

    // Зберігаємо результат в лідерборд з інформацією про режим тільки якщо ще не збережено
    if (!this.scoreSubmitted) {
      console.log(`🏆 GAME OVER: Зберігаємо результат - Score: ${this.score}, Mode: ${this.gameMode}`);
      this.scoreSubmitted = true; // Встановлюємо флаг що результат збережено

      if (typeof window.saveToLeaderboard === 'function') {
        console.log(`✅ Функція saveToLeaderboard знайдена, викликаємо...`);
        window.saveToLeaderboard(this.score, this.gameMode);
        console.log(`✅ Результат збережено в лідерборд`);
      } else {
        console.error(`❌ Функція saveToLeaderboard не знайдена!`);
      }
    } else {
      console.log(`⚠️ Результат вже був збережений раніше, пропускаємо збереження`);
    }

    // Анімація появи меню game over
    this.gameOverMenu.classList.remove('hidden');
    this.gameOverMenu.style.animation = 'bounceIn 0.8s ease-out';
    this.gameOverMenu.querySelector('#final-score').textContent = this.score;
  }

  pauseGame() {
    this.isPaused = true;
    this.pauseMenu.classList.remove('hidden');

    // Зупиняємо таймер ходу при паузі
    if (this.gameMode === 'endless') {
      this.stopMoveTimer();
    }
  }

  resumeGame() {
    this.isPaused = false;
    this.pauseMenu.classList.add('hidden');

    // 🔧 ВИПРАВЛЕННЯ: Скидаємо lastTime щоб уникнути великого deltaTime
    this.lastTime = null; // Змінено з 0 на null

    // Відновлюємо таймер ходу для безкінечного режиму
    if (this.gameMode === 'endless' && this.shootingBubble && !this.shootingBubble.moving && !this.isGameOver) {
      this.startMoveTimer();
    }

    this.loop();
  }

  exitGame() {
    // Якщо гра була розпочата і є очки, показуємо діалог підтвердження
    if (this.score > 0 && !this.isGameOver) {
      console.log(`🚪 EXIT GAME: Показуємо діалог збереження - Score: ${this.score}, Mode: ${this.gameMode}`);
      
      // Зберігаємо поточний стан гри для можливості повернення
      this.gameStateBeforeExit = {
        isPaused: this.isPaused,
        score: this.score,
        gameMode: this.gameMode
      };
      
      if (typeof window.showExitConfirmationDialog === 'function') {
        window.showExitConfirmationDialog(this.score, this.gameMode);
        return; // Не виходимо одразу, чекаємо рішення користувача
      } else {
        console.error(`❌ Функція showExitConfirmationDialog не знайдена!`);
        // Fallback до старої логіки
        if (typeof window.saveToLeaderboard === 'function') {
          window.saveToLeaderboard(this.score, this.gameMode);
          return;
        }
      }
    } else if (this.score === 0) {
      console.log(`🚪 EXIT GAME: Результат не зберігається - гра не була розпочата (score = 0)`);
    } else if (this.isGameOver) {
      console.log(`🚪 EXIT GAME: Результат вже збережено при game over`);
    }

    // Виконуємо фактичний вихід з гри
    this.performActualExit();
  }
  
  // Метод для фактичного виходу з гри
  performActualExit() {
    // Очищуємо збережений стан гри
    this.gameStateBeforeExit = null;
    
    // Очищуємо всі таймери
    if (this.difficultyInterval) clearInterval(this.difficultyInterval);
    if (this.threatRowTimer) clearInterval(this.threatRowTimer);
    if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
    if (this.specialEventTimer) clearInterval(this.specialEventTimer);
    if (this.moveTimerInterval) clearInterval(this.moveTimerInterval);

    // Зупиняємо таймер ходу та приховуємо UI
    this.stopMoveTimer();

    // Встановлюємо правильний фон перед поверненням в меню
    if (typeof window.setGlobalBackground === 'function') window.setGlobalBackground();
    if (typeof window.showMainMenu === 'function') window.showMainMenu();
  }
  
  // Метод для повернення до гри (викликається при скасуванні виходу)
  resumeFromExitDialog() {
    console.log('🔄 resumeFromExitDialog called');
    
    // Показуємо canvas гри
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
    
    // Показуємо контейнер гри
    if (this.container) {
      this.container.style.display = 'block';
    }
    
    if (this.gameStateBeforeExit) {
      console.log('🔄 Restoring game state:', this.gameStateBeforeExit);
      this.isPaused = this.gameStateBeforeExit.isPaused;
      
      // Якщо гра не була на паузі, продовжуємо гру
      if (!this.isPaused) {
        this.resumeGame();
      } else {
        // Якщо гра була на паузі, просто ховаємо меню паузи
        this.pauseMenu.classList.add('hidden');
        this.isPaused = false;
      }
      
      // НЕ очищуємо gameStateBeforeExit тут, щоб Cancel працював кілька разів
      console.log('🔄 Game resumed from exit dialog');
    } else {
      console.log('⚠️ No game state to restore, just resuming');
      // Якщо немає збереженого стану, просто продовжуємо гру
      this.isPaused = false;
      if (this.pauseMenu) {
        this.pauseMenu.classList.add('hidden');
      }
    }
    
    // Перезапускаємо ігровий цикл якщо він зупинився
    if (!this.isGameOver) {
      requestAnimationFrame((time) => this.loop(time));
    }
  }

  // 🔥 ПОКАЗ ПОВІДОМЛЕННЯ ПРО ПІДВИЩЕННЯ СКЛАДНОСТІ
  showDifficultyNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 1.1rem;
      box-shadow: 0 8px 24px rgba(255,107,107,0.4);
      z-index: 1000;
      animation: slideInRight 0.5s ease-out;
      border: 2px solid rgba(255,255,255,0.3);
    `;
    notification.innerHTML = `🔥 Difficulty Level ${this.difficultyLevel}!<br><small>Speed increased!</small>`;

    document.body.appendChild(notification);

    // Видаляємо через 3 секунди
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }
    }, 3000);
  }

  // ⚡ СПЕЦІАЛЬНІ ПОДІЇ ДЛЯ ENDLESS РЕЖИМУ
  triggerSpecialEvent() {
    const events = ['colorFlood', 'bubbleRain', 'speedBoost', 'stoneWave'];
    const event = events[Math.floor(Math.random() * events.length)];

    console.log(`⚡ SPECIAL EVENT: ${event} triggered at level ${this.difficultyLevel}`);

    switch (event) {
      case 'colorFlood':
        this.colorFloodEvent();
        break;
      case 'bubbleRain':
        this.bubbleRainEvent();
        break;
      case 'speedBoost':
        this.speedBoostEvent();
        break;
      case 'stoneWave':
        this.stoneWaveEvent();
        break;
    }
  }

  // 🌊 ПОДІЯ: Заповнення одним кольором
  colorFloodEvent() {
    const floodColor = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    let bubblesAdded = 0;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col] && Math.random() < 0.6) {
          this.grid[row][col] = {
            type: floodColor,
            row: row,
            col: col
          };
          bubblesAdded++;
        }
      }
    }

    this.showEventNotification(`🌊 Color Flood!`, `${bubblesAdded} ${floodColor} bubbles added`);
    this.rebuildActiveBubblesCache();
  }

  // 🌧️ ПОДІЯ: Дощ з кульок
  bubbleRainEvent() {
    let bubblesAdded = 0;

    for (let col = 0; col < this.cols; col++) {
      if (Math.random() < 0.7) {
        // Знаходимо найвищу вільну позицію в колонці
        for (let row = 0; row < this.rows; row++) {
          if (!this.grid[row][col]) {
            this.grid[row][col] = {
              type: this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)],
              row: row,
              col: col
            };
            bubblesAdded++;
            break;
          }
        }
      }
    }

    this.showEventNotification(`🌧️ Bubble Rain!`, `${bubblesAdded} random bubbles dropped`);
    this.rebuildActiveBubblesCache();
  }

  // ⚡ ПОДІЯ: Прискорення
  speedBoostEvent() {
    const originalSpeed = this.dropSpeed;
    this.dropSpeed = Math.max(this.dropSpeed * 0.5, 2); // Подвоюємо швидкість

    this.showEventNotification(`⚡ Speed Boost!`, `Drop speed doubled for 15 seconds`);

    // Оновлюємо таймер
    if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
    this.dropSpeedTimer = setInterval(() => {
      this.dropBubblesOneRow();
    }, this.dropSpeed * 1000);

    // Повертаємо нормальну швидкість через 15 секунд
    setTimeout(() => {
      this.dropSpeed = originalSpeed;
      if (this.dropSpeedTimer) clearInterval(this.dropSpeedTimer);
      this.dropSpeedTimer = setInterval(() => {
        this.dropBubblesOneRow();
      }, this.dropSpeed * 1000);
    }, 15000);
  }

  // 🪨 ПОДІЯ: Хвиля каменів
  stoneWaveEvent() {
    const stoneCount = Math.min(3 + this.difficultyLevel, 8);
    let stonesAdded = 0;

    for (let i = 0; i < stoneCount; i++) {
      const row = Math.floor(Math.random() * 3);
      const col = Math.floor(Math.random() * this.cols);

      if (!this.grid[row][col]) {
        this.grid[row][col] = {
          type: 'stone',
          row: row,
          col: col
        };
        stonesAdded++;
      }
    }

    this.showEventNotification(`🪨 Stone Wave!`, `${stonesAdded} stone bubbles appeared`);
    this.rebuildActiveBubblesCache();
  }

  // 🚨 ПОКРАЩЕНІ ЗАГРОЗЛИВІ ПАТЕРНИ
  generateAdvancedThreatPattern() {
    const patterns = ['stoneBarrier', 'colorTrap', 'narrowPath'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    switch (pattern) {
      case 'stoneBarrier':
        this.generateStoneBarrier();
        break;
      case 'colorTrap':
        this.generateColorTrap();
        break;
      case 'narrowPath':
        this.generateNarrowPath();
        break;
    }
  }

  generateStoneBarrier() {
    // Створюємо бар'єр з каменів
    const barrierRow = Math.floor(Math.random() * 3);
    const startCol = Math.floor(Math.random() * (this.cols - 4));

    for (let i = 0; i < 4; i++) {
      if (!this.grid[barrierRow][startCol + i]) {
        this.grid[barrierRow][startCol + i] = {
          type: 'stone',
          row: barrierRow,
          col: startCol + i
        };
      }
    }

    this.showEventNotification(`🚧 Stone Barrier!`, `Obstacle created`);
    this.rebuildActiveBubblesCache();
  }

  generateColorTrap() {
    // Створюємо пастку з одного кольору
    const trapColor = this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)];
    const centerRow = Math.floor(Math.random() * 2);
    const centerCol = Math.floor(Math.random() * (this.cols - 2)) + 1;

    // Створюємо хрест з одного кольору
    const positions = [
      { row: centerRow, col: centerCol },
      { row: centerRow, col: centerCol - 1 },
      { row: centerRow, col: centerCol + 1 },
      { row: centerRow + 1, col: centerCol }
    ];

    positions.forEach(pos => {
      if (pos.row < this.rows && pos.col >= 0 && pos.col < this.cols && !this.grid[pos.row][pos.col]) {
        this.grid[pos.row][pos.col] = {
          type: trapColor,
          row: pos.row,
          col: pos.col
        };
      }
    });

    this.showEventNotification(`🎯 Color Trap!`, `${trapColor} cluster formed`);
    this.rebuildActiveBubblesCache();
  }

  generateNarrowPath() {
    // Створюємо вузький прохід
    const pathCol = Math.floor(this.cols / 2);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (Math.abs(col - pathCol) > 1 && !this.grid[row][col] && Math.random() < 0.8) {
          this.grid[row][col] = {
            type: this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)],
            row: row,
            col: col
          };
        }
      }
    }

    this.showEventNotification(`🚪 Narrow Path!`, `Only center path remains`);
    this.rebuildActiveBubblesCache();
  }

  // 📢 ПОКАЗ ПОВІДОМЛЕНЬ ПРО ПОДІЇ
  showEventNotification(title, description) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 1rem;
      box-shadow: 0 8px 24px rgba(102,126,234,0.4);
      z-index: 1000;
      animation: slideInRight 0.5s ease-out;
      border: 2px solid rgba(255,255,255,0.3);
      max-width: 250px;
    `;
    notification.innerHTML = `${title}<br><small style="opacity:0.9;">${description}</small>`;

    document.body.appendChild(notification);

    // Видаляємо через 4 секунди
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }
    }, 4000);
  }

  updateScore() {
    this.scoreEl.textContent = `Score: ${this.score}`;
  }

  // ВИПРАВЛЕНА ФУНКЦІЯ для рівномірного опускання куль
  dropBubblesOneRow() {
    console.log('🔄 ОПУСКАННЯ КУЛЬ: Рівномірне опускання на один ряд вниз');

    // КРОК 1: Перевіряємо чи є кулі в останньому дозволеному ряду (game over)
    const gameOverRow = this.rows - this.allowedBottomRows;
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[gameOverRow][col]) {
        console.log('💀 Game Over: кулі досягли дна');
        this.gameOver();
        return;
      }
    }

    // КРОК 2: Опускаємо всі кулі на один ряд вниз (знизу вгору, щоб уникнути перезапису)
    console.log('🔄 Опускаємо всі кулі рівномірно вниз');

    for (let row = this.rows - 2; row >= 0; row--) { // Починаємо з передостаннього ряду
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          const newRow = row + 1;

          // Перевіряємо чи новий ряд в межах grid
          if (newRow < this.rows) {
            // Визначаємо правильну колонку для hexagonal grid
            let newCol = this.calculateHexagonalColumn(row, col, newRow);

            // Перевіряємо межі колонки для нового ряду
            const maxColInNewRow = newRow % 2 === 0 ? this.cols - 1 : this.cols - 2;
            if (newCol > maxColInNewRow) {
              newCol = maxColInNewRow; // Обмежуємо до максимальної колонки
            }

            // Якщо позиція вільна, переміщуємо кулю
            if (newCol >= 0 && newCol < this.cols && !this.grid[newRow][newCol]) {
              this.grid[newRow][newCol] = {
                type: bubble.type,
                row: newRow,
                col: newCol
              };
              this.grid[row][col] = null; // Очищуємо стару позицію
              console.log(`  ✅ Куля переміщена: (${row},${col}) -> (${newRow},${newCol}) [${bubble.type}]`);
            } else {
              // Якщо позиція зайнята, шукаємо найближчу вільну в тому ж ряду
              let foundPosition = false;

              // Спочатку пробуємо поруч (±1 колонка)
              for (let offset = 1; offset <= 2 && !foundPosition; offset++) {
                // Спробуємо зліва
                if (newCol - offset >= 0 && !this.grid[newRow][newCol - offset]) {
                  this.grid[newRow][newCol - offset] = {
                    type: bubble.type,
                    row: newRow,
                    col: newCol - offset
                  };
                  this.grid[row][col] = null;
                  console.log(`  ↙️ Куля зміщена вліво: (${row},${col}) -> (${newRow},${newCol - offset}) [${bubble.type}]`);
                  foundPosition = true;
                }
                // Спробуємо справа
                else if (newCol + offset <= maxColInNewRow && !this.grid[newRow][newCol + offset]) {
                  this.grid[newRow][newCol + offset] = {
                    type: bubble.type,
                    row: newRow,
                    col: newCol + offset
                  };
                  this.grid[row][col] = null;
                  console.log(`  ↘️ Куля зміщена вправо: (${row},${col}) -> (${newRow},${newCol + offset}) [${bubble.type}]`);
                  foundPosition = true;
                }
              }

              if (!foundPosition) {
                console.log(`  ⚠️ Куля залишилася на місці: (${row},${col}) [${bubble.type}] - немає вільного місця`);
              }
            }
          }
        }
      }
    }

    // КРОК 3: Генеруємо новий ряд у верхній частині (row 0)
    console.log('🎲 Генеруємо новий верхній ряд');
    for (let col = 0; col < this.cols; col++) {
      if (!this.grid[0][col]) { // Тільки якщо позиція вільна
        const bubbleType = this.selectBubbleTypeAvoidingSequence(0, col);
        this.grid[0][col] = {
          type: bubbleType,
          row: 0,
          col: col
        };
        console.log(`  🆕 Нова куля: (0,${col}) [${bubbleType}]`);
      }
    }

    // КРОК 4: Оновлюємо кеші та перевіряємо стан
    this.rebuildActiveBubblesCache();
    this.updateColorDistribution();
    this.checkGameOver();

    console.log('✅ Опускання куль завершено');
  }

  // ДОПОМІЖНА ФУНКЦІЯ для правильного обчислення колонки в hexagonal grid
  calculateHexagonalColumn(oldRow, oldCol, newRow) {
    const oldRowIsEven = oldRow % 2 === 0;
    const newRowIsEven = newRow % 2 === 0;

    // Якщо обидва ряди однакової парності, колонка не змінюється
    if (oldRowIsEven === newRowIsEven) {
      return oldCol;
    }

    // При переході між парним і непарним рядом може потребуватися корекція
    // В нашій реалізації hexagonal grid непарні ряди зсунуті на півколонки вправо
    if (oldRowIsEven && !newRowIsEven) {
      // З парного в непарний: можливо потрібна корекція
      return oldCol;
    } else {
      // З непарного в парний: можливо потрібна корекція
      return oldCol;
    }
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
      const { x, y } = this.gridToPixel(row, col);
      this.activeBubbles.set(key, { x, y, type: bubble.type, row, col });
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

  // Спрощена та оптимізована система колізій
  checkCollisionOptimized(bubbleX, bubbleY, prevX = null, prevY = null) {
    const searchRadius = this.bubbleRadius * 2.2; // Оптимізований радіус пошуку
    const collisionDistance = this.bubbleRadius * 1.8; // Більш точна відстань колізії

    // Спрощена логіка: перевіряємо лише поточну позицію та максимум 2 проміжні точки
    const checkPositions = [];

    if (prevX !== null && prevY !== null) {
      // Додаємо проміжну точку для більш точної колізії без надмірної складності
      const midX = (prevX + bubbleX) / 2;
      const midY = (prevY + bubbleY) / 2;
      checkPositions.push({ x: midX, y: midY });
    }

    // Завжди перевіряємо поточну позицію
    checkPositions.push({ x: bubbleX, y: bubbleY });

    // Перевіряємо колізії для кожної позиції
    for (const pos of checkPositions) {
      for (const [key, activeBubble] of this.activeBubbles) {
        const dx = pos.x - activeBubble.x;
        const dy = pos.y - activeBubble.y;

        // Швидка перевірка по осях
        if (Math.abs(dx) > searchRadius || Math.abs(dy) > searchRadius) continue;

        // Точна перевірка відстані
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < collisionDistance) {
          console.log(`💥 КОЛІЗІЯ знайдена на відстані ${distance.toFixed(1)} від кулі (${activeBubble.row},${activeBubble.col})`);
          return activeBubble;
        }
      }
    }

    return null;
  }

  // Функція для перевірки логіки сусідів
  debugNeighbors(row, col) {
    console.log(`🔍 DEBUG: Checking neighbors for position ${row},${col}`);

    const isEvenRow = row % 2 === 0;
    const neighbors = [
      { r: row - 1, c: isEvenRow ? col - 1 : col, name: 'top-left' },
      { r: row - 1, c: isEvenRow ? col : col + 1, name: 'top-right' },
      { r: row, c: col - 1, name: 'left' },
      { r: row, c: col + 1, name: 'right' },
      { r: row + 1, c: isEvenRow ? col - 1 : col, name: 'bottom-left' },
      { r: row + 1, c: isEvenRow ? col : col + 1, name: 'bottom-right' }
    ];

    neighbors.forEach(({ r, c, name }) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        const bubble = this.grid[r][c];
        const type = bubble ? bubble.type : 'EMPTY';
        console.log(`  ${name}: ${r},${c} = ${type}`);
      } else {
        console.log(`  ${name}: ${r},${c} = OUT_OF_BOUNDS`);
      }
    });
  }

  drawFPS() {
    this.ctx.save();
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 22);
    this.ctx.restore();
  }

  // ========== ДОДАНІ ВІДСУТНІ ФУНКЦІЇ ==========

  // Функція для обчислення X зміщення для ряду в hexagonal grid
  getRowOffsetX(row) {
    const evenRow = row % 2 === 0;
    return this.sidePadding + (evenRow ? 0 : this.bubbleRadius);
  }

  // Функція для отримання pixel позиції кулі по координатах grid
  getBubblePosition(row, col) {
    return this.gridToPixel(row, col);
  }

  // Функція для отримання сусідніх позицій для прикріплення кулі
  getAttachmentNeighbors(row, col) {
    const neighbors = this.getNeighbors(row, col);
    // Додаємо також позицію самої кулі для випадку, коли можна прикріпитися поруч
    const allPositions = [...neighbors, { r: row, c: col }];

    // Повертаємо лише валідні позиції
    return allPositions
      .filter(pos => pos.r >= 0 && pos.r < this.rows && pos.c >= 0 && pos.c < this.cols)
      .map(pos => ({ row: pos.r, col: pos.c }));
  }

  // Функція для пошуку альтернативної позиції при зайнятій клітинці
  findAlternativePosition(targetRow, targetCol) {
    const neighbors = this.getNeighbors(targetRow, targetCol);

    // Сортуємо сусідів за відстанню до поточної позиції стрільця
    const sortedNeighbors = neighbors
      .filter(pos => pos.r >= 0 && pos.r < this.rows && pos.c >= 0 && pos.c < this.cols)
      .filter(pos => !this.grid[pos.r][pos.c]) // Тільки вільні позиції
      .map(pos => {
        const pixelPos = this.gridToPixel(pos.r, pos.c);
        const distance = Math.sqrt(
          Math.pow(this.shootingBubble.x - pixelPos.x, 2) +
          Math.pow(this.shootingBubble.y - pixelPos.y, 2)
        );
        return { row: pos.r, col: pos.c, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    return sortedNeighbors.length > 0 ? sortedNeighbors[0] : null;
  }
}