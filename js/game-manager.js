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
      
      // Check available integrations
      console.log('Available integrations:');
      console.log('- IrysContractIntegration:', typeof window.IrysContractIntegration !== 'undefined');
      console.log('- SimpleBlockchainIntegration:', typeof window.SimpleBlockchainIntegration !== 'undefined');
      console.log('- Window keys containing "Irys":', Object.keys(window).filter(key => key.toLowerCase().includes('irys')));
      console.log('- All blockchain related keys:', Object.keys(window).filter(key => key.toLowerCase().includes('blockchain') || key.toLowerCase().includes('integration')));
  
      this.showTransactionModal(gameMode, async () => {
        const statusDiv = document.getElementById('transaction-status');
        
        try {
          // Try different integrations with proper fallback
          let integrationToUse = null;
          let integrationName = '';
          
          statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Loading blockchain integration...</div>';
          
          // Get the correct provider based on connected wallet
          let provider = window.ethereum;
          if (walletInfo.wallet === 'OKX Wallet' && window.okxwallet) {
            provider = window.okxwallet;
          }
          
          // Try Irys Contract Integration first
          if (typeof window.IrysContractIntegration !== 'undefined') {
            console.log('🔄 Trying Irys Contract Integration...');
            statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Initializing Irys Contract Integration...</div>';
            
            try {
              const initialized = await window.IrysContractIntegration.initialize(provider);
              if (initialized) {
                integrationToUse = window.IrysContractIntegration;
                integrationName = 'Irys Contract Integration';
                console.log('✅ Irys Contract Integration initialized successfully');
              } else {
                throw new Error('Irys Contract Integration failed to initialize');
              }
            } catch (error) {
              console.warn('⚠️ Irys Contract Integration failed:', error.message);
              console.log('🔄 Falling back to Simple Blockchain Integration...');
            }
          }
          
          // Fallback to Simple Blockchain Integration
          if (!integrationToUse && typeof window.SimpleBlockchainIntegration !== 'undefined') {
            console.log('🔄 Trying Simple Blockchain Integration...');
            statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Switching to Irys Network...</div>';
            
            try {
              const initialized = await window.SimpleBlockchainIntegration.initialize(provider);
              if (initialized) {
                integrationToUse = window.SimpleBlockchainIntegration;
                integrationName = 'Irys Network Integration';
                console.log('✅ Simple Blockchain Integration initialized successfully');
              } else {
                throw new Error('Simple Blockchain Integration failed to initialize');
              }
            } catch (error) {
              console.error('❌ Simple Blockchain Integration failed:', error.message);
            }
          }
          
          // Check if any integration is available
          if (!integrationToUse) {
            // Last resort: check for inline fallback
            if (typeof window.SimpleBlockchainIntegration !== 'undefined') {
              console.log('🔄 Using inline fallback integration...');
              statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Using fallback integration...</div>';
              
              try {
                const initialized = await window.SimpleBlockchainIntegration.initialize(provider);
                if (initialized) {
                  integrationToUse = window.SimpleBlockchainIntegration;
                  integrationName = 'Inline Fallback Integration';
                  console.log('✅ Inline fallback integration initialized successfully');
                } else {
                  throw new Error('Inline fallback integration failed to initialize');
                }
              } catch (error) {
                console.error('❌ Inline fallback integration failed:', error.message);
              }
            }
            
            if (!integrationToUse) {
              throw new Error('No blockchain integration available or all failed to initialize. Please refresh the page and check console for details.');
            }
          }
          
          console.log(`✅ Using ${integrationName}`);
          statusDiv.innerHTML = `<div style="color: #27ae60;">✅ Connected to Irys Network</div>`;
          
          statusDiv.innerHTML = '<div style="color: #f39c12;">🔄 Sending transaction to blockchain...</div>';
          
          // Add a small delay to show the status update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          statusDiv.innerHTML = '<div style="color: #f39c12;">⏳ Waiting for blockchain confirmation...</div>';
          
          // Start the transaction process
          const result = await integrationToUse.startGameSession(gameMode, walletInfo.address);
  
          if (result.success) {
            // Transaction was successfully confirmed in blockchain
            statusDiv.innerHTML = '<div style="color: #27ae60;">✅ Transaction confirmed on blockchain!</div>';
            console.log('✅ Transaction confirmed on blockchain, starting game...');
            console.log('Smart Contract TX:', result.smartContractTxHash);
            console.log('Irys Transaction ID:', result.irysTransactionId);
            
            // Store session info for later use
            window.currentGameSession = result.sessionId;
            
            // Wait a moment to show success message, then start game
            setTimeout(() => {
              this.hideTransactionModal();
              gameInstance.gameMode = gameMode;
              gameInstance.init();
            }, 2000);
            
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
          The game will start only after the transaction is confirmed on the blockchain.
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