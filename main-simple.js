// Простий main файл без ES6 модулів для Netlify
console.log('🚀 Simple main.js loaded successfully');

// Wallet Manager (inline)
class SimpleWalletManager {
  constructor() {
    this.connectedWallet = null;
    this.walletAddress = null;
    this.checkSavedConnection();
  }

  checkSavedConnection() {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedWallet && savedAddress) {
      this.connectedWallet = savedWallet;
      this.walletAddress = savedAddress;
    }
  }

  async connectWallet(walletType) {
    try {
      let provider = null;
      let walletName = '';

      switch (walletType) {
        case 'metamask':
          if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            provider = window.ethereum;
            walletName = 'MetaMask';
          } else {
            throw new Error('MetaMask not installed');
          }
          break;
        case 'rabby':
          if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
            provider = window.ethereum;
            walletName = 'Rabby Wallet';
          } else {
            throw new Error('Rabby Wallet not installed');
          }
          break;
        case 'okx':
          if (typeof window.okxwallet !== 'undefined') {
            provider = window.okxwallet;
            walletName = 'OKX Wallet';
          } else {
            throw new Error('OKX Wallet not installed');
          }
          break;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        this.connectedWallet = walletName;
        this.walletAddress = accounts[0];
        localStorage.setItem('connectedWallet', walletName);
        localStorage.setItem('walletAddress', this.walletAddress);
        return { success: true, wallet: walletName, address: this.walletAddress };
      } else {
        throw new Error('No accounts found');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  disconnectWallet() {
    this.connectedWallet = null;
    this.walletAddress = null;
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
  }

  isConnected() {
    return this.connectedWallet && this.walletAddress;
  }

  getWalletInfo() {
    return {
      wallet: this.connectedWallet,
      address: this.walletAddress
    };
  }
}

// UI Manager (inline)
class SimpleUIManager {
  constructor() {
    this.app = document.getElementById('app');
  }

  setGlobalBackground() {
    document.body.style.background = "url('/menu-bg.jpg') center center / cover no-repeat fixed";
  }

  smoothTransition(newContent) {
    this.app.style.transition = 'none';
    this.app.style.opacity = '1';
    this.app.innerHTML = newContent;
  }

  playMenuSound() {
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } catch (e) {
        console.warn('Error playing menu sound:', e);
      }
    }
  }

  showMainMenu() {
    this.setGlobalBackground();
    const content = `
      <div class="main-menu" style="min-height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); border: 2px solid #43cea2; border-radius: 18px; padding: 24px 36px; margin: 0 0 32px 0; color: #2193b0; font-size: 2.5rem; font-weight: bold;">Irys Shooter</h1>
        
        <div class="buttons-container" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(15px); border: 3px solid rgba(255,255,255,0.8); border-radius: 24px; padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <button id="play-btn" style="padding: 14px 30px; font-size: 1.1rem; border-radius: 12px; border: none; background: #43cea2; color: #fff; font-weight: bold; cursor: pointer; width: 200px;">🎮 Play</button>
          <button id="connect-wallet-btn" style="padding: 14px 30px; font-size: 1.1rem; border-radius: 12px; border: none; background: #43cea2; color: #fff; font-weight: bold; cursor: pointer; width: 200px;">🔗 Connect Wallet</button>
          <button id="leaderboard-btn" style="padding: 14px 30px; font-size: 1.1rem; border-radius: 12px; border: none; background: #43cea2; color: #fff; font-weight: bold; cursor: pointer; width: 200px;">🏆 Leaderboard</button>
          <button id="settings-btn" style="padding: 14px 30px; font-size: 1.1rem; border-radius: 12px; border: none; background: #43cea2; color: #fff; font-weight: bold; cursor: pointer; width: 200px;">⚙️ Settings</button>
        </div>
      </div>
    `;

    this.smoothTransition(content);

    // Add hover effects
    const buttons = document.querySelectorAll('.main-menu button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        this.playMenuSound();
        button.style.transform = 'scale(1.05) translateY(-2px)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1) translateY(0)';
      });
    });

    return {
      playBtn: document.getElementById('play-btn'),
      connectWalletBtn: document.getElementById('connect-wallet-btn'),
      leaderboardBtn: document.getElementById('leaderboard-btn'),
      settingsBtn: document.getElementById('settings-btn')
    };
  }

  showWalletConnection(walletManager) {
    this.setGlobalBackground();
    const content = `
      <div class="wallet-connection" style="background:#ffffff; border:2px solid #43cea2; border-radius:24px; padding:48px 32px; text-align:center; max-width:420px; margin:0 auto;">
        <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px;">🔗 Connect Wallet</h2>
        
        ${walletManager.isConnected() ? `
          <div style="background:linear-gradient(135deg, #43cea2 0%, #185a9d 100%); border-radius:12px; padding:20px; margin:20px 0; color:white;">
            <h3 style="margin:0 0 10px 0;">✅ Connected</h3>
            <p style="margin:0; font-size:0.9rem;">Wallet: ${walletManager.connectedWallet}</p>
            <p style="margin:5px 0 0 0; font-size:0.8rem; word-break:break-all;">${walletManager.walletAddress}</p>
            <button id="disconnect-btn" style="margin-top:15px; padding:8px 16px; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); border-radius:8px; color:white; cursor:pointer;">Disconnect</button>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:16px; margin:20px 0;">
            <button id="metamask-btn" style="padding:16px 20px; border:2px solid #f6851b; border-radius:12px; background:#f6851b; color:white; font-size:1.1rem; font-weight:bold; cursor:pointer;">🦊 MetaMask</button>
            <button id="rabby-btn" style="padding:16px 20px; border:2px solid #7c3aed; border-radius:12px; background:#7c3aed; color:white; font-size:1.1rem; font-weight:bold; cursor:pointer;">🐰 Rabby Wallet</button>
            <button id="okx-btn" style="padding:16px 20px; border:2px solid #000; border-radius:12px; background:#000; color:white; font-size:1.1rem; font-weight:bold; cursor:pointer;">⚫ OKX Wallet</button>
          </div>
        `}
        
        <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:#43cea2; color:#fff; font-weight:bold; cursor:pointer; margin-top:20px;">Back</button>
        <div id="wallet-status" style="margin-top:20px; padding:10px; border-radius:8px; font-size:0.9rem;"></div>
      </div>
    `;

    this.smoothTransition(content);
    return {
      backBtn: document.getElementById('back-menu'),
      disconnectBtn: document.getElementById('disconnect-btn'),
      metamaskBtn: document.getElementById('metamask-btn'),
      rabbyBtn: document.getElementById('rabby-btn'),
      okxBtn: document.getElementById('okx-btn'),
      statusDiv: document.getElementById('wallet-status')
    };
  }
}

// Game Manager (inline)
class SimpleGameManager {
  constructor(uiManager, walletManager) {
    this.uiManager = uiManager;
    this.walletManager = walletManager;
  }

  async showGame() {
    if (!this.walletManager.isConnected()) {
      alert('Please connect your wallet first to play!');
      return false;
    }

    // Show simple game placeholder
    this.uiManager.setGlobalBackground();
    const content = `
      <div style="text-align: center; padding: 50px; color: white;">
        <h2>🎮 Game Mode Selection</h2>
        <div style="margin: 30px 0;">
          <button id="endless-mode" style="padding: 20px 40px; margin: 10px; font-size: 1.2rem; border: none; border-radius: 12px; background: #43cea2; color: white; cursor: pointer;">🎯 Endless Mode</button>
          <button id="timed-mode" style="padding: 20px 40px; margin: 10px; font-size: 1.2rem; border: none; border-radius: 12px; background: #4096ee; color: white; cursor: pointer;">⏱️ 1 Minute Mode</button>
        </div>
        <button id="back-to-menu" style="padding: 15px 30px; font-size: 1.1rem; border: none; border-radius: 12px; background: #e74c3c; color: white; cursor: pointer;">🏠 Back to Menu</button>
      </div>
    `;

    this.uiManager.smoothTransition(content);

    document.getElementById('endless-mode').onclick = () => this.startGame('endless');
    document.getElementById('timed-mode').onclick = () => this.startGame('timed');
    document.getElementById('back-to-menu').onclick = () => showMainMenu();

    return true;
  }

  async startGame(gameMode) {
    console.log(`🚀 Starting ${gameMode} mode with inline fallback...`);
    
    // Use inline fallback integration
    if (typeof window.SimpleBlockchainIntegration !== 'undefined') {
      try {
        const walletInfo = this.walletManager.getWalletInfo();
        const result = await window.SimpleBlockchainIntegration.startGameSession(gameMode, walletInfo.address);
        
        if (result.success) {
          console.log('✅ Mock transaction successful, starting game...');
          
          // Show game started message
          this.uiManager.smoothTransition(`
            <div style="text-align: center; padding: 50px; color: white;">
              <h2>🎮 Game Started!</h2>
              <p>Mode: ${gameMode}</p>
              <p>Session ID: ${result.sessionId}</p>
              <p>Mock TX: ${result.smartContractTxHash.substring(0, 10)}...</p>
              <div style="margin: 30px 0;">
                <p>🎯 Game would start here with bubble shooter!</p>
                <p>✨ Particle colors now match bubble types</p>
                <p>🔗 Transaction confirmed on blockchain (mock)</p>
              </div>
              <button onclick="showMainMenu()" style="padding: 15px 30px; font-size: 1.1rem; border: none; border-radius: 12px; background: #43cea2; color: white; cursor: pointer;">🏠 Back to Menu</button>
            </div>
          `);
          
          // Store session for later use
          window.currentGameSession = result.sessionId;
        } else {
          throw new Error(result.error || 'Failed to start game');
        }
      } catch (error) {
        console.error('Failed to start game:', error);
        alert('Failed to start game: ' + error.message);
      }
    } else {
      alert('No blockchain integration available');
    }
  }
}

// Global variables
let walletManager, uiManager, gameManager;

// Global functions
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
  uiManager.smoothTransition(`
    <div style="text-align: center; padding: 50px; color: white;">
      <h2>🏆 Leaderboard</h2>
      <p>Leaderboard functionality would be here</p>
      <button onclick="showMainMenu()" style="padding: 15px 30px; font-size: 1.1rem; border: none; border-radius: 12px; background: #43cea2; color: white; cursor: pointer;">🏠 Back to Menu</button>
    </div>
  `);
}

function showSettings() {
  uiManager.smoothTransition(`
    <div style="text-align: center; padding: 50px; color: white;">
      <h2>⚙️ Settings</h2>
      <p>Settings functionality would be here</p>
      <button onclick="showMainMenu()" style="padding: 15px 30px; font-size: 1.1rem; border: none; border-radius: 12px; background: #43cea2; color: white; cursor: pointer;">🏠 Back to Menu</button>
    </div>
  `);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 DOM loaded, initializing simple app...');
  
  // Initialize managers
  walletManager = new SimpleWalletManager();
  uiManager = new SimpleUIManager();
  gameManager = new SimpleGameManager(uiManager, walletManager);
  
  // Show main menu
  showMainMenu();
  
  console.log('✅ Simple app initialized successfully');
});

// Export to global scope for debugging
window.walletManager = walletManager;
window.uiManager = uiManager;
window.gameManager = gameManager;
window.showMainMenu = showMainMenu;