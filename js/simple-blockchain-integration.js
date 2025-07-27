// Irys Network blockchain інтеграція без Irys SDK
// Використовує smart contract на Irys Network для гри

console.log("🔄 Loading Irys Network Integration...");

// Smart contract configuration for Irys Network
const SIMPLE_CONFIG = {
  // Irys Testnet configuration
  chainId: 1270, // Irys Testnet (0x4F6 in hex)
  chainName: 'Irys Testnet',
  rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
  blockExplorerUrl: 'https://testnet-explorer.irys.xyz/',
  nativeCurrency: {
    name: 'IRYS',
    symbol: 'IRYS',
    decimals: 18
  },
  contractAddress: "0xeca153302d9D2e040a4E25F68352Cb001b9625f6",
  
  // Спрощений ABI тільки для необхідних функцій
  abi: [
    {
      "inputs": [
        {"internalType": "string", "name": "sessionId", "type": "string"},
        {"internalType": "string", "name": "gameMode", "type": "string"},
        {"internalType": "string", "name": "irysTransactionId", "type": "string"}
      ],
      "name": "startGameSession",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "sessionId", "type": "string"},
        {"internalType": "uint256", "name": "score", "type": "uint256"},
        {"internalType": "string", "name": "irysTransactionId", "type": "string"}
      ],
      "name": "endGameSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "gameMode", "type": "string"}],
      "name": "getGameModeFee",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Simple Blockchain Integration
const SimpleBlockchainIntegration = {
  contract: null,
  provider: null,
  signer: null,

  // Switch to Irys Network
  async switchToIrysNetwork() {
    try {
      console.log("🔄 Switching to Irys Network...");
      console.log("Please confirm network switch in your wallet...");
      
      // Add timeout for network switch request
      const switchPromise = this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4F6' }], // 1270 in hex
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network switch timeout')), 30000); // 30 second timeout
      });
      
      await Promise.race([switchPromise, timeoutPromise]);
      
      console.log("✅ Switched to Irys Network successfully");
      return true;
    } catch (error) {
      if (error.message === 'Network switch timeout') {
        console.warn("⚠️ Network switch timed out - user may have cancelled");
        return false;
      } else if (error.code === 4001) {
        console.warn("⚠️ User rejected network switch");
        return false;
      } else if (error.code === 4902) {
        // Network not added, try to add it
        console.log("🔄 Adding Irys Network to wallet...");
        console.log("Please confirm adding Irys Network in your wallet...");
        try {
          const addPromise = this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x4F6',
              chainName: SIMPLE_CONFIG.chainName,
              nativeCurrency: SIMPLE_CONFIG.nativeCurrency,
              rpcUrls: [SIMPLE_CONFIG.rpcUrl],
              blockExplorerUrls: [SIMPLE_CONFIG.blockExplorerUrl]
            }]
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Add network timeout')), 30000); // 30 second timeout
          });
          
          await Promise.race([addPromise, timeoutPromise]);
          console.log("✅ Irys Network added and switched successfully");
          return true;
        } catch (addError) {
          if (addError.message === 'Add network timeout') {
            console.warn("⚠️ Add network timed out - user may have cancelled");
          } else if (addError.code === 4001) {
            console.warn("⚠️ User rejected adding network");
          } else {
            console.error("❌ Failed to add Irys Network:", addError);
          }
          return false;
        }
      }
      
      console.error("❌ Failed to switch to Irys Network:", error);
      return false;
    }
  },

  // Initialize connection
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Simple Blockchain Integration...");
      
      // Check if ethers is available
      if (typeof ethers === 'undefined') {
        throw new Error("ethers.js is not available. Please ensure ethers.js is loaded.");
      }
      
      this.provider = provider;
      
      // Switch to Irys Network
      const switched = await this.switchToIrysNetwork();
      if (!switched) {
        throw new Error("Failed to switch to Irys Network");
      }
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      this.signer = ethersProvider.getSigner();
      
      // Verify we're on Irys Network
      const network = await ethersProvider.getNetwork();
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`);
      
      if (network.chainId !== SIMPLE_CONFIG.chainId) {
        throw new Error(`Wrong network. Expected Irys Network (${SIMPLE_CONFIG.chainId}), got ${network.chainId}`);
      }
      
      // Create smart contract instance
      this.contract = new ethers.Contract(
        SIMPLE_CONFIG.contractAddress,
        SIMPLE_CONFIG.abi,
        this.signer
      );
      
      console.log("✅ Simple Blockchain Integration initialized successfully on Irys Network");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Simple Blockchain Integration:", error);
      return false;
    }
  },

  // Generate session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Generate mock Irys transaction ID
  generateMockIrysId() {
    return 'mock_irys_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  },

  // Start game session (simplified without real Irys)
  async startGameSession(gameMode, walletAddress) {
    try {
      if (!this.contract) {
        throw new Error("Integration not initialized");
      }
      
      console.log(`🚀 Starting ${gameMode} game session for ${walletAddress}`);
      
      // Generate unique session ID
      const sessionId = this.generateSessionId();
      
      // Generate mock Irys transaction ID (for testing)
      const mockIrysId = this.generateMockIrysId();
      
      // Get game mode fee from smart contract
      let fee;
      try {
        fee = await this.contract.getGameModeFee(gameMode);
        console.log(`💰 Game mode fee: ${ethers.utils.formatEther(fee)} ETH`);
      } catch (error) {
        console.warn("⚠️ Could not get fee from contract, using default");
        fee = ethers.utils.parseEther("0.001"); // Default 0.001 ETH
      }
      
      // Start game session on smart contract
      console.log("🔄 Creating smart contract transaction...");
      const tx = await this.contract.startGameSession(
        sessionId, 
        gameMode, 
        mockIrysId,
        {
          value: fee,
          gasLimit: 300000 // Set gas limit to avoid estimation issues
        }
      );
      
      console.log("🔄 Smart contract transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log("✅ Game session started successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Mock Irys transaction ID:", mockIrysId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: mockIrysId,
        sessionId: sessionId,
        gameData: {
          gameMode,
          playerAddress: walletAddress,
          timestamp: Date.now(),
          action: "startGame",
          version: "2.0.0"
        }
      };
      
    } catch (error) {
      console.error("❌ Failed to start game session:", error);
      
      // Provide more specific error messages
      let errorMessage = error.message || "Transaction failed";
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.code === -32603) {
        errorMessage = "Internal JSON-RPC error";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      } else if (errorMessage.includes("gas")) {
        errorMessage = "Gas estimation failed or insufficient gas";
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // End game session (simplified)
  async endGameSession(sessionId, score, walletAddress) {
    try {
      if (!this.contract) {
        throw new Error("Integration not initialized");
      }
      
      console.log(`🏁 Ending game session ${sessionId} with score ${score}`);
      
      // Generate mock Irys transaction ID for end game
      const mockIrysId = this.generateMockIrysId();
      
      // End game session on smart contract
      console.log("🔄 Creating end game transaction...");
      const tx = await this.contract.endGameSession(
        sessionId,
        score,
        mockIrysId,
        {
          gasLimit: 200000
        }
      );
      
      console.log("🔄 End game transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      console.log("✅ Game session ended successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: mockIrysId,
        sessionId: sessionId
      };
      
    } catch (error) {
      console.error("❌ Failed to end game session:", error);
      return {
        success: false,
        error: error.message || "Failed to end game session"
      };
    }
  },

  // Check transaction status
  async checkTransactionStatus(txHash) {
    try {
      if (!this.provider) {
        throw new Error("Provider not initialized");
      }
      
      const ethersProvider = new ethers.providers.Web3Provider(this.provider);
      const receipt = await ethersProvider.getTransactionReceipt(txHash);
      
      return {
        confirmed: receipt !== null,
        success: receipt ? receipt.status === 1 : false,
        blockNumber: receipt ? receipt.blockNumber : null
      };
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return {
        confirmed: false,
        success: false,
        error: error.message
      };
    }
  }
};

// Export to global scope
window.SimpleBlockchainIntegration = SimpleBlockchainIntegration;
console.log("✅ Irys Network Integration loaded successfully");
console.log("SimpleBlockchainIntegration available:", typeof window.SimpleBlockchainIntegration !== 'undefined');