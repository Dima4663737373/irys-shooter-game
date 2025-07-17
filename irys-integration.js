// Irys Network Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network

// Irys testnet configuration
const IRYS_CONFIG = {
  testnet: {
    node: "https://devnet.irys.xyz",
    currency: "ethereum",
    providerUrl: "https://rpc-sepolia.org" // Ethereum Sepolia testnet
  }
};

// Main integration object
const IrysIntegration = {
  irysInstance: null,

  // Initialize Irys connection
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Irys integration...");

      // Load Irys SDK if not already loaded
      if (typeof window.Irys === 'undefined') {
        console.warn("⚠️ Irys SDK not loaded, loading from CDN...");
        await this.loadIrysSDK();
      }

      // Create Irys instance with user's wallet
      this.irysInstance = new window.Irys({
        network: "devnet", // Use devnet for testing
        token: "ethereum",
        wallet: {
          provider: provider,
          name: "ethersv5"
        }
      });

      console.log("✅ Irys integration initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Irys integration:", error);
      return false;
    }
  },

  // Load Irys SDK from CDN
  loadIrysSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/@irys/sdk@latest/build/web/bundle.js";
      script.onload = () => {
        console.log("✅ Irys SDK loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.error("❌ Failed to load Irys SDK");
        reject(new Error("Failed to load Irys SDK"));
      };
      document.head.appendChild(script);
    });
  },

  // Check wallet balance on Irys
  async getBalance(address) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }

      const balance = await this.irysInstance.getBalance(address);
      console.log(`💰 Irys balance: ${balance} wei`);
      return balance;
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      return 0;
    }
  },

  // Fund wallet if needed (minimum amount for transaction)
  async fundWallet(amount = "1000000000000000") { // 0.001 ETH in wei
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }

      console.log(`💸 Funding wallet with ${amount} wei...`);
      const fundTx = await this.irysInstance.fund(amount);
      console.log("✅ Wallet funded successfully:", fundTx);
      return fundTx;
    } catch (error) {
      console.error("❌ Failed to fund wallet:", error);
      throw error;
    }
  },

  // Switch to Sepolia testnet
  async switchToSepolia(provider) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet chain ID
      });
      console.log("✅ Switched to Sepolia testnet");
      return true;
    } catch (switchError) {
      // If the chain hasn't been added to the user's wallet, add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://rpc-sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          console.log("✅ Added and switched to Sepolia testnet");
          return true;
        } catch (addError) {
          console.error("❌ Failed to add Sepolia testnet:", addError);
          throw addError;
        }
      }
      console.error("❌ Failed to switch to Sepolia testnet:", switchError);
      throw switchError;
    }
  },

  // Upload game session data to Irys
  async uploadGameSession(gameData) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }

      console.log("📤 Uploading game session to Irys...", gameData);

      // Convert game data to JSON string
      const dataString = JSON.stringify(gameData);

      // Create transaction
      const tx = this.irysInstance.createTransaction(dataString, {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "App-Name", value: "Irys-Shooter" },
          { name: "Game-Mode", value: gameData.gameMode },
          { name: "Player-Address", value: gameData.playerAddress },
          { name: "Session-ID", value: gameData.sessionId }
        ]
      });

      // Sign transaction
      await tx.sign();

      // Upload transaction
      const response = await tx.upload();

      console.log("✅ Game session uploaded successfully:", response);
      return {
        success: true,
        transactionId: tx.id,
        response: response
      };

    } catch (error) {
      console.error("❌ Failed to upload game session:", error);
      throw error;
    }
  },

  // Start game with Irys transaction
  async startGameWithIrys(gameMode, provider, walletAddress) {
    try {
      console.log(`🚀 Starting ${gameMode} mode with Irys transaction...`);

      // First, ensure we're on Sepolia testnet
      console.log("🔄 Checking network...");
      await this.switchToSepolia(provider);

      // Initialize Irys with user's provider
      console.log("🔄 Initializing Irys...");
      await this.initialize(provider);

      // Check balance
      console.log("🔄 Checking Irys balance...");
      const balance = await this.getBalance(walletAddress);

      // If balance is too low, fund the wallet
      if (balance < 1000000000000000) { // Less than 0.001 ETH
        console.log("💰 Balance too low, funding wallet...");
        await this.fundWallet();
      }

      // Create game data to be stored on Irys
      const gameData = {
        gameMode,
        playerAddress: walletAddress,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
        testnet: true,
        version: "1.0.0"
      };

      // Upload game session to Irys
      console.log("🔄 Uploading game session...");
      const result = await this.uploadGameSession(gameData);

      console.log(`✅ Transaction successful! ID: ${result.transactionId}`);

      return {
        success: true,
        transactionId: result.transactionId,
        gameData
      };

    } catch (error) {
      console.error("❌ Failed to start game with Irys:", error);
      return {
        success: false,
        error: error.message || "Transaction failed"
      };
    }
  },

  // Generate a unique session ID
  generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
};

// Export the integration object
window.IrysIntegration = IrysIntegration;

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("🔄 Irys integration script loaded");
});