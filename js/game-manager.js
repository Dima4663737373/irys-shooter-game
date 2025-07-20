// Game management functionality
export class GameManager {
  constructor(uiManager, walletManager) {
    this.uiManager = uiManager;
    this.walletManager = walletManager;
    this.gameInstance = null;
    this.BubbleShooterGame = null;
  }

  async loadGameModule() {
    if (!this.BubbleShooterGame) {
      try {
        const module = await import('../game/bubbleShooter.js');
        this.BubbleShooterGame = module.BubbleShooterGame;
        console.log('✅ Game module loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load game module:', error);
      }
    }
    return this.BubbleShooterGame;
  }

  async showGame() {
    console.log('showGame: Starting game initialization');

    // Check if wallet is connected
    if (!this.walletManager.isConnected()) {
      alert('Please connect your wallet first to play!');
      return false;
    }

    this.uiManager.setGlobalBackground();

    const content = `
      <div class="game-container">
        <canvas id="gameCanvas"></canvas>
      </div>
    `;

    this.uiManager.smoothTransition(content);

    try {
      // Load game module
      const GameClass = await this.loadGameModule();
      if (!GameClass) {
        throw new Error('Failed to load game module');
      }

      const gameContainer = document.querySelector('.game-container');
      console.log('showGame: Game container found:', gameContainer);

      this.gameInstance = new GameClass(gameContainer);
      console.log('showGame: Game instance created:', this.gameInstance);

      // Modify showModeSelection for blockchain integration
      const originalShowModeSelection = this.gameInstance.showModeSelection.bind(this.gameInstance);
      this.gameInstance.showModeSelection = () => {
        originalShowModeSelection();

        // Add handlers for mode buttons with blockchain transactions
        setTimeout(() => {
          const endlessBtn = document.getElementById('endless-mode');
          const timedBtn = document.getElementById('timed-mode');

          if (endlessBtn) {
            endlessBtn.onclick = () => this.startGameWithTransaction('endless', this.gameInstance);
          }

          if (timedBtn) {
            timedBtn.onclick = () => this.startGameWithTransaction('timed', this.gameInstance);
          }
        }, 100);
      };

      // Start mode selection
      this.gameInstance.showModeSelection();
      console.log('showGame: Mode selection started');

      this.uiManager.setGlobalBackground();
      return true;

    } catch (error) {
      console.error('showGame: Error creating game:', error);
      alert('Failed to load game. Please refresh the page and try again.');
      return false;
    }
  }

  async startGameWithTransaction(gameMode, gameInstance) {
    try {
      console.log(`🚀 Starting ${gameMode} mode with blockchain transaction...`);
      
      const walletInfo = this.walletManager.getWalletInfo();
      console.log('Connected wallet:', walletInfo.wallet);
      console.log('Wallet address:', walletInfo.address);
  
      this.showTransactionModal(gameMode, async () => {
        const statusDiv = document.getElementById('transaction-status');
        
        try {
          // Wait for Irys Network Integration to be available
          statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Loading Irys Network integration...</div>';
          
          // Wait for the integration to be available (max 10 seconds)
          let attempts = 0;
          while (typeof window.IrysNetworkIntegration === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
            attempts++;
          }
          
          if (typeof window.IrysNetworkIntegration === 'undefined') {
            throw new Error('Irys Network integration failed to load. Please refresh the page.');
          }
          
          statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Initializing Irys Network connection...</div>';
          
          // Get the correct provider based on connected wallet
          let provider = window.ethereum;
          if (walletInfo.wallet === 'OKX Wallet' && window.okxwallet) {
            provider = window.okxwallet;
          }
          
          const initialized = await window.IrysNetworkIntegration.initialize(provider);
          if (!initialized) {
            throw new Error("Failed to initialize Irys Network connection");
          }
          
          statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Creating blockchain transaction on Irys Network...</div>';
          
          const result = await window.IrysNetworkIntegration.startGameSession(gameMode, walletInfo.address);
  
          if (result.success) {
            statusDiv.innerHTML = '<div style="color: #27ae60;">✅ Transaction successful on Irys Network!</div>';
            console.log('✅ Transaction successful on Irys Network, starting game...');
            
            window.currentGameSession = result.sessionId;
            
            setTimeout(() => {
              this.hideTransactionModal();
              gameInstance.gameMode = gameMode;
              gameInstance.init();
            }, 1500);
            
          } else {
            throw new Error(result.error || 'Transaction failed');
          }
        } catch (error) {
          console.error('Transaction failed:', error);
          statusDiv.innerHTML = `<div style="color: #e74c3c;">❌ ${error.message}</div>`;
          
          setTimeout(() => {
            this.hideTransactionModal();
          }, 3000);
        }
      });
      
    } catch (error) {
      console.error('Failed to start game with transaction:', error);
      alert('Failed to start game. Please try again.');
    }
  }

  showTransactionModal(gameMode, onConfirm) {
    const modal = document.createElement('div');
    modal.id = 'transaction-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
  
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #00ffff;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        color: #00ffff;
      ">
        <h3 style="margin: 0 0 16px 0; color: #00ffff; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);">Start ${gameMode} Game on Irys Network</h3>
        <p style="margin: 0 0 24px 0; color: #888;">
          This will create a blockchain transaction on Irys Network to start your game session.
          A small fee (~0.0001 IRYS) will be charged.
        </p>
        <div style="background: rgba(0, 255, 255, 0.1); padding: 12px; border-radius: 8px; margin: 16px 0;">
          <div style="color: #888; font-size: 14px;">Network: <span style="color: #00ffff; font-weight: bold;">Irys Network Testnet</span></div>
          <div style="color: #888; font-size: 14px;">Fee: <span style="color: #00ffff; font-weight: bold;">~0.0001 IRYS</span></div>
        </div>
        <div id="transaction-status" style="margin: 16px 0; min-height: 24px;"></div>
        <div style="display: flex; gap: 12px; justify-content: center; width: 100%; flex-wrap: wrap;">
          <button id="confirm-transaction" style="
            padding: 12px 24px;
            background: linear-gradient(45deg, #43cea2, #185a9d);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            flex: 1;
            min-width: 120px;
            max-width: 45%;
          ">Confirm on Irys</button>
          <button id="cancel-transaction" style="
            padding: 12px 24px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            flex: 1;
            min-width: 120px;
            max-width: 45%;
          ">Cancel</button>
        </div>
      </div>
    `;
  
    document.body.appendChild(modal);
  
    document.getElementById('confirm-transaction').onclick = onConfirm;
    document.getElementById('cancel-transaction').onclick = () => this.hideTransactionModal();
  }

  hideTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
      modal.remove();
    }
  }
}