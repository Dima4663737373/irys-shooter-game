// Irys Network Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network

// Main integration object
const IrysIntegration = {
  irysInstance: null,
  
  // Load Irys SDK from CDN
  async loadIrysSDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof window.Irys !== 'undefined') {
        console.log("✅ Irys SDK already loaded");
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = "https://unpkg.com/@irys/sdk@latest/build/web/bundle.js";
      script.onload = () => {
        console.log("✅ Irys SDK loaded successfully");
        // Wait a bit for the SDK to initialize
        setTimeout(resolve, 500);
      };
      script.onerror = () => {
        console.error("❌ Failed to load Irys SDK");
        reject(new Error("Failed to load Irys SDK"));
      };
      document.head.appendChild(script);
    });
  },
  
  // Initialize Irys connection
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Irys integration...");
      
      // Ensure SDK is loaded
      await this.loadIrysSDK();
      
      // Double check SDK is available
      if (typeof window.Irys === 'undefined') {
        throw new Error("Irys SDK not available after loading");
      }
      
      console.log("🔄 Creating Irys instance...");
      
      // Create Irys instance with simplified configuration
      this.irysInstance = new window.Irys({
        network: "devnet",
        token: "ethereum",
        wallet: provider
      });
      
      console.log("✅ Irys integration initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Irys integration:", error);
      console.error("Error details:", error);
      return false;
    }
  },
  
  // Check wallet balance on Irys
  async getBalance(address) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }
      
      const balance = await this.irysInstance.getBalance(address);
      console.log(`💰 Irys balance: ${balance} atomic units`);
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
  
  // Upload game session data to Irys
  async uploadGameSession(gameData) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }
      
      console.log("📤 Uploading game session to Irys...", gameData);
      
      // Convert game data to JSON string
      const dataString = JSON.stringify(gameData);
      
      // Create transaction with tags
      const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "Irys-Shooter" },
        { name: "Game-Mode", value: gameData.gameMode },
        { name: "Player-Address", value: gameData.playerAddress },
        { name: "Session-ID", value: gameData.sessionId }
      ];
      
      // Upload data
      const response = await this.irysInstance.upload(dataString, { tags });
      
      console.log("✅ Game session uploaded successfully:", response);
      return {
        success: true,
        transactionId: response.id,
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
      
      // Initialize Irys with user's provider
      console.log("🔄 Initializing Irys...");
      const initialized = await this.initialize(provider);
      
      if (!initialized) {
        throw new Error("Failed to initialize Irys");
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