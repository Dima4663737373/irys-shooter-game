import { BubbleShooterGame } from './game/bubbleShooter.js';

const app = document.getElementById('app');

// Глобальна функція для збереження результатів в лідерборд
function saveToLeaderboard(score, gameMode = 'endless') {
  const playerName = localStorage.getItem('playerName') || 'Anonymous';
  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  
  // Додаємо новий результат
  const newResult = {
    name: playerName,
    score: score,
    mode: gameMode || 'endless', // Забезпечуємо що режим завжди визначений
    date: new Date().toISOString()
  };
  leaderboard.push(newResult);
  
  // Сортуємо за результатом (найкращі перші)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Залишаємо тільки топ-10 результатів
  const topResults = leaderboard.slice(0, 10);
  
  // Зберігаємо назад в localStorage
  localStorage.setItem('bubbleLeaderboard', JSON.stringify(topResults));
}

// Експортуємо функції для використання в грі
window.saveToLeaderboard = saveToLeaderboard;
window.setGlobalBackground = setGlobalBackground;

// Універсальна функція для встановлення фону скрізь
function setGlobalBackground() {
  const timestamp = Date.now();
  console.log('setGlobalBackground: Setting background with timestamp:', timestamp);
  
  // Видаляємо старий стиль
  const existingStyle = document.getElementById('menu-bg-style');
  if (existingStyle) existingStyle.remove();
  
  // Створюємо новий CSS з псевдоелементом
  const style = document.createElement('style');
  style.id = 'menu-bg-style';
  style.textContent = `
    /* Блокуємо існуючі псевдоелементи */
    body:before, body::before { 
      display: none !important; 
    }
    body:after, body::after { 
      display: none !important; 
    }
    
    /* Встановлюємо наш фон скрізь */
    body {
      background: url('/menu-bg.jpg?v=${timestamp}') center center / cover no-repeat fixed !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log('setGlobalBackground: Added CSS style for background');
}

function showMainMenu() {
  setGlobalBackground();
  app.innerHTML = `
    <div class="main-menu" style="
      min-height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4);">
      <h1 style="animation: bounceIn 1s ease-out;">🎯 Irys Shooter</h1>
      <button id="play-btn" style="animation: slideInLeft 0.6s ease-out 0.3s both;">🎮 Play</button>
      <button id="leaderboard-btn" style="animation: slideInUp 0.6s ease-out 0.5s both;">🏆 Leaderboard</button>
      <button id="settings-btn" style="animation: slideInRight 0.6s ease-out 0.7s both;">⚙️ Settings</button>
    </div>
  `;
  
  // Додаємо звукові ефекти для кнопок
  const buttons = document.querySelectorAll('.main-menu button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      // Простий звук hover
      if (window.AudioContext || window.webkitAudioContext) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
          // Тихо ігноруємо помилки звуку
        }
      }
    });
  });
  
  document.getElementById('play-btn').onclick = () => showGame();
  document.getElementById('leaderboard-btn').onclick = () => showLeaderboard();
  document.getElementById('settings-btn').onclick = () => showSettings();
}

function showGame() {
  console.log('showGame: Starting game initialization');
  
  // Зберігаємо фон під час гри
  setGlobalBackground();
  
  app.innerHTML = `
    <div class="game-container">
      <canvas id="gameCanvas"></canvas>
    </div>
  `;
  
  console.log('showGame: HTML created, canvas element:', document.getElementById('gameCanvas'));
  
  window.showMainMenu = showMainMenu;
  
  try {
    const gameContainer = document.querySelector('.game-container');
    console.log('showGame: Game container found:', gameContainer);
    
    const game = new BubbleShooterGame(gameContainer);
    console.log('showGame: Game instance created:', game);
    
    // Запускаємо вибір режиму гри
    game.showModeSelection();
    console.log('showGame: Mode selection started');
    
    // Переконуємося що фон встановлений
    setGlobalBackground();
  } catch (error) {
    console.error('showGame: Error creating game:', error);
  }
}

function showLeaderboard() {
  // Зберігаємо фон в лідерборді
  setGlobalBackground();
  
  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  let tableRows = leaderboard.map((entry, idx) => `
    <tr style="border-bottom:1px solid #e0e6ed;">
      <td style="padding:12px 8px; text-align:center; font-weight:bold; color:#2193b0;">${idx + 1}</td>
      <td style="padding:12px 16px; text-align:left; color:#333;">${entry.name}</td>
      <td style="padding:12px 16px; text-align:center; font-weight:bold; color:#43cea2;">${entry.score}</td>
      <td style="padding:12px 16px; text-align:center; color:#666;">${entry.mode === 'timed' ? '1min' : 'Endless'}</td>
    </tr>
  `).join('');
  if (!tableRows) {
    tableRows = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#999; font-style:italic;">No results yet</td></tr>';
  }
  app.innerHTML = `
    <div class="leaderboard" style="background:#ffffff; border:2px solid #43cea2; border-radius:18px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:36px 32px; text-align:center; max-width:580px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#111; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🏆 Leaderboard</h2>
      <table style="width:100%; border-collapse:collapse; margin:24px 0; font-size:1.1rem;">
        <thead>
          <tr style="background:#e3f6fd; color:#2193b0;">
            <th style="padding:12px 8px; text-align:center;">#</th>
            <th style="padding:12px 16px; text-align:left;">Name</th>
            <th style="padding:12px 16px; text-align:center;">Score</th>
            <th style="padding:12px 16px; text-align:center;">Mode</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <button id="clear-leaderboard" style="margin-bottom:16px; width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Clear Leaderboard</button><br>
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
    </div>
  `;
  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('clear-leaderboard').onclick = function() {
    if (confirm('Are you sure you want to clear the leaderboard?')) {
      localStorage.removeItem('bubbleLeaderboard');
      showLeaderboard();
    }
  };
}

function showSettings() {
  // Зберігаємо фон в налаштуваннях
  setGlobalBackground();
  
  const savedName = localStorage.getItem('playerName') || '';
  app.innerHTML = `
    <div class="settings" style="background:#ffffff; border:2px solid #43cea2; border-radius:24px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:48px 32px; text-align:center; max-width:340px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">⚙️ Settings</h2>
      <form id="settings-form">
        <label for="player-name" style="font-size:1.1rem; color:#185a9d;">Player Name:</label><br>
        <input type="text" id="player-name" name="player-name" value="${savedName}" maxlength="16" placeholder="Enter your name" style="margin:18px 0 12px 0; padding:14px; border-radius:12px; border:1.5px solid #43cea2; width:220px; font-size:1.1rem; background:#f7fafc; box-shadow:0 2px 8px rgba(67,206,162,0.07); transition:border 0.3s ease-in-out;" required><br>
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
          <button type="submit" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">Save</button>
                      <button id="back-menu" type="button" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
        </div>
      </form>
      <div id="settings-msg" style="color:#2193b0; margin-top:14px; font-size:1.05rem;"></div>
    </div>
  `;
  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('settings-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    if (name.length === 0) {
      document.getElementById('settings-msg').textContent = 'Please enter your name.';
      return;
    }
    localStorage.setItem('playerName', name);
    document.getElementById('settings-msg').textContent = 'Name saved!';
  };
}

// Запуск з головного меню
showMainMenu(); 