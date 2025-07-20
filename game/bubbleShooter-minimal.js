// Мінімальна версія гри без синтаксичних помилок
export class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.bubbleImages = {};
    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan', 'heart'];
    this.grid = [];
    this.shootingBubble = null;
    this.score = 0;
    this.gameMode = 'endless';
    this.isGameOver = false;
    this.isPaused = false;
    
    console.log('BubbleShooterGame initialized');
    this.loadImages();
  }

  async loadImages() {
    console.log('Loading bubble images...');
    
    for (const type of this.bubbleTypes) {
      try {
        const img = new Image();
        img.src = `/ball-${type}.png`;
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            this.bubbleImages[type] = img;
            console.log(`Loaded ${type} image`);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load ${type} image`);
            resolve(); // Continue even if image fails
          };
        });
      } catch (error) {
        console.warn(`Error loading ${type}:`, error);
      }
    }
    
    console.log('Image loading completed');
  }

  showModeSelection() {
    console.log('showModeSelection called');

    const content = `
      <div id="mode-selection" style="
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 20px;
        padding: 40px 32px;
        text-align: center;
        width: 480px;
        margin: 0 auto;
        box-shadow: 0 16px 48px rgba(0,0,0,0.3);
      ">
        <h2 style="margin: 0 0 32px 0; color: #333; font-size: 2rem; font-weight: bold;">
          🎮 Select game mode
        </h2>
        <div style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
          <div style="display: flex; gap: 16px; width: 100%; justify-content: center;">
            <button id="endless-mode" style="
              flex: 1;
              max-width: 180px;
              padding: 14px 16px;
              font-size: 1rem;
              border-radius: 10px;
              border: none;
              background: #43cea2;
              color: #fff;
              font-weight: bold;
              cursor: pointer;
            ">🎯 Endless Mode</button>
            <button id="timed-mode" style="
              flex: 1;
              max-width: 180px;
              padding: 14px 16px;
              font-size: 1rem;
              border-radius: 10px;
              border: none;
              background: #4096ee;
              color: #fff;
              font-weight: bold;
              cursor: pointer;
            ">⏱️ 1 Minute Mode</button>
          </div>
          <button id="back-to-menu" style="
            width: 200px;
            padding: 12px 16px;
            font-size: 1rem;
            border-radius: 10px;
            border: none;
            background: #e74c3c;
            color: #fff;
            font-weight: bold;
            cursor: pointer;
          ">🏠 Back</button>
        </div>
      </div>
    `;

    this.container.innerHTML = content;

    // Add event listeners
    document.getElementById('endless-mode').onclick = () => {
      this.gameMode = 'endless';
      this.init();
    };

    document.getElementById('timed-mode').onclick = () => {
      this.gameMode = 'timed';
      this.init();
    };

    document.getElementById('back-to-menu').onclick = () => {
      if (typeof window.showMainMenu === 'function') {
        window.showMainMenu();
      }
    };
  }

  init() {
    console.log('Initializing game...');
    
    const content = `
      <div style="width: 620px; margin: 0 auto;">
        <div style="
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 16px;
          padding: 12px 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span id="score" style="
            padding: 8px 16px;
            font-size: 1.1rem;
            border-radius: 8px;
            background: #43cea2;
            color: #fff;
            font-weight: bold;
          ">Score: 0</span>
          <button id="pause-btn" style="
            padding: 8px 16px;
            font-size: 1.1rem;
            border-radius: 8px;
            border: none;
            background: #43cea2;
            color: #fff;
            font-weight: bold;
            cursor: pointer;
          ">⏸️ Pause</button>
        </div>
        <div style="position: relative;">
          <canvas id="game-canvas" width="620" height="600" style="
            background: #666;
            border-radius: 12px;
          "></canvas>
          <div id="game-over" class="hidden" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.95);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 16px 48px rgba(0,0,0,0.3);
          ">
            <h2 style="margin: 0 0 20px 0; color: #2C3E50;">Game Over!</h2>
            <p style="margin: 0 0 25px 0; color: #7F8C8D;">
              Final Score: <span id="final-score">0</span>
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
              <button id="play-again-btn" style="
                padding: 12px 30px;
                font-size: 1.1rem;
                border-radius: 12px;
                border: none;
                background: #43cea2;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
                width: 160px;
              ">🔄 Play Again</button>
              <button id="back-to-menu-btn" style="
                padding: 12px 30px;
                font-size: 1.1rem;
                border-radius: 12px;
                border: none;
                background: #e74c3c;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
                width: 160px;
              ">🏠 Back to Menu</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = content;

    // Initialize canvas
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Add event listeners
    document.getElementById('pause-btn').onclick = () => this.pauseGame();
    document.getElementById('play-again-btn').onclick = () => this.showModeSelection();
    document.getElementById('back-to-menu-btn').onclick = () => {
      if (typeof window.showMainMenu === 'function') {
        window.showMainMenu();
      }
    };

    // Start the game
    this.startGame();
  }

  startGame() {
    console.log('Starting game...');
    this.isGameOver = false;
    this.isPaused = false;
    this.score = 0;
    
    // Simple game loop
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isGameOver && !this.isPaused) {
      this.render();
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  render() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw simple game elements
    this.ctx.fillStyle = '#43cea2';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Running!', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Click to play', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  pauseGame() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.gameLoop();
    }
  }

  endGame() {
    this.isGameOver = true;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.remove('hidden');
  }
}