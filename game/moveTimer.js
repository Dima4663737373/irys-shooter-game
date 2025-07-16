// Методи для системи обмеження часу на хід

// ⏱️ ЗАПУСК ТАЙМЕРА ХОДУ
export function startMoveTimer() {
  if (this.gameMode !== 'endless') return;
  
  // Визначаємо ліміт часу залежно від часу гри
  const gameTime = (Date.now() - this.gameStartTime) / 1000;
  
  if (gameTime < 30) {
    this.moveTimeLimit = 3.0; // Перші 30 секунд - 3 секунди на хід
    this.moveTimePhase = 1;
  } else if (gameTime < 60) {
    this.moveTimeLimit = 2.0; // Наступні 30 секунд - 2 секунди на хід
    this.moveTimePhase = 2;
  } else {
    this.moveTimeLimit = 1.5; // Після 60 секунд - 1.5 секунди на хід
    this.moveTimePhase = 3;
  }
  
  this.moveStartTime = Date.now();
  this.moveTimeRemaining = this.moveTimeLimit;
  this.isMoveActive = true;
  
  console.log(`⏱️ MOVE TIMER: Started phase ${this.moveTimePhase}, limit ${this.moveTimeLimit}s`);
  
  // Створюємо або оновлюємо візуальний індикатор
  this.createMoveTimerUI();
  
  // Запускаємо інтервал оновлення таймера
  if (this.moveTimerInterval) clearInterval(this.moveTimerInterval);
  this.moveTimerInterval = setInterval(() => {
    this.updateMoveTimer();
  }, 50); // Оновлюємо кожні 50мс для плавності
}

// ⏱️ ОНОВЛЕННЯ ТАЙМЕРА ХОДУ
export function updateMoveTimer() {
  if (!this.isMoveActive || this.shootingBubble?.moving) return;
  
  const elapsed = (Date.now() - this.moveStartTime) / 1000;
  this.moveTimeRemaining = Math.max(0, this.moveTimeLimit - elapsed);
  
  // Оновлюємо візуальний індикатор
  this.updateMoveTimerUI();
  
  // Якщо час вийшов - автоматично стріляємо
  if (this.moveTimeRemaining <= 0) {
    console.log(`⏰ TIME'S UP! Auto-shooting bubble`);
    this.autoShoot();
  }
}

// 🎯 АВТОМАТИЧНИЙ ПОСТРІЛ ПРИ ЗАКІНЧЕННІ ЧАСУ
export function autoShoot() {
  if (!this.shootingBubble || this.shootingBubble.moving) return;
  
  // Стріляємо прямо вгору (безпечний кут)
  this.shootingAngle = Math.PI / 2; // 90 градусів
  
  this.playSound('shoot');
  this.shotsCount++;
  
  const speed = 850;
  this.shootingBubble.dx = Math.cos(this.shootingAngle) * speed;
  this.shootingBubble.dy = -Math.sin(this.shootingAngle) * speed;
  this.shootingBubble.moving = true;
  
  console.log(`🎯 AUTO-SHOT: Bubble shot automatically due to time limit`);
  
  // Зупиняємо таймер ходу
  this.stopMoveTimer();
}

// ⏹️ ЗУПИНКА ТАЙМЕРА ХОДУ
export function stopMoveTimer() {
  this.isMoveActive = false;
  if (this.moveTimerInterval) {
    clearInterval(this.moveTimerInterval);
    this.moveTimerInterval = null;
  }
  
  // Приховуємо візуальний індикатор
  this.hideMoveTimerUI();
}

// 🎨 СТВОРЕННЯ ВІЗУАЛЬНОГО ІНДИКАТОРА ТАЙМЕРА
export function createMoveTimerUI() {
  // Видаляємо старий індикатор якщо є
  const existingTimer = document.getElementById('move-timer');
  if (existingTimer) {
    existingTimer.remove();
  }
  
  // Створюємо новий індикатор
  const timerContainer = document.createElement('div');
  timerContainer.id = 'move-timer';
  timerContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-weight: bold;
    font-size: 1.1rem;
    box-shadow: 0 8px 24px rgba(102,126,234,0.4);
    z-index: 1000;
    border: 2px solid rgba(255,255,255,0.3);
    min-width: 200px;
    text-align: center;
    animation: slideInDown 0.3s ease-out;
  `;
  
  timerContainer.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
      <span>⏱️ Phase ${this.moveTimePhase}</span>
      <div id="timer-bar-container" style="flex: 1; height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden;">
        <div id="timer-bar" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #FFC107, #F44336); border-radius: 4px; transition: width 0.05s linear;"></div>
      </div>
      <span id="timer-text">${this.moveTimeLimit.toFixed(1)}s</span>
    </div>
  `;
  
  document.body.appendChild(timerContainer);
}

// 🔄 ОНОВЛЕННЯ ВІЗУАЛЬНОГО ІНДИКАТОРА
export function updateMoveTimerUI() {
  const timerText = document.getElementById('timer-text');
  const timerBar = document.getElementById('timer-bar');
  
  if (timerText && timerBar) {
    timerText.textContent = `${this.moveTimeRemaining.toFixed(1)}s`;
    
    const percentage = (this.moveTimeRemaining / this.moveTimeLimit) * 100;
    timerBar.style.width = `${percentage}%`;
    
    // Змінюємо колір залежно від часу що залишився
    if (percentage > 60) {
      timerBar.style.background = '#4CAF50'; // Зелений
    } else if (percentage > 30) {
      timerBar.style.background = '#FFC107'; // Жовтий
    } else {
      timerBar.style.background = '#F44336'; // Червоний
      
      // Додаємо пульсацію коли час майже закінчився
      if (percentage < 20) {
        const container = document.getElementById('move-timer');
        if (container) {
          container.style.animation = 'pulse 0.5s infinite';
        }
      }
    }
  }
}

// 🙈 ПРИХОВУВАННЯ ІНДИКАТОРА
export function hideMoveTimerUI() {
  const timerContainer = document.getElementById('move-timer');
  if (timerContainer) {
    timerContainer.style.animation = 'slideOutUp 0.3s ease-in';
    setTimeout(() => {
      if (timerContainer.parentNode) {
        timerContainer.parentNode.removeChild(timerContainer);
      }
    }, 300);
  }
}