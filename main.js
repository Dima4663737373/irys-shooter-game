import { BubbleShooterGame } from './game/bubbleShooter.js';

const app = document.getElementById('app');

function showMainMenu() {
  app.innerHTML = `
    <div class="main-menu">
      <h1>Bubble Shooter</h1>
      <button id="play-btn">Play</button>
      <button id="leaderboard-btn">Leaderboard</button>
      <button id="settings-btn">Settings</button>
    </div>
  `;
  document.getElementById('play-btn').onclick = () => showGame();
  document.getElementById('leaderboard-btn').onclick = () => showLeaderboard();
  document.getElementById('settings-btn').onclick = () => showSettings();
}

function showGame() {
  app.innerHTML = `<div class="game-canvas"></div>`;
  window.showMainMenu = showMainMenu;
  new BubbleShooterGame(document.querySelector('.game-canvas'));
}

function showLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  let tableRows = leaderboard.map((entry, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.score}</td>
    </tr>
  `).join('');
  if (!tableRows) {
    tableRows = '<tr><td colspan="3" style="text-align:center;">No results yet</td></tr>';
  }
  app.innerHTML = `
    <div class="leaderboard" style="background:rgba(255,255,255,0.95); border-radius:18px; box-shadow:0 8px 32px rgba(0,0,0,0.12); padding:36px 24px; text-align:center; max-width:340px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#111; margin-bottom:24px; letter-spacing:1px;">Leaderboard</h2>
      <table style="width:100%; border-collapse:collapse; margin:24px 0; font-size:1.1rem;">
        <thead>
          <tr style="background:#e3f6fd; color:#2193b0;">
            <th style="padding:8px 0;">#</th>
            <th style="padding:8px 0;">Name</th>
            <th style="padding:8px 0;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <button id="clear-leaderboard" style="margin-bottom:16px; width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.2s,transform 0.2s; box-shadow:0 2px 8px rgba(67,206,162,0.10);">Clear Leaderboard</button><br>
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.2s,transform 0.2s; box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
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
  const savedName = localStorage.getItem('playerName') || '';
  app.innerHTML = `
    <div class="settings" style="background:rgba(255,255,255,0.93); border-radius:24px; box-shadow:0 8px 32px rgba(0,0,0,0.18); padding:48px 32px; text-align:center; max-width:340px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px; letter-spacing:1px;">Settings</h2>
      <form id="settings-form">
        <label for="player-name" style="font-size:1.1rem; color:#185a9d;">Player Name:</label><br>
        <input type="text" id="player-name" name="player-name" value="${savedName}" maxlength="16" placeholder="Enter your name" style="margin:18px 0 12px 0; padding:14px; border-radius:12px; border:1.5px solid #43cea2; width:220px; font-size:1.1rem; background:#f7fafc; box-shadow:0 2px 8px rgba(67,206,162,0.07); transition:border 0.2s;" required><br>
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
          <button type="submit" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.2s,transform 0.2s;">Save</button>
          <button id="back-menu" type="button" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.2s,transform 0.2s; box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
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