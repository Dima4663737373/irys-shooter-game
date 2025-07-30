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
  
  // Show submit score dialog
  if (score > 0) {
    showSubmitScoreDialog(score, gameMode);
  }
}

// Function to show exit confirmation dialog
function showExitConfirmationDialog(score, gameMode = 'endless') {
  const content = `
    <div class="exit-confirmation-dialog" style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid rgba(255,255,255,0.3);
      background-clip: padding-box;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(102,126,234,0.4);
      padding: 40px 36px;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
    ">
      <h2 style="font-size:2rem; color:#ffffff; margin-bottom:24px;">🚪 Exit Game</h2>
      <p style="font-size:1.5rem; color:#43cea2; font-weight:bold; margin-bottom:20px;">Your Score: ${score}</p>
      <p style="color:#ffffff; opacity:0.9; margin-bottom:30px;">Would you like to save your progress before exiting?</p>
      
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        <button id="save-and-exit-btn" style="
          background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s ease;
          min-width: 120px;
          max-width: 140px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">Save & Exit</button>
        <button id="exit-without-save-btn" style="
          background: #e74c3c;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          min-width: 120px;
          max-width: 140px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">Exit Without Saving</button>
        <button id="cancel-exit-btn" style="
          background: #95a5a6;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          min-width: 120px;
          max-width: 140px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">Cancel</button>
      </div>
    </div>
  `;
  
  uiManager.smoothTransition(content);
  
  const saveAndExitBtn = document.getElementById('save-and-exit-btn');
  const exitWithoutSaveBtn = document.getElementById('exit-without-save-btn');
  const cancelExitBtn = document.getElementById('cancel-exit-btn');
  
  saveAndExitBtn.onclick = async () => {
    // Prevent multiple submissions
    if (isSubmittingScore) {
      console.log('Score submission already in progress...');
      return;
    }
    
    // Set submission state and update UI
    isSubmittingScore = true;
    saveAndExitBtn.disabled = true;
    saveAndExitBtn.style.background = '#95a5a6';
    saveAndExitBtn.style.cursor = 'not-allowed';
    saveAndExitBtn.innerHTML = '🔄 Saving...';
    exitWithoutSaveBtn.disabled = true;
    exitWithoutSaveBtn.style.opacity = '0.5';
    cancelExitBtn.disabled = true;
    cancelExitBtn.style.opacity = '0.5';
    
    try {
      await saveGameScore(score, gameMode);
      // Встановлюємо флаг що результат збережено в поточній грі
      if (currentGameInstance && typeof currentGameInstance.scoreSubmitted !== 'undefined') {
        currentGameInstance.scoreSubmitted = true;
        console.log('✅ Score submission flag set in game instance');
      }
    } catch (error) {
      console.log('Blockchain save failed:', error.message);
      alert('Failed to save score: ' + error.message);
    } finally {
      // Reset submission state
      isSubmittingScore = false;
      showMainMenu();
    }
  };
  
  exitWithoutSaveBtn.onclick = () => {
    if (!isSubmittingScore) {
      showMainMenu();
    }
  };
  
  cancelExitBtn.onclick = () => {
    if (!isSubmittingScore) {
      // Return to game - we need to call the game's resume function
      if (typeof window.resumeCurrentGame === 'function') {
        window.resumeCurrentGame();
      }
    }
  };
}

// Variable to track if score submission is in progress
let isSubmittingScore = false;

// Function to show submit score dialog
function showSubmitScoreDialog(score, gameMode = 'endless') {
  const content = `
    <div class="submit-score-dialog" style="
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
      border: 3px solid transparent;
      background-clip: padding-box;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      padding: 40px 36px;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
    ">
      <h2 style="font-size:2rem; color:#333; margin-bottom:24px;">🎮 Game Over!</h2>
      <p style="font-size:1.5rem; color:#43cea2; font-weight:bold; margin-bottom:20px;">Your Score: ${score}</p>
      <p style="color:#666; margin-bottom:30px;">Would you like to submit your score to the blockchain leaderboard?</p>
      
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        <button id="submit-score-btn" style="
          background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s ease;
          min-width: 120px;
          max-width: 140px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">Submit Score</button>
        <button id="skip-submit-btn" style="
          background: #95a5a6;
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          min-width: 120px;
          max-width: 140px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">Skip</button>
      </div>
    </div>
  `;
  
  uiManager.smoothTransition(content);
  
  const submitBtn = document.getElementById('submit-score-btn');
  const skipBtn = document.getElementById('skip-submit-btn');
  
  submitBtn.onclick = async () => {
    // Prevent multiple submissions
    if (isSubmittingScore) {
      console.log('Score submission already in progress...');
      return;
    }
    
    // Set submission state and update UI
    isSubmittingScore = true;
    submitBtn.disabled = true;
    submitBtn.style.background = '#95a5a6';
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.innerHTML = '🔄 Submitting...';
    skipBtn.disabled = true;
    skipBtn.style.opacity = '0.5';
    skipBtn.style.cursor = 'not-allowed';
    
    try {
      await saveGameScore(score, gameMode);
      // Встановлюємо флаг що результат збережено в поточній грі
      if (currentGameInstance && typeof currentGameInstance.scoreSubmitted !== 'undefined') {
        currentGameInstance.scoreSubmitted = true;
        console.log('✅ Score submission flag set in game instance');
      }
    } catch (error) {
      console.log('Blockchain save failed:', error.message);
      alert('Failed to save score: ' + error.message);
    } finally {
      // Reset submission state
      isSubmittingScore = false;
      showMainMenu();
    }
  };
  
  document.getElementById('skip-submit-btn').onclick = () => {
    if (!isSubmittingScore) {
      showMainMenu();
    }
  };
}

// Global variable to store current game instance
let currentGameInstance = null;

// Function to set current game instance
function setCurrentGameInstance(gameInstance) {
  currentGameInstance = gameInstance;
}

// Function to resume current game (called from exit confirmation dialog)
function resumeCurrentGame() {
  if (currentGameInstance && typeof currentGameInstance.resumeFromExitDialog === 'function') {
    console.log('🔄 Resuming game from exit dialog');
    currentGameInstance.resumeFromExitDialog();
    
    // НЕ викликаємо gameManager.showGame() тому що це створить новий екземпляр гри
    // Замість цього просто ховаємо діалог і продовжуємо поточну гру
    console.log('🔄 Game resumed, hiding exit dialog');
  } else {
    console.error('❌ No current game instance or resumeFromExitDialog method not found');
    // Якщо немає екземпляра гри, повертаємося до головного меню
    if (typeof showMainMenu === 'function') {
      showMainMenu();
    }
  }
}

// Export functions for use in game
window.saveToLeaderboard = saveToLeaderboard;
window.showExitConfirmationDialog = showExitConfirmationDialog;
window.resumeCurrentGame = resumeCurrentGame;
window.setCurrentGameInstance = setCurrentGameInstance;
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

// Дублікат функції showLeaderboard видалено

// Дублікат функції showSettings видалено



// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 DOM loaded, initializing app...');
  uiManager.setGlobalBackground();

  const app = document.getElementById('app');
  app.style.transition = 'none';
  app.style.opacity = '1';
  
  showMainMenu();
  
  // Ініціалізація лідерборда
  initializeLeaderboard();
});

// Дублікат функції playMenuSound видалено

// Додаємо слухач для першої взаємодії
document.addEventListener('click', function() {
  document.userHasInteracted = true;
}, { once: true });

// Ініціалізація лідерборда
let leaderboardIntegration = null;
let isLeaderboardEnabled = false;

// Функція ініціалізації лідерборда
async function initializeLeaderboard() {
    try {
        // Check if MetaMask is available
        if (typeof window.ethereum === 'undefined') {
            console.log('⚠️ MetaMask not found, leaderboard will be disabled');
            isLeaderboardEnabled = false;
            return;
        }
        
        leaderboardIntegration = new LeaderboardIntegration();
        
        // GameContract deployed on Irys testnet
        const contractAddress = "0xb2eA84Ac0ffFcE45B301B84Efff88858e588D235";
        
        if (contractAddress !== "0x0000000000000000000000000000000000000000") {
            leaderboardIntegration.setContractAddress(contractAddress);
            await leaderboardIntegration.initialize();
            isLeaderboardEnabled = true;
            console.log('✅ Лідерборд ініціалізовано успішно');
            

        } else {
            console.log('⚠️ Адреса контракту не встановлена');
        }
    } catch (error) {
        console.log('⚠️ Leaderboard initialization failed:', error.message);
        isLeaderboardEnabled = false;
    }
}



// Function to save game score after completion
async function saveGameScore(finalScore, gameMode = 'endless') {
    if (!isLeaderboardEnabled || !leaderboardIntegration) {
        console.log('Leaderboard unavailable');
        return;
    }
    
    try {
        // Connect wallet if needed
        await leaderboardIntegration.connectWallet();
        
        // Get player name from settings
        const playerName = localStorage.getItem('playerName') || 'Anonymous';
        
        // Show saving message
        console.log('Saving score to blockchain...', { score: finalScore, playerName, gameMode });
        
        // Save score with player name and game mode
        const result = await leaderboardIntegration.saveScore(finalScore, playerName, gameMode);
        
        // Show success message
        alert(`Score saved! Transaction: ${result.transactionHash.substring(0, 10)}...`);
        
    } catch (error) {
        console.error('Error saving score:', error);
        
        if (error.message.includes('User denied')) {
            alert('Save cancelled by user');
        } else {
            alert('Save error: ' + error.message);
        }
    }
}

function showLeaderboard() {
  uiManager.setGlobalBackground();

  if (!isLeaderboardEnabled) {
    const content = `
      <div class="leaderboard" style="
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
        border: 3px solid transparent;
        background-clip: padding-box;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        padding: 40px 36px;
        text-align: center;
        max-width: 580px;
        margin: 0 auto;
      ">
        <h2 style="font-size:2rem; color:#333; margin-bottom:24px;">🏆 Leaderboard</h2>
        <p style="color:#666; margin-bottom:20px;">Blockchain leaderboard is not available</p>
        <button id="back-menu" style="padding:14px 28px; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer;">Back</button>
      </div>
    `;
    uiManager.smoothTransition(content);
    document.getElementById('back-menu').onclick = showMainMenu;
    return;
  }

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
      
      <h2 style="font-size:2rem; color:#333; margin-bottom:24px; letter-spacing:1px; position: relative; z-index: 1;">🏆 Leaderboard</h2>
      
      <div id="blockchain-leaderboard-content">Loading...</div>
      
      <div style="margin-top: 20px;">
        <button id="refresh-blockchain-btn" style="
          background: #3742fa;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          margin: 5px;
          font-weight: bold;
        ">Refresh</button>
      </div>
      
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10); position: relative; z-index: 1; margin-top: 20px;">Back</button>
      
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
  
  // Handler for refresh button
  document.getElementById('refresh-blockchain-btn').onclick = () => {
    loadBlockchainLeaderboard();
  };
  
  // Load blockchain leaderboard on initial display
  loadBlockchainLeaderboard();
  
  // Function to load blockchain leaderboard
  async function loadBlockchainLeaderboard() {
    const contentDiv = document.getElementById('blockchain-leaderboard-content');
    if (!contentDiv || !isLeaderboardEnabled) {
      if (contentDiv) contentDiv.innerHTML = '<p style="color: #ff4757; text-align: center;">Blockchain leaderboard unavailable</p>';
      return;
    }
    
    try {
      contentDiv.innerHTML = 'Loading...';
      
      const [topPlayers, totalPlayers] = await Promise.all([
        leaderboardIntegration.getTopPlayers(10),
        leaderboardIntegration.getTotalPlayers()
      ]);
      
      let html = `<p style="text-align: center; margin-bottom: 20px; color: #666;">👥 Total players: ${totalPlayers}</p>`;
      
      if (topPlayers.length === 0) {
        html += '<p style="text-align: center; color: #999;">No results yet</p>';
      } else {
        html += '<div style="max-height: 300px; overflow-y: auto; border-radius: 12px;">';
        html += '<table style="width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.1);">';
        html += '<thead><tr style="background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff;">';
        html += '<th style="padding:16px 12px; text-align:left; font-weight:bold;">#</th>';
        html += '<th style="padding:16px 12px; text-align:left; font-weight:bold;">Player</th>';
        html += '<th style="padding:16px 12px; text-align:center; font-weight:bold;">Score</th>';
        html += '<th style="padding:16px 12px; text-align:center; font-weight:bold;">Mode</th>';
        html += '</tr></thead><tbody>';
        
        topPlayers.forEach((player, index) => {
          const playerName = player.playerName || 'Anonymous';
          const gameMode = player.gameMode || 'endless';
          const modeDisplay = gameMode === 'endless' ? 'Endless' : '1 Minute';
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const rowStyle = index % 2 === 0 ? 'background:#f8f9fa;' : 'background:#fff;';
          
          html += `
            <tr style="${rowStyle}">
              <td style="padding:12px 16px; text-align:center; font-weight:bold; color:#333;">${medal}</td>
              <td style="padding:12px 16px; color:#333; font-weight:bold;">${playerName}</td>
              <td style="padding:12px 16px; text-align:center; font-weight:bold; color:#43cea2;">${player.score.toLocaleString()}</td>
              <td style="padding:12px 16px; text-align:center; color:#666; font-size:0.9rem;">${modeDisplay}</td>
            </tr>
          `;
        });
        
        html += '</tbody></table></div>';
      }
      
      contentDiv.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      contentDiv.innerHTML = '<p style="color: #ff4757; text-align: center;">Error loading data</p>';
    }
  }
  
  // Hidden key combination for clearing leaderboard
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      const password = prompt('Enter admin password to clear leaderboard:');
      
      if (password === 'IrysOwner2024') {
        if (confirm('Admin access confirmed. Are you sure you want to clear the entire leaderboard? This action cannot be undone.')) {
          if (isLeaderboardEnabled && leaderboardIntegration) {
            leaderboardIntegration.clearAllScores().then(() => {
              alert('Blockchain leaderboard cleared successfully!');
              showLeaderboard();
            }).catch(error => {
              alert('Error clearing blockchain leaderboard: ' + error.message);
            });
          } else {
            alert('Blockchain leaderboard is not available.');
          }
        }
      } else if (password !== null) {
        alert('Access denied. Invalid admin password.');
      }
    }
  });
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
      // Зберігаємо ім'я в localStorage
      localStorage.setItem('playerName', name);
      
      const statusDiv = document.getElementById('settings-msg');
      if (statusDiv) {
        statusDiv.innerHTML = '<div style="color: #27ae60;">✅ Player name saved successfully!</div>';
      }
      
      console.log('✅ Player name saved:', name);
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

function playMenuSound() {
  // Перевіряємо чи користувач взаємодіяв зі сторінкою
  if (document.hasStoredGesture || document.userHasInteracted) {
    // Відтворюємо звук
  }
}

// Додаємо слухач для першої взаємодії
document.addEventListener('click', function() {
  document.userHasInteracted = true;
}, { once: true });