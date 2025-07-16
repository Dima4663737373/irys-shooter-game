// Irys Network Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network

// Irys testnet configuration
const IRYS_CONFIG = {
  testnet: {
    node: "https://devnet.irys.xyz",
    currency: "ethereum",
    providerUrl: "https://rpc-mumbai.maticvigil.com" // Polygon Mumbai testnet
  }
};

// Main integration object
const IrysIntegration = {
  // Initialize Irys connection
  async initialize() {
    try {
      console.log("🔄 Initializing Irys integration...");
      
      // Check if Irys SDK is loaded
      if (typeof window.Irys === 'undefined') {
        console.warn("⚠️ Irys SDK not loaded, loading from CDN...");
        
        // Load Irys SDK from CDN
        await this.loadIrysSDK();
      }
      
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
  
  // Start game with Irys transaction
  async startGameWithIrys(gameMode, provider, walletAddress) {
    try {
      console.log(`🚀 Starting ${gameMode} mode with Irys transaction...`);
      
      // Initialize Irys if not already initialized
      if (typeof window.Irys === 'undefined') {
        await this.initialize();
      }
      
      // Create game data to be stored on Irys
      const gameData = {
        gameMode,
        playerAddress: walletAddress,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
        testnet: true
      };
      
      // For testing purposes, we'll simulate a transaction without actually sending funds
      // In a real implementation, this would create an actual transaction on Irys testnet
      console.log("📝 Game data to be stored on Irys:", gameData);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock transaction ID
      const transactionId = "irys_" + Math.random().toString(36).substring(2, 15);
      
      console.log(`✅ Transaction successful! ID: ${transactionId}`);
      
      return {
        success: true,
        transactionId,
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
  // We'll initialize on demand when needed
});