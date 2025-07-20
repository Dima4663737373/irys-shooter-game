console.log('🚀 Main.js loaded successfully');

import { WalletManager } from './js/wallet.js';
import { UIManager } from './js/ui.js';
import { GameManager } from './js/game-manager.js';

// Initialize managers
const walletManager = new WalletManager();
const uiManager = new UIManager();
const gameManager = new GameManager(uiManager, walletManager);

// Global function to save results to leaderboard
function saveToLeaderboard(score, gameMode = 'endless') {
  console.log(`🏆 saveToLeaderboard called: score=${score}, gameMode=${gameMode}`);

  const playerName = localStorage.getItem('playerName') || 'Anonymous';
  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');

  const newResult = {
    name: playerName,
    score: score,
    mode: gameMode || 'endless',
    date: new Date().toISOString()
  };

  leaderboard.push(newResult);
  leaderboard.sort((a, b) => b.score - a.score);
  const topResults = leaderboard.slice(0, 50);

  localStorage.setItem('bubbleLeaderboard', JSON.stringify(topResults));
  console.log(`💾 Result saved! Now leaderboard has ${topResults.length} entries`);
}

// Export functions for use in game
window.saveToLeaderboard = saveToLeaderboard;
window.setGlobalBackground = () => uiManager.setGlobalBackground();
window.showMainMenu = showMainMenu;

function showMainMenu() {
  const elements = uiManager.showMainMenu();
  
  elements.playBtn.onclick = () => gameManager.showGame();
  elements.connectWalletBtn.onclick = () => showWalletConnection();
  elements.leaderboardBtn.onclick = () => showLeaderboard();
  elements.settingsBtn.onclick = () => showSettings();
}

function showWalletConnection() {
  const elements = uiManager.showWalletConnection(walletManager);
  
  elements.backBtn.onclick = showMainMenu;
  
  if (elements.disconnectBtn) {
    elements.disconnectBtn.onclick = () => {
      walletManager.disconnectWallet();
      showWalletConnection();
    };
  }
  
  if (elements.metamaskBtn) {
    elements.metamaskBtn.onclick = () => connectWallet('metamask', elements.statusDiv);
  }
  
  if (elements.rabbyBtn) {
    elements.rabbyBtn.onclick = () => connectWallet('rabby', elements.statusDiv);
  }
  
  if (elements.okxBtn) {
    elements.okxBtn.onclick = () => connectWallet('okx', elements.statusDiv);
  }

  if (elements.walletBtns) {
    uiManager.addButtonHoverEffects(elements.walletBtns);
  }
}

async function connectWallet(walletType, statusDiv) {
  statusDiv.innerHTML = '<div style="color:#f39c12;">🔄 Connecting...</div>';
  
  const result = await walletManager.connectWallet(walletType);
  
  if (result.success) {
    statusDiv.innerHTML = '<div style="color:#27ae60;">✅ Successfully connected!</div>';
    setTimeout(() => {
      showWalletConnection();
    }, 1000);
  } else {
    statusDiv.innerHTML = `<div style="color:#e74c3c;">❌ ${result.error}</div>`;
  }
}

function showLeaderboard() {
  uiManager.setGlobalBackground();

  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  const currentPlayerName = localStorage.getItem('playerName') || 'Anonymous';

  const playerResults = leaderboard.filter(entry => entry.name === currentPlayerName);
  const bestPlayerResult = playerResults.length > 0 ?
    playerResults.reduce((best, current) => current.score > best.score ? current : best) : null;

  let playerPosition = null;
  if (bestPlayerResult) {
    playerPosition = leaderboard.findIndex(entry =>
      entry.name === bestPlayerResult.name &&
      entry.score === bestPlayerResult.score &&
      entry.mode === bestPlayerResult.mode
    ) + 1;
  }

  let playerBestSection = '';
  if (bestPlayerResult) {
    playerBestSection = `
      <div style="background:linear-gradient(135deg, #43cea2 0%, #185a9d 100%); border-radius:12px; padding:16px; margin:16px 0; box-shadow:0 8px 24px rgba(67,206,162,0.3); border:2px solid rgba(255,255,255,0.2);">
        <h3 style="color:#fff; margin:0 0 12px 0; font-size:1.2rem; text-shadow:0 2px 4px rgba(0,0,0,0.3);">🌟 Your Best Result</h3>
        <div style="background:rgba(255,255,255,0.15); border-radius:8px; padding:12px; backdrop-filter:blur(10px);">
          <div style="display:flex; justify-content:space-between; align-items:center; color:#fff; font-weight:bold;">
            <span style="font-size:1.1rem;">Rank #${playerPosition}</span>
            <span style="font-size:1.3rem; color:#FFD700; text-shadow:0 2px 4px rgba(0,0,0,0.5);">${bestPlayerResult.score} pts</span>
            <span style="font-size:1rem; opacity:0.9;">${bestPlayerResult.mode === 'timed' ? '1min' : 'Endless'}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    playerBestSection = `
      <div style="background:linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); border-radius:12px; padding:16px; margin:16px 0; box-shadow:0 8px 24px rgba(149,165,166,0.3); border:2px solid rgba(255,255,255,0.2);">
        <h3 style="color:#fff; margin:0 0 8px 0; font-size:1.2rem; text-shadow:0 2px 4px rgba(0,0,0,0.3);">🎮 Your Results</h3>
        <p style="color:rgba(255,255,255,0.9); margin:0; font-size:1rem;">No games played yet. Start playing to see your best score!</p>
      </div>
    `;
  }

  let tableRows = leaderboard.map((entry, idx) => {
    const isCurrentPlayer = entry.name === currentPlayerName;
    const rowStyle = isCurrentPlayer ?
      'border-bottom:1px solid #e0e6ed; background:linear-gradient(90deg, rgba(67,206,162,0.1) 0%, rgba(24,90,157,0.1) 100%); border-left:4px solid #43cea2;' :
      'border-bottom:1px solid #e0e6ed;';

    const nameStyle = isCurrentPlayer ?
      'padding:12px 16px; text-align:left; color:#185a9d; font-weight:bold;' :
      'padding:12px 16px; text-align:left; color:#333;';

    return `
      <tr style="${rowStyle}">
        <td style="padding:12px 8px; text-align:center; font-weight:bold; color:#2193b0;">${idx + 1}</td>
        <td style="${nameStyle}">${entry.name}${isCurrentPlayer ? ' 👤' : ''}</td>
        <td style="padding:12px 16px; text-align:center; font-weight:bold; color:#43cea2;">${entry.score}</td>
        <td style="padding:12px 16px; text-align:center; color:#666;">${entry.mode === 'timed' ? '1min' : 'Endless'}</td>
      </tr>
    `;
  }).join('');

  if (!tableRows) {
    tableRows = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#999; font-style:italic;">No results yet</td></tr>';
  }

  const recordsCount = leaderboard.length;
  const recordsInfo = recordsCount > 10 ?
    `<p style="color:#666; font-size:0.9rem; margin-bottom:16px;">Showing ${recordsCount} results - scroll to see more</p>` :
    recordsCount > 0 ? `<p style="color:#666; font-size:0.9rem; margin-bottom:16px;">${recordsCount} result${recordsCount > 1 ? 's' : ''}</p>` : '';

  const content = `
    <div class="leaderboard" style="background:#ffffff; border:2px solid #43cea2; border-radius:18px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:36px 32px; text-align:center; max-width:580px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#111; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🏆 Leaderboard</h2>
      
      ${playerBestSection}
      
      ${recordsInfo}
      <div style="max-height:400px; overflow-y:auto; border:1px solid #e0e6ed; border-radius:8px; margin:16px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:1.1rem;">
          <thead style="position:sticky; top:0; background:#e3f6fd; z-index:1;">
            <tr style="color:#2193b0;">
              <th style="padding:12px 8px; text-align:center; border-bottom:2px solid #43cea2;">#</th>
              <th style="padding:12px 16px; text-align:left; border-bottom:2px solid #43cea2;">Name</th>
              <th style="padding:12px 16px; text-align:center; border-bottom:2px solid #43cea2;">Score</th>
              <th style="padding:12px 16px; text-align:center; border-bottom:2px solid #43cea2;">Mode</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      </div>
      <button id="admin-clear" style="margin-bottom:16px; width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#e74c3c 0%,#c0392b 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(231,76,60,0.10);">Admin Clear</button><br>
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
    </div>
  `;
  
  uiManager.smoothTransition(content);

  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('admin-clear').onclick = function () {
    const password = prompt('Enter admin password to clear leaderboard:');

    if (password === 'IrysOwner2024') {
      if (confirm('Admin access confirmed. Are you sure you want to clear the entire leaderboard? This action cannot be undone.')) {
        localStorage.removeItem('bubbleLeaderboard');
        alert('Leaderboard cleared successfully!');
        showLeaderboard();
      }
    } else if (password !== null) {
      alert('Access denied. Invalid admin password.');
    }
  };
}

function showSettings() {
  uiManager.setGlobalBackground();

  const savedName = localStorage.getItem('playerName') || '';
  const content = `
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
  
  uiManager.smoothTransition(content);

  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('settings-form').onsubmit = function (e) {
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

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 DOM loaded, initializing app...');
  uiManager.setGlobalBackground();

  const app = document.getElementById('app');
  app.style.transition = 'none';
  app.style.opacity = '1';
  
  showMainMenu();
});