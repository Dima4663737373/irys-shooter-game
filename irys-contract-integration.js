// Irys Network + Smart Contract Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network and smart contract

// Irys Network configuration
const IRYS_CONFIG = {
  // Irys Network settings
  network: "devnet", // or "mainnet" for production
  token: "ethereum",
  
  // Smart contract configuration (deploy and update this)
  contractAddress: "0xeca153302d9D2e040a4E25F68352Cb001b9625f6", // Updated with deployed contract address
  
  // Contract ABI for IrysGameContract
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "sessionId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "gameMode",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "irysTransactionId",
          "type": "string"
        }
      ],
      "name": "GameSessionStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "sessionId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "irysTransactionId",
          "type": "string"
        }
      ],
      "name": "GameSessionEnded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "sessionId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "GameScoreUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "newName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "updateCount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "irysTransactionId",
          "type": "string"
        }
      ],
      "name": "PlayerNameUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_sessionId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_score",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_irysTransactionId",
          "type": "string"
        }
      ],
      "name": "endGameSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_gameMode",
          "type": "string"
        }
      ],
      "name": "getGameModeFee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_sessionId",
          "type": "string"
        }
      ],
      "name": "getGameSession",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "gameMode",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "irysTransactionId",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerHighScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerSessionCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalGames",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "highScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "averageScore",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_sessionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_gameMode",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_irysTransactionId",
          "type": "string"
        }
      ],
      "name": "startGameSession",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_sessionId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_score",
          "type": "uint256"
        }
      ],
      "name": "updateGameScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_irysTransactionId",
          "type": "string"
        }
      ],
      "name": "setPlayerName",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerName",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_player",
          "type": "address"
        }
      ],
      "name": "getPlayerNameUpdateCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Main integration object
const IrysContractIntegration = {
  irysInstance: null,
  contract: null,
  provider: null,
  signer: null,
  
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
  
  // Initialize both Irys and smart contract
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Irys + Smart Contract integration...");
      
      // Ensure Irys SDK is loaded
      await this.loadIrysSDK();
      
      if (typeof window.Irys === 'undefined') {
        throw new Error("Irys SDK not available after loading");
      }
      
      this.provider = provider;
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      this.signer = ethersProvider.getSigner();
      
      // Create Irys instance
      this.irysInstance = new window.Irys({
        network: IRYS_CONFIG.network,
        token: IRYS_CONFIG.token,
        wallet: provider
      });
      
      // Create smart contract instance
      this.contract = new ethers.Contract(
        IRYS_CONFIG.contractAddress,
        IRYS_CONFIG.abi,
        this.signer
      );
      
      console.log("✅ Irys + Smart Contract integration initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Irys + Smart Contract integration:", error);
      return false;
    }
  },
  
  // Check Irys balance
  async getIrysBalance(address) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }
      
      const balance = await this.irysInstance.getBalance(address);
      console.log(`💰 Irys balance: ${balance} atomic units`);
      return balance;
    } catch (error) {
      console.error("❌ Failed to get Irys balance:", error);
      return 0;
    }
  },
  
  // Fund Irys wallet if needed
  async fundIrysWallet(amount = "1000000000000000") { // 0.001 ETH in wei
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }
      
      console.log(`💸 Funding Irys wallet with ${amount} wei...`);
      const fundTx = await this.irysInstance.fund(amount);
      console.log("✅ Irys wallet funded successfully:", fundTx);
      return fundTx;
    } catch (error) {
      console.error("❌ Failed to fund Irys wallet:", error);
      throw error;
    }
  },
  
  // Upload game data to Irys
  async uploadGameData(gameData) {
    try {
      if (!this.irysInstance) {
        throw new Error("Irys not initialized");
      }
      
      console.log("📤 Uploading game data to Irys...", gameData);
      
      // Convert game data to JSON string
      const dataString = JSON.stringify(gameData);
      
      // Create transaction with tags
      const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "Irys-Shooter" },
        { name: "Game-Mode", value: gameData.gameMode },
        { name: "Player-Address", value: gameData.playerAddress },
        { name: "Session-ID", value: gameData.sessionId },
        { name: "Action", value: gameData.action || "startGame" }
      ];
      
      // Upload data
      const response = await this.irysInstance.upload(dataString, { tags });
      
      console.log("✅ Game data uploaded successfully:", response);
      return {
        success: true,
        transactionId: response.id,
        response: response
      };
      
    } catch (error) {
      console.error("❌ Failed to upload game data:", error);
      throw error;
    }
  },
  
  // Start game session with both Irys and smart contract
  async startGameSession(gameMode, walletAddress) {
    try {
      if (!this.contract || !this.irysInstance) {
        throw new Error("Integration not initialized");
      }
      
      console.log(`🚀 Starting ${gameMode} mode with Irys + Smart Contract...`);
      
      // Generate unique session ID
      const sessionId = this.generateSessionId();
      
      // Create game data for Irys
      const gameData = {
        gameMode,
        playerAddress: walletAddress,
        sessionId: sessionId,
        timestamp: Date.now(),
        action: "startGame",
        version: "2.0.0"
      };
      
      // Upload game data to Irys first
      console.log("🔄 Uploading game data to Irys...");
      const irysResult = await this.uploadGameData(gameData);
      
      if (!irysResult.success) {
        throw new Error("Failed to upload to Irys");
      }
      
      // Get game mode fee from smart contract
      const fee = await this.contract.getGameModeFee(gameMode);
      console.log(`💰 Game mode fee: ${ethers.utils.formatEther(fee)} ETH`);
      
      // Start game session on smart contract with Irys transaction ID
      console.log("🔄 Creating smart contract transaction...");
      const tx = await this.contract.startGameSession(
        sessionId, 
        gameMode, 
        irysResult.transactionId,
        {
          value: fee
        }
      );
      
      console.log("🔄 Smart contract transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      console.log("✅ Game session started successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Irys transaction ID:", irysResult.transactionId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysResult.transactionId,
        sessionId: sessionId,
        gameData: gameData
      };
      
    } catch (error) {
      console.error("❌ Failed to start game session:", error);
      return {
        success: false,
        error: error.message || "Transaction failed"
      };
    }
  },
  
  // End game session with both Irys and smart contract
  async endGameSession(sessionId, score, walletAddress) {
    try {
      if (!this.contract || !this.irysInstance) {
        throw new Error("Integration not initialized");
      }
      
      console.log(`🏁 Ending game session ${sessionId} with score ${score}`);
      
      // Create end game data for Irys
      const endGameData = {
        sessionId: sessionId,
        score: score,
        playerAddress: walletAddress,
        timestamp: Date.now(),
        action: "endGame",
        version: "2.0.0"
      };
      
      // Upload end game data to Irys
      console.log("🔄 Uploading end game data to Irys...");
      const irysResult = await this.uploadGameData(endGameData);
      
      if (!irysResult.success) {
        throw new Error("Failed to upload end game data to Irys");
      }
      
      // End game session on smart contract
      console.log("🔄 Ending game session on smart contract...");
      const tx = await this.contract.endGameSession(
        sessionId, 
        score, 
        irysResult.transactionId
      );
      
      const receipt = await tx.wait();
      
      console.log("✅ Game session ended successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Irys transaction ID:", irysResult.transactionId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysResult.transactionId
      };
      
    } catch (error) {
      console.error("❌ Failed to end game session:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Update game score during play
  async updateGameScore(sessionId, score) {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      console.log(`📊 Updating score for session ${sessionId}: ${score}`);
      
      const tx = await this.contract.updateGameScore(sessionId, score);
      const receipt = await tx.wait();
      
      console.log("✅ Score updated successfully!");
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.error("❌ Failed to update game score:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Set player name with Irys integration
  async setPlayerName(playerName, walletAddress) {
    try {
      if (!this.contract || !this.irysInstance) {
        throw new Error("Integration not initialized");
      }
      
      console.log(`🔄 Setting player name: ${playerName}`);
      
      // Create name data for Irys
      const nameData = {
        playerName: playerName,
        playerAddress: walletAddress,
        timestamp: Date.now(),
        action: "setPlayerName",
        version: "2.0.0"
      };
      
      // Upload name data to Irys first
      console.log("🔄 Uploading name data to Irys...");
      const irysResult = await this.uploadGameData(nameData);
      
      if (!irysResult.success) {
        throw new Error("Failed to upload name data to Irys");
      }
      
      // Set player name on smart contract with Irys transaction ID
      console.log("🔄 Setting player name on smart contract...");
      const tx = await this.contract.setPlayerName(
        playerName,
        irysResult.transactionId
      );
      
      console.log("🔄 Smart contract transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      console.log("✅ Player name set successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Irys transaction ID:", irysResult.transactionId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysResult.transactionId
      };
      
    } catch (error) {
      console.error("❌ Failed to set player name:", error);
      return {
        success: false,
        error: error.message || "Transaction failed"
      };
    }
  },
  
  // Get player name from smart contract
  async getPlayerName(playerAddress) {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      const playerName = await this.contract.getPlayerName(playerAddress);
      return playerName;
    } catch (error) {
      console.error("❌ Failed to get player name:", error);
      return "";
    }
  },
  
  // Get player name update count
  async getPlayerNameUpdateCount(playerAddress) {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      const updateCount = await this.contract.getPlayerNameUpdateCount(playerAddress);
      return updateCount.toNumber();
    } catch (error) {
      console.error("❌ Failed to get player name update count:", error);
      return 0;
    }
  },

  // Get player stats from smart contract
  async getPlayerStats(playerAddress) {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      const stats = await this.contract.getPlayerStats(playerAddress);
      return {
        totalGames: stats.totalGames.toNumber(),
        totalScore: stats.totalScore.toNumber(),
        highScore: stats.highScore.toNumber(),
        averageScore: stats.averageScore.toNumber()
      };
    } catch (error) {
      console.error("❌ Failed to get player stats:", error);
      return null;
    }
  },
  
  // Get contract stats
  async getContractStats() {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      const stats = await this.contract.getContractStats();
      return {
        totalSessions: stats._totalSessions.toNumber(),
        totalVolume: ethers.utils.formatEther(stats._totalVolume),
        contractBalance: ethers.utils.formatEther(stats._contractBalance),
        gameSessionFee: ethers.utils.formatEther(stats._gameSessionFee)
      };
    } catch (error) {
      console.error("❌ Failed to get contract stats:", error);
      return null;
    }
  },
  
  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
};

// Export the integration object
window.IrysContractIntegration = IrysContractIntegration;
console.log("🔄 IrysContractIntegration exported to window:", typeof window.IrysContractIntegration);

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("🔄 Irys Contract integration script loaded and DOM ready");
  console.log("🔍 IrysContractIntegration available:", typeof window.IrysContractIntegration !== 'undefined');
});

// Also log immediately when script executes
console.log("📦 irys-contract-integration.js script executed");