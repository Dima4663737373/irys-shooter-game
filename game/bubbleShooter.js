export class BubbleShooterGame {
  constructor(container) {
    this.container = container;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.rows = 9;
    this.cols = 7;
    this.bubbleRadius = 26;
    this.bubbleImages = {};
    this.bubbleTypes = ['blue', 'red', 'yellow', 'kyan'];
    this.grid = [];
    this.shootingBubble = null;
    this.shootingAngle = Math.PI / 2;
    this.isShooting = false;
    this.explodingBubbles = [];
    this.particles = []; // Для ефекту частинок
    this.isGameOver = false;
    this.lastTime = 0;
    this.loadImages().then(() => {
      this.init();
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

  init() {
    const gameWidth = 576;
    const playAreaWidth = 480;
    const gameHeight = 640;
    const sidePadding = (gameWidth - playAreaWidth) / 2;
    
    this.container.innerHTML = `
      <div class="game-header" style="background:rgba(255,255,255,0.93); border-radius:16px; box-shadow:0 4px 16px rgba(0,0,0,0.10); padding:18px 24px 14px 24px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; width:${gameWidth}px; margin-left:auto; margin-right:auto;">
        <div style="display:flex; gap:16px; align-items:center;">
          <span id="score" class="score-badge" style="display:inline-block; min-width:110px; padding:10px 22px; font-size:1.15rem; border-radius:12px; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; letter-spacing:1px; box-shadow:0 2px 8px rgba(67,206,162,0.10);">Score: 0</span>
          <span id="level" style="display:inline-block; padding:10px 22px; font-size:1.15rem; border-radius:12px; background:linear-gradient(90deg,#FF6B6B 0%,#FF8E53 100%); color:#fff; font-weight:bold; letter-spacing:1px; box-shadow:0 2px 8px rgba(255,107,107,0.10);">Level: 1</span>
        </div>
        <button id="pause-btn" class="pause-btn" style="padding:10px 28px; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 2px 8px rgba(67,206,162,0.10); transition:background 0.2s,transform 0.2s;">Pause</button>
      </div>
      <div style="position:relative; width:${gameWidth}px; margin:0 auto;">
        <canvas id="game-canvas" width="${gameWidth}" height="${gameHeight}"></canvas>
        <div id="pause-menu" class="hidden">
          <h2>Paused</h2>
          <button id="resume-btn">Resume</button>
          <button id="exit-btn">Exit</button>
        </div>
        <div id="level-complete" class="hidden" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(255,255,255,0.95); padding:30px; border-radius:20px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.15);">
          <h2 style="margin:0 0 20px 0; color:#2C3E50;">Level Complete!</h2>
          <p style="margin:0 0 25px 0; color:#7F8C8D;">Score: <span id="level-score">0</span></p>
          <button id="next-level-btn" style="padding:12px 30px; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer;">Next Level</button>
        </div>
      </div>
    `;
    this.canvas = this.container.querySelector('#game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pauseMenu = this.container.querySelector('#pause-menu');
    this.levelCompleteMenu = this.container.querySelector('#level-complete');
    this.scoreEl = this.container.querySelector('#score');
    this.levelEl = this.container.querySelector('#level');
    this.playAreaWidth = playAreaWidth;
    this.sidePadding = sidePadding;
    this.addEventListeners();
    this.createGrid();
    this.spawnShootingBubble();
    this.startGame();
  }

  addEventListeners() {
    this.container.querySelector('#pause-btn').onclick = () => this.pauseGame();
    this.container.querySelector('#resume-btn').onclick = () => this.resumeGame();
    this.container.querySelector('#exit-btn').onclick = () => this.exitGame();
    this.container.querySelector('#next-level-btn').onclick = () => this.startNextLevel();
    this.canvas.addEventListener('mousemove', (e) => this.aim(e));
    this.canvas.addEventListener('click', (e) => this.shoot(e));
  }

  createGrid() {
    this.grid = [];
    const patterns = this.getLevelPattern(this.level);
    
    for (let row = 0; row < this.rows; row++) {
      const arr = [];
      for (let col = 0; col < this.cols; col++) {
        if (patterns[row] && patterns[row][col]) {
          const type = patterns[row][col] === 'R' ? 
            this.bubbleTypes[Math.floor(Math.random() * this.bubbleTypes.length)] : 
            patterns[row][col].toLowerCase();
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

  getLevelPattern(level) {
    // Патерни для різних рівнів (R = випадковий колір)
    const patterns = {
      1: [
        'RRRRRR',
        'RRRRRR',
        'RRRRRR',
        'RRRRRR'
      ],
      2: [
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR'
      ],
      3: [
        'redredred',
        'blueblueb',
        'yellowyel',
        'kyankyan',
        'redredred'
      ],
      4: [
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR'
      ]
    };
    return patterns[level] || patterns[1];
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
      x: this.canvas.width / 2,
      y: this.canvas.height - this.bubbleRadius - 10, // Повертаємо попередній відступ знизу
      type,
      dx: 0,
      dy: 0,
      moving: false
    };
    this.shootingAngle = -Math.PI / 2;
    this.aim({
      clientX: this.canvas.getBoundingClientRect().left + this.canvas.width / 2,
      clientY: this.canvas.getBoundingClientRect().top + 40
    });
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
    
    const BUBBLE_SPEED = 720;
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
    this.updateScore();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    if (this.isPaused || this.isGameOver) return;

    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    if (this.explodingBubbles.length > 0) {
      for (const b of this.explodingBubbles) {
        b.progress += 0.08;
        // Створюємо частинки при вибуху
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
        
        // Перевіряємо чи рівень пройдено
        let remainingBubbles = 0;
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            if (this.grid[row][col]) remainingBubbles++;
          }
        }
        if (remainingBubbles === 0) {
          this.levelComplete();
          return;
        }
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
    const xOffset = (row % 2) * this.bubbleRadius;
    // Center the grid with proper spacing
    const gridWidth = this.cols * (this.bubbleRadius * 2 + 6);
    const padding = (this.playAreaWidth - gridWidth) / 2 + this.sidePadding;
    
    // Add more horizontal spacing between bubbles
    const x = col * (this.bubbleRadius * 2 + 6) + this.bubbleRadius + xOffset + padding;
    // Add more vertical spacing between rows
    const y = row * (this.bubbleRadius * 1.85) + this.bubbleRadius + 20; // Повертаємо попередній відступ зверху
    return { x, y };
  }

  drawShootingBubble() {
    if (!this.shootingBubble) return;
    
    this.ctx.save();
    if (this.shootingBubble.moving) {
      // Add motion blur effect
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 16;
      this.ctx.globalAlpha = 0.96;
      this.ctx.translate(this.shootingBubble.x, this.shootingBubble.y);
      this.ctx.scale(1.15, 1.15);
      
      const img = this.bubbleImages[this.shootingBubble.type];
      if (img) {
        this.ctx.drawImage(
          img,
          -this.bubbleRadius * 1.1,
          -this.bubbleRadius * 1.1,
          this.bubbleRadius * 2.2,
          this.bubbleRadius * 2.2
        );
      }
    } else {
      this.drawBubble(
        this.shootingBubble.x,
        this.shootingBubble.y,
        this.shootingBubble.type
      );
    }
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

    // Check ceiling collision
    if (this.shootingBubble.y <= this.bubbleRadius) {
      const col = Math.round((this.shootingBubble.x - this.bubbleRadius - padding) / (this.bubbleRadius * 2));
      this.attachBubbleToGrid(0, col);
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

            for (const pos of possiblePositions) {
              if (pos.row >= 0 && pos.row < this.rows && 
                  pos.col >= 0 && pos.col < this.cols && 
                  !this.grid[pos.row][pos.col]) {
                this.attachBubbleToGrid(pos.row, pos.col);
                return;
              }
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
      this.grid[hitRow][hitCol] = {
        type: this.shootingBubble.type,
        row: hitRow,
        col: hitCol
      };
      
      const matches = this.findAndRemoveGroups(hitRow, hitCol);
      if (matches.length >= 3) {
        let points = 0;
        if (matches.length === 3) points = 30;
        else if (matches.length === 4) points = 50;
        else if (matches.length >= 5) points = 100;
        
        this.score += points;
        this.updateScore();
        
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
    if (this.isGameOver) return;
    this.isGameOver = true;
    // Зберігаємо результат у localStorage лише якщо score > 0
    if (this.score > 0) {
      const playerName = localStorage.getItem('playerName') || 'Anonymous';
      const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
      leaderboard.push({
        name: playerName,
        score: this.score
      });
      // Зберігаємо лише топ-20 результатів
      leaderboard.sort((a, b) => b.score - a.score);
      localStorage.setItem('bubbleLeaderboard', JSON.stringify(leaderboard.slice(0, 20)));
    }
    alert('Game Over!');
    if (typeof window.showMainMenu === 'function') window.showMainMenu();
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

  levelComplete() {
    this.levelCompleteMenu.classList.remove('hidden');
    this.levelCompleteMenu.querySelector('#level-score').textContent = this.score;
    this.level++;
  }

  startNextLevel() {
    this.levelCompleteMenu.classList.add('hidden');
    this.createGrid();
    this.spawnShootingBubble();
    this.levelEl.textContent = `Level: ${this.level}`;
    this.loop(performance.now());
  }
} 