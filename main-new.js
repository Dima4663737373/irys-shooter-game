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
    <div class="leaderboard" style="
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
      border: 3px solid transparent;
      background-clip: padding-box;
      border-radius: 24px;
      box-shadow: 
        0 20px 60px rgba(0,0,0,0.15),
        0 8px 32px rgba(67,206,162,0.2),
        inset 0 1px 0 rgba(255,255,255,0.8);
      padding: 40px 36px;
      text-align: center;
      max-width: 580px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
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
      
      <h2 style="font-size:2rem; color:#ffffff; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 1;">🏆 Leaderboard</h2>
      
      ${playerBestSection}
      
      ${recordsInfo}
      <div style="max-height:400px; overflow-y:auto; border:1px solid #e0e6ed; border-radius:8px; margin:16px 0; background: #ffffff; position: relative; z-index: 1;">
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
      <button id="admin-clear" style="margin-bottom:16px; width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#e74c3c 0%,#c0392b 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(231,76,60,0.10); position: relative; z-index: 1;">Admin Clear</button><br>
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10); position: relative; z-index: 1;">Back</button>
      
      <style>
        @keyframes borderGlow {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      </style>
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
  
  const currentName = localStorage.getItem('playerName') || '';
  
  const settingsContent = `
    <div class="settings" style="
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
      border: 3px solid transparent;
      background-clip: padding-box;
      border-radius: 24px;
      box-shadow: 
        0 20px 60px rgba(0,0,0,0.15),
        0 8px 32px rgba(67,206,162,0.2),
        inset 0 1px 0 rgba(255,255,255,0.8);
      padding: 40px 36px;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
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
      
      <h2 style="
        font-size: 2.2rem;
        color: #ffffff;
        margin-bottom: 28px;
        letter-spacing: 1.5px;
        text-shadow: 0 4px 8px rgba(0,0,0,0.1);
        font-weight: 700;
      ">⚙️ Settings</h2>
      
      <!-- Градієнтний фон переливання під текстом та кнопками -->
      <div style="
        position: absolute;
        bottom: 80px;
        left: 20px;
        right: 20px;
        height: 200px;
        background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
        border-radius: 16px;
        opacity: 0.08;
        z-index: 0;
        animation: backgroundShimmer 4s ease-in-out infinite alternate;
      "></div>
      
      <form id="name-form" style="margin-bottom: 24px; position: relative; z-index: 1;">
        <label for="player-name" style="
          display: block;
          margin-bottom: 12px;
          color: #2c3e50;
          font-weight: 600;
          font-size: 1.15rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        ">Player Name:</label>
        
        <div style="position: relative; margin-bottom: 20px;">
          <input type="text" id="player-name" value="${currentName}" maxlength="32" required style="
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #e1e8ed;
            border-radius: 12px;
            font-size: 1.1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
            background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 
              inset 0 2px 4px rgba(0,0,0,0.06),
              0 1px 3px rgba(0,0,0,0.1);
            font-weight: 500;
          ">
          
          <!-- Декоративна іконка -->
          <div style="
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #95a5a6;
            font-size: 1.2rem;
            pointer-events: none;
          ">👤</div>
        </div>
      </form>
      
      <!-- Контейнер для кнопок по центру одна біля одної -->
      <div style="
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
        position: relative;
        z-index: 1;
      ">
        <button type="submit" form="name-form" style="
          width: 140px;
          padding: 16px 0;
          font-size: 1.1rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 4px 16px rgba(67,206,162,0.3),
            0 2px 8px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">Save</button>
        
        <button onclick="showMainMenu()" style="
          width: 140px;
          padding: 16px 0;
          font-size: 1.1rem;
          border-radius: 14px;
          border: 2px solid #bdc3c7;
          background: linear-gradient(145deg, #ecf0f1 0%, #bdc3c7 100%);
          color: #2c3e50;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 4px 16px rgba(189,195,199,0.2),
            0 2px 8px rgba(0,0,0,0.05);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
        ">Back to Menu</button>
      </div>
      
      <div id="settings-msg" style="
        margin: 16px 0;
        min-height: 28px;
        font-weight: 500;
        border-radius: 8px;
        padding: 8px;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
      "></div>
    </div>
    
    <style>
      @keyframes borderGlow {
        0% { opacity: 0.6; }
        100% { opacity: 1; }
      }
      
      @keyframes backgroundShimmer {
        0% {
          opacity: 0.05;
          transform: scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.12;
          transform: scale(1.02) rotate(1deg);
        }
        100% {
          opacity: 0.08;
          transform: scale(1) rotate(0deg);
        }
      }
      
      #player-name:focus {
        border-color: #43cea2 !important;
        box-shadow: 
          0 0 0 4px rgba(67,206,162,0.15),
          inset 0 2px 4px rgba(0,0,0,0.06),
          0 4px 16px rgba(67,206,162,0.2) !important;
        background: #ffffff !important;
      }
      
      button[type="submit"]:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 
          0 8px 24px rgba(67,206,162,0.4),
          0 4px 16px rgba(0,0,0,0.15);
        background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%);
      }
      
      button[onclick="showMainMenu()"]:hover {
        transform: translateY(-2px) scale(1.02);
        background: linear-gradient(145deg, #bdc3c7 0%, #95a5a6 100%);
        border-color: #95a5a6;
        box-shadow: 
          0 6px 20px rgba(189,195,199,0.3),
          0 3px 12px rgba(0,0,0,0.1);
      }
      
      button:active {
        transform: translateY(0) scale(0.98);
      }
    </style>
  `;
  
  uiManager.smoothTransition(settingsContent);
  
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('player-name');
  
  nameForm.onsubmit = function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (name) {
      // Перевіряємо чи ім'я вже збережено
      const currentPlayerName = localStorage.getItem('playerName');
      if (currentPlayerName && currentPlayerName === name) {
        const statusDiv = document.getElementById('settings-msg');
        if (statusDiv) {
          statusDiv.innerHTML = '<div style="color: #e74c3c;">❌ Це ім\'я вже зайняте, введіть інше</div>';
        }
        return;
      }
      
      // Якщо ім'я нове або відрізняється - зберігаємо в блокчейні
      savePlayerNameToBlockchain(name);
    }
  };
}

// Function to save player name to blockchain
async function savePlayerNameToBlockchain(playerName) {
  try {
    console.log(`👤 Saving player name to blockchain: ${playerName}`);
    
    const walletInfo = walletManager.getWalletInfo();
    const statusDiv = document.getElementById('settings-msg');
    
    if (!walletInfo.address) {
      statusDiv.innerHTML = '<div style="color: #e74c3c;">❌ Please connect your wallet first!</div>';
      return;
    }
    
    // Перевіряємо чи це оновлення імені
    const currentPlayerName = localStorage.getItem('playerName');
    const isUpdate = currentPlayerName && currentPlayerName !== playerName;
    
    // Показуємо статус підготовки
    const actionText = isUpdate ? 'Updating' : 'Saving';
    statusDiv.innerHTML = `<div style="color: #f39c12;">🔄 ${actionText} player name to blockchain...</div>`;
    
    // Отримуємо правильний провайдер
    let provider = window.ethereum;
    if (walletInfo.wallet === 'OKX Wallet' && window.okxwallet) {
      provider = window.okxwallet;
    }
    
    let integrationToUse = null;
    let integrationName = '';
    
    // Спробуємо IrysContractIntegration
    if (typeof window.IrysContractIntegration !== 'undefined') {
      console.log('🔄 Using IrysContractIntegration...');
      statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Connecting to Irys Network...</div>';
      
      try {
        const initialized = await window.IrysContractIntegration.initialize(provider);
        if (initialized) {
          integrationToUse = window.IrysContractIntegration;
          integrationName = 'Irys Contract Integration';
          console.log('✅ IrysContractIntegration ready');
        }
      } catch (error) {
        console.warn('⚠️ IrysContractIntegration failed:', error.message);
      }
    }
    
    // Резервний варіант - SimpleBlockchainIntegration
    if (!integrationToUse && typeof window.SimpleBlockchainIntegration !== 'undefined') {
      console.log('🔄 Using SimpleBlockchainIntegration...');
      statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Connecting to blockchain...</div>';
      
      try {
        const initialized = await window.SimpleBlockchainIntegration.initialize(provider);
        if (initialized) {
          integrationToUse = window.SimpleBlockchainIntegration;
          integrationName = 'Simple Blockchain Integration';
          console.log('✅ SimpleBlockchainIntegration ready');
        }
      } catch (error) {
        console.error('❌ SimpleBlockchainIntegration failed:', error.message);
      }
    }
    
    if (!integrationToUse) {
      throw new Error('❌ No blockchain integration available. Please refresh the page and try again.');
    }
    
    console.log(`✅ Using ${integrationName}`);
    statusDiv.innerHTML = '<div style="color: #f39c12;">📝 Creating transaction...</div>';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    statusDiv.innerHTML = '<div style="color: #3498db;">⏳ Please sign the transaction in your wallet...</div>';
    
    // Зберігаємо ім'я через інтеграцію
    const result = await integrationToUse.setPlayerName(playerName, walletInfo.address);
    
    if (result.success) {
      // Також зберігаємо локально для швидкого доступу
      localStorage.setItem('playerName', playerName);
      
      const successText = isUpdate ? 'Name updated' : 'Name saved';
      statusDiv.innerHTML = `
        <div style="color: #27ae60;">✅ ${successText} to blockchain successfully!</div>
        <div style="color: #7f8c8d; font-size: 0.9em; margin-top: 5px;">
          TX: ${result.smartContractTxHash ? result.smartContractTxHash.substring(0, 10) + '...' : 'Confirmed'}
        </div>
      `;
      
      console.log('✅ Name saved to blockchain:', {
        playerName: result.playerName,
        txHash: result.smartContractTxHash
      });
      
    } else {
      throw new Error(result.error || 'Transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to save player name:', error);
    const statusDiv = document.getElementById('settings-msg');
    
    if (statusDiv) {
      let errorMessage = error.message;
      
      // Користувацькі повідомлення про помилки
      if (error.message.includes('rejected by user') || error.message.includes('User rejected')) {
        errorMessage = '❌ Transaction cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient funds for transaction fee';
      } else if (error.message.includes('gas') || error.message.includes('UNPREDICTABLE_GAS_LIMIT')) {
        errorMessage = '❌ Transaction failed due to network issues. Please try again.';
      } else if (error.message.includes('No blockchain integration')) {
        errorMessage = '❌ Blockchain connection failed. Please refresh the page.';
      }
      
      statusDiv.innerHTML = `<div style="color: #e74c3c;">${errorMessage}</div>`;
    }
  }
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