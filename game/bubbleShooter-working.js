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
    this.ctx.imageSmoothingEnabled = false;

    // Кеш для позицій бульбашок
    this.activeBubbles = new Map();
    this.bubbleQuadTree = new Map();

    this.canvas.width = 480;
    this.canvas.height = 720;
    this.playAreaWidth = this.canvas.width;
    this.playAreaHeight = this.canvas.height - 120;

    this.bubbleRadius = 22;
    this.cols = 12;
    this.rows = 12;
    this.sidePadding = 60;
    this.shooterY = this.canvas.height - this.bubbleRadius * 1.5;

    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan', 'heart'];
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

    // Системи для складності
    this.difficulty = 1;
    this.difficultyMultiplier = 1;
    this.difficultyInterval = null;
    this.shotsCount = 0;
    this.consecutiveHits = 0;
    this.bubbleGenerationCounter = 0;
    this.recentColors = [];
    this.colorDistribution = new Map();
    this.lastPatternType = null;

    this.bubbleImages = {};
    this.sounds = {};
    this.allowedBottomRows = 1;
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.frameCounter = 0;
    this.threatRowTimer = null;

    // Глобальна система моніторингу
    this.gridMonitor = {
      enabled: true,
      operations: [],
      maxOperations: 500
    };

    this.createGrid();
    this.loadImages().then(() => {
      console.log('Images loaded, spawning shooting bubble');
      this.spawnShootingBubble();
      // Перевіряємо, чи завантажилися зображення
      console.log('Available bubble images:', Object.keys(this.bubbleImages));
      Object.keys(this.bubbleImages).forEach(type => {
        const img = this.bubbleImages[type];
        console.log(`Image ${type}: complete=${img.complete}, naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}`);
      });
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

    // Очищуємо будь-які залишкові таймери
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
          // Don't reject, just resolve with null to continue loading other images
          resolve({ type, img: null });
        };
        img.src = `/ball-${type}.png`;
        console.log(`loadImages: Loading ${type} from /ball-${type}.png`);
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);
      loadedImages.forEach(({ type, img }) => {
        if (img) {
          this.bubbleImages[type] = img;
          console.log(`loadImages: Added ${type} to bubbleImages`);
        } else {
          console.warn(`loadImages: Failed to load ${type}, will use fallback`);
        }
      });
      console.log('loadImages: Image loading completed');
      console.log('Loaded images:', Object.keys(this.bubbleImages));
    } catch (error) {
      console.error('loadImages: Error loading images:', error);
    }
  }

  initSounds() {
    this.soundEnabled = true;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loadSounds();
      console.log('Sounds initialized successfully');
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

  smoothGameTransition(newContent, callback = null) {
    this.container.innerHTML = newContent;
    if (callback) callback();
  }

  showModeSelection() {
    console.log('showModeSelection called');

    this.stopMoveTimer();

    const existingTimer = document.getElementById('move-timer');
    if (existingTimer) {
      existingTimer.remove();
      console.log('Timer UI forcefully removed');
    }

    const content = `
      <div id="mode-selection" style="background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border:2px solid rgba(255,255,255,0.3); border-radius:20px; padding:40px 32px; text-align:center; width:480px; margin:0 auto; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4); animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
        <h2 id="mode-title" style="margin:0 0 32px 0; color:#ffffff; font-size:2rem; font-weight:bold; animation: bounceIn 1s ease-out 0.3s both; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">🎮 Select game mode</h2>
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
      </div>
    `;

    this.smoothGameTransition(content, () => {
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach((button) => {
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
        this.gameMode = 'endless';
        this.init();
      };

      this.container.querySelector('#timed-mode').onclick = () => {
        this.playSound('start');
        this.gameMode = 'timed';
        this.timeLeft = 60;
        this.init();
      };

      this.container.querySelector('#back-to-menu').onclick = () => {
        this.playSound('menu');
        if (typeof window.showMainMenu === 'function') {
          window.showMainMenu();
        }
      };

      if (typeof window.setGlobalBackground === 'function') {
        window.setGlobalBackground();
      }
    });
  }

  init() {
    this.stopMoveTimer();
    const existingTimer = document.getElementById('move-timer');
    if (existingTimer) {
      existingTimer.remove();
    }

    const gameWidth = 620;
    const gameHeight = 600;

    const content = `
      <div style="width:${gameWidth}px; margin:0 auto;">
        <div class="game-header" style="background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4); padding:12px 16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:12px; align-items:center;">
            <span id="score" style="display:inline-block; padding:8px 16px; font-size:1.1rem; border-radius:8px; background:#43cea2; color:#fff; font-weight:bold;">Score: 0</span>
            ${this.gameMode === 'timed' ? `<span id="timer" style="display:inline-block; padding:8px 16px; font-size:1.1rem; border-radius:8px; background:#FF6B6B; color:#fff; font-weight:bold;">Time: 60s</span>` : ''}
          </div>
          <button id="pause-btn" style="padding:8px 16px; font-size:1.1rem; border-radius:8px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer;">⏸️ Pause</button>
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

    this.smoothGameTransition(content, async () => {
      this.canvas = this.container.querySelector('#game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.pauseMenu = this.container.querySelector('#pause-menu');
      this.gameOverMenu = this.container.querySelector('#game-over');
      this.scoreEl = this.container.querySelector('#score');
      this.timerEl = this.gameMode === 'timed' ? this.container.querySelector('#timer') : null;
      this.addEventListeners();
      this.createGrid();
      
      // Перезавантажуємо зображення перед початком гри
      console.log('Reloading images before game start...');
      await this.loadImages();
      
      // Додаткова затримка для завантаження зображень
      setTimeout(() => {
        console.log('Final check - Available images:', Object.keys(this.bubbleImages));
        this.spawnShootingBubble();
        this.startGame();
      }, 500);
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
    
    const startingRows = Math.max(1, this.rows - this.allowedBottomRows - 4);
    this.createBalancedStructure(startingRows);
    this.updateColorDistribution();
    this.rebuildActiveBubblesCache();
  }

  createBalancedStructure(startingRows) {
    for (let row = 0; row < startingRows; row++) {
      const colsInRow = row % 2 === 0 ? this.cols : this.cols - 1;
      for (let col = 0; col < colsInRow; col++) {
        const isGuaranteedPosition = (row + col) % 3 !== 2;
        if (isGuaranteedPosition) {
          const bubbleType = this.selectBubbleType();
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

  selectBubbleType() {
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    return colorTypes[Math.floor(Math.random() * colorTypes.length)];
  }

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

  updateActiveBubblesCache(row, col, bubble) {
    const key = `${row},${col}`;
    if (bubble) {
      this.activeBubbles.set(key, bubble);
    } else {
      this.activeBubbles.delete(key);
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

  spawnShootingBubble() {
    const colorTypes = this.bubbleTypes.filter(t => t !== 'stone');
    this.shootingBubble = {
      type: colorTypes[Math.floor(Math.random() * colorTypes.length)],
      x: this.canvas.width / 2,
      y: this.shooterY
    };
  }

  startGame() {
    this.isGameOver = false;
    this.isPaused = false;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isGameOver && !this.isPaused) {
      this.update();
      this.render();
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  update() {
    if (this.gameMode === 'timed' && this.timeLeft > 0) {
      this.timeLeft -= 1/60;
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          this.renderBubble(row, col, this.grid[row][col].type);
        }
      }
    }
    
    if (this.shootingBubble) {
      this.renderShootingBubble();
    }
  }

  renderBubble(row, col, type) {
    const x = this.getBubbleX(row, col);
    const y = this.getBubbleY(row);
    
    // Додаткова перевірка для відладки
    if (this.bubbleImages[type] && this.bubbleImages[type].complete && this.bubbleImages[type].naturalWidth > 0) {
      this.ctx.drawImage(
        this.bubbleImages[type],
        x - this.bubbleRadius,
        y - this.bubbleRadius,
        this.bubbleRadius * 2,
        this.bubbleRadius * 2
      );
    } else {
      // Fallback до кольорових кружечків якщо зображення не завантажилося
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getBubbleColor(type);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Додаємо очі для fallback спрайтів
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(x - 6, y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + 6, y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderShootingBubble() {
    const x = this.shootingBubble.x;
    const y = this.shootingBubble.y;
    
    if (this.bubbleImages[this.shootingBubble.type] && 
        this.bubbleImages[this.shootingBubble.type].complete && 
        this.bubbleImages[this.shootingBubble.type].naturalWidth > 0) {
      this.ctx.drawImage(
        this.bubbleImages[this.shootingBubble.type],
        x - this.bubbleRadius,
        y - this.bubbleRadius,
        this.bubbleRadius * 2,
        this.bubbleRadius * 2
      );
    } else {
      // Fallback до кольорових кружечків
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.bubbleRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.getBubbleColor(this.shootingBubble.type);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Додаємо очі для fallback спрайтів
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(x - 6, y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(x + 6, y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  getBubbleX(row, col) {
    const isEvenRow = row % 2 === 0;
    const offset = isEvenRow ? 0 : this.bubbleRadius;
    return this.sidePadding + col * this.bubbleRadius * 2 + this.bubbleRadius + offset;
  }

  getBubbleY(row) {
    return row * this.bubbleRadius * 1.5 + this.bubbleRadius;
  }

  getBubbleColor(type) {
    const colors = {
      blue: '#4A90E2',
      red: '#E74C3C',
      yellow: '#F1C40F',
      kyan: '#1ABC9C',
      heart: '#E91E63',
      stone: '#7F8C8D'
    };
    return colors[type] || '#999';
  }

  aim(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = mouseX - this.shootingBubble.x;
    const dy = mouseY - this.shootingBubble.y;
    this.aimAngle = Math.atan2(dy, dx);
  }

  shoot(e) {
    if (this.isGameOver || this.isPaused) return;
    
    this.playSound('shoot');
    console.log('Shooting bubble');
  }

  pauseGame() {
    this.isPaused = true;
    this.pauseMenu.classList.remove('hidden');
  }

  resumeGame() {
    this.isPaused = false;
    this.pauseMenu.classList.add('hidden');
    this.gameLoop();
  }

  endGame() {
    this.isGameOver = true;
    this.playSound('game-over');
    this.container.querySelector('#final-score').textContent = this.score;
    this.gameOverMenu.classList.remove('hidden');
    this.saveGameResultToBlockchain();
  }

  exitGame() {
    this.isGameOver = true;
    this.stopMoveTimer();
    if (typeof window.showMainMenu === 'function') {
      window.showMainMenu();
    }
  }

  async saveGameResultToBlockchain() {
    try {
      if (!window.currentGameSession) {
        console.log('No active game session found');
        return;
      }

      const result = await window.SimpleTestIntegration.endGameSession(
        window.currentGameSession,
        this.score
      );

      if (result.success) {
        console.log('Game result saved to blockchain successfully');
      } else {
        console.error('Failed to save game result:', result.error);
      }
    } catch (error) {
      console.error('Error saving game result to blockchain:', error);
    }
  }
}