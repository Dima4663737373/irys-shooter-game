// Smart Contract Integration for Bubble Shooter Game
// This module handles all interactions with our game smart contract

// Contract configuration (you'll need to deploy the contract and update this)
const CONTRACT_CONFIG = {
  // Using existing Irys contract address from your screenshot
  address: "0x408e041345e00d0121db1c6fe51b1bf705de19f7", // Irys Network contract
  
  // Contract ABI (Application Binary Interface)
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
          "internalType": "string",
          "name": "gameMode",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "GameSessionStarted",
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
        }
      ],
      "name": "endGameSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "gameSessionFee",
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
          "name": "",
          "type": "string"
        }
      ],
      "name": "gameSessions",
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
          "internalType": "string",
          "name": "sessionId",
          "type": "string"
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
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContractStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "_totalSessions",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_contractBalance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_gameSessionFee",
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
        },
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "getPlayerSession",
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
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerHighScores",
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
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "playerSessions",
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
          "internalType": "string",
          "name": "_sessionId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_gameMode",
          "type": "string"
        }
      ],
      "name": "startGameSession",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSessions",
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
          "internalType": "uint256",
          "name": "_newFee",
          "type": "uint256"
        }
      ],
      "name": "updateGameSessionFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

// Main contract integration object
const ContractIntegration = {
  contract: null,
  provider: null,
  signer: null,
  
  // Initialize contract connection
  async initialize(provider) {
    try {
      console.log("🔄 Initializing contract integration...");
      
      this.provider = provider;
      
      // Create ethers provider
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      this.signer = ethersProvider.getSigner();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi,
        this.signer
      );
      
      console.log("✅ Contract integration initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize contract integration:", error);
      return false;
    }
  },
  
  // Start game session with smart contract
  async startGameSession(gameMode, walletAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      console.log(`🚀 Starting ${gameMode} mode with smart contract...`);
      
      // Generate unique session ID
      const sessionId = this.generateSessionId();
      
      // Get current game session fee
      const fee = await this.contract.gameSessionFee();
      console.log(`💰 Game session fee: ${ethers.utils.formatEther(fee)} ETH`);
      
      // Start game session transaction
      const tx = await this.contract.startGameSession(sessionId, gameMode, {
        value: fee
      });
      
      console.log("🔄 Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      console.log("✅ Game session started successfully!");
      console.log("Transaction hash:", receipt.transactionHash);
      
      return {
        success: true,
        transactionId: receipt.transactionHash,
        sessionId: sessionId,
        gameData: {
          gameMode,
          playerAddress: walletAddress,
          sessionId: sessionId,
          timestamp: Date.now()
        }
      };
      
    } catch (error) {
      console.error("❌ Failed to start game session:", error);
      return {
        success: false,
        error: error.message || "Transaction failed"
      };
    }
  },
  
  // End game session and record score
  async endGameSession(sessionId, score) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      console.log(`🏁 Ending game session ${sessionId} with score ${score}`);
      
      const tx = await this.contract.endGameSession(sessionId, score);
      const receipt = await tx.wait();
      
      console.log("✅ Game session ended successfully!");
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.error("❌ Failed to end game session:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get player's high score
  async getPlayerHighScore(playerAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const highScore = await this.contract.getPlayerHighScore(playerAddress);
      return highScore.toNumber();
    } catch (error) {
      console.error("❌ Failed to get player high score:", error);
      return 0;
    }
  },
  
  // Get contract stats
  async getContractStats() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }
      
      const stats = await this.contract.getContractStats();
      return {
        totalSessions: stats._totalSessions.toNumber(),
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
window.ContractIntegration = ContractIntegration;

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("🔄 Contract integration script loaded");
});