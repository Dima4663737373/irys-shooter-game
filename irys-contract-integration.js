// Irys Network + Smart Contract Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network and smart contract

// Irys Network configuration
const IRYS_CONFIG = {
  // Irys Network settings
  network: "devnet", // or "mainnet" for production
  token: "ethereum",
  
  // Irys Network chain configuration
  chainId: 1270, // Irys Testnet (0x4F6 in hex)
  chainName: 'Irys Testnet',
  rpcUrl: 'https://testnet-rpc.irys.xyz/v1/execution-rpc',
  blockExplorerUrl: 'https://testnet-explorer.irys.xyz/',
  nativeCurrency: {
    name: 'IRYS',
    symbol: 'IRYS',
    decimals: 18
  },
  
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
              chainName: IRYS_CONFIG.chainName,
              nativeCurrency: IRYS_CONFIG.nativeCurrency,
              rpcUrls: [IRYS_CONFIG.rpcUrl],
              blockExplorerUrls: [IRYS_CONFIG.blockExplorerUrl]
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
  
  // Load Irys SDK from CDN
  async loadIrysSDK() {
    return new Promise((resolve, reject) => {
      // Перевіряємо чи SDK вже завантажений
      if (typeof window.Irys !== 'undefined') {
        console.log("✅ Irys SDK already loaded");
        resolve();
        return;
      }

      console.log("🔄 Loading Irys SDK...");
      const script = document.createElement('script');
      
      // Спробуємо альтернативні URL
      const sdkUrls = [
        "https://unpkg.com/@irys/sdk@0.0.15/build/web/bundle.js",
        "https://cdn.jsdelivr.net/npm/@irys/sdk@latest/build/web/bundle.js",
        "https://unpkg.com/@irys/sdk/build/web/bundle.js"
      ];
      
      let currentUrlIndex = 0;
      
      const tryLoadSDK = () => {
        if (currentUrlIndex >= sdkUrls.length) {
          console.error("❌ Failed to load Irys SDK from all sources");
          reject(new Error("Failed to load Irys SDK"));
          return;
        }
        
        script.src = sdkUrls[currentUrlIndex];
        console.log(`🔄 Trying to load SDK from: ${script.src}`);
        
        script.onload = () => {
          console.log("✅ Irys SDK loaded successfully");
          setTimeout(resolve, 500);
        };
        
        script.onerror = () => {
          console.warn(`⚠️ Failed to load SDK from: ${script.src}`);
          currentUrlIndex++;
          tryLoadSDK();
        };
      };
      
      tryLoadSDK();
      document.head.appendChild(script);
    });
  },
  
  // Initialize both Irys and smart contract
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Irys + Smart Contract integration...");
      
      this.provider = provider;
      
      // Switch to Irys Network first
      console.log("🔄 Switching to Irys Network...");
      const networkSwitched = await this.switchToIrysNetwork();
      
      if (!networkSwitched) {
        console.warn("⚠️ Failed to switch to Irys Network, continuing with current network");
      }
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      this.signer = ethersProvider.getSigner();
      
      // Get current network info
      const network = await ethersProvider.getNetwork();
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`);
      
      if (network.chainId === IRYS_CONFIG.chainId) {
        console.log("✅ Successfully connected to Irys Network!");
      } else {
        console.warn(`⚠️ Connected to different network (${network.chainId}), expected Irys (${IRYS_CONFIG.chainId})`);
      }
      
      // Skip Irys SDK loading for now - smart contract works fine without it
      console.log("ℹ️ Skipping Irys SDK loading - using smart contract only mode");
      this.irysInstance = null;
      
      // Create smart contract instance (this is essential)
      this.contract = new ethers.Contract(
        IRYS_CONFIG.contractAddress,
        IRYS_CONFIG.abi,
        this.signer
      );
      
      console.log("✅ Smart Contract integration initialized successfully");
      console.log("ℹ️ Irys available:", this.irysInstance !== null);
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
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      console.log(`🚀 Starting ${gameMode} mode with Smart Contract...`);
      
      // Generate unique session ID
      const sessionId = this.generateSessionId();
      
      let irysTransactionId = 'mock_game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
      
      // Try to upload to Irys if available
      if (this.irysInstance) {
        try {
          console.log("🔄 Uploading game data to Irys...");
          
          // Create game data for Irys
          const gameData = {
            gameMode,
            playerAddress: walletAddress,
            sessionId: sessionId,
            timestamp: Date.now(),
            action: "startGame",
            version: "2.0.0"
          };
          
          const irysResult = await this.uploadGameData(gameData);
          
          if (irysResult.success) {
            irysTransactionId = irysResult.transactionId;
            console.log("✅ Game data uploaded to Irys:", irysTransactionId);
          } else {
            console.warn("⚠️ Irys upload failed, using mock ID");
          }
        } catch (irysError) {
          console.warn("⚠️ Irys upload failed, using mock ID:", irysError.message);
        }
      } else {
        console.log("ℹ️ Irys not available, using mock transaction ID");
      }
      
      // Get game mode fee from smart contract
      const fee = await this.contract.getGameModeFee(gameMode);
      console.log(`💰 Game mode fee: ${ethers.utils.formatEther(fee)} ETH`);
      
      // Start game session on smart contract
      console.log("🔄 Creating smart contract transaction...");
      const tx = await this.contract.startGameSession(
        sessionId, 
        gameMode, 
        irysTransactionId,
        {
          value: fee,
          gasLimit: 300000 // Set gas limit to avoid estimation issues
        }
      );
      
      console.log("🔄 Smart contract transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", tx.hash);
      
      // Wait for transaction to be mined and get multiple confirmations
      const receipt = await tx.wait(3); // Wait for 3 confirmations for better security
      
      console.log("✅ Game session started successfully with confirmations!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Irys transaction ID:", irysTransactionId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysTransactionId,
        sessionId: sessionId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: 3
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
  
  // End game session with both Irys and smart contract
  async endGameSession(sessionId, score, walletAddress) {
    try {
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      console.log(`🏁 Ending game session ${sessionId} with score ${score}`);
      
      let irysTransactionId = 'mock_end_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
      
      // Try to upload to Irys if available
      if (this.irysInstance) {
        try {
          console.log("🔄 Uploading end game data to Irys...");
          
          // Create end game data for Irys
          const endGameData = {
            sessionId: sessionId,
            score: score,
            playerAddress: walletAddress,
            timestamp: Date.now(),
            action: "endGame",
            version: "2.0.0"
          };
          
          const irysResult = await this.uploadGameData(endGameData);
          
          if (irysResult.success) {
            irysTransactionId = irysResult.transactionId;
            console.log("✅ End game data uploaded to Irys:", irysTransactionId);
          } else {
            console.warn("⚠️ Irys upload failed, using mock ID");
          }
        } catch (irysError) {
          console.warn("⚠️ Irys upload failed, using mock ID:", irysError.message);
        }
      } else {
        console.log("ℹ️ Irys not available, using mock transaction ID");
      }
      
      // End game session on smart contract
      console.log("🔄 Ending game session on smart contract...");
      const tx = await this.contract.endGameSession(
        sessionId, 
        score, 
        irysTransactionId,
        {
          gasLimit: 200000
        }
      );
      
      const receipt = await tx.wait();
      
      console.log("✅ Game session ended successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Irys transaction ID:", irysTransactionId);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysTransactionId
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
      if (!this.contract) {
        throw new Error("Smart contract not initialized");
      }
      
      console.log(`🔄 Setting player name: ${playerName}`);
      
      let irysTransactionId = 'mock_name_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
      
      // Try to upload to Irys if available
      if (this.irysInstance) {
        try {
          console.log("🔄 Uploading name data to Irys...");
          
          // Create name data for Irys
          const nameData = {
            playerName: playerName,
            playerAddress: walletAddress,
            timestamp: Date.now(),
            action: "setPlayerName",
            version: "2.0.0"
          };
          
          const irysResult = await this.uploadGameData(nameData);
          
          if (irysResult.success) {
            irysTransactionId = irysResult.transactionId;
            console.log("✅ Name data uploaded to Irys:", irysTransactionId);
          } else {
            console.warn("⚠️ Irys upload failed, using mock ID");
          }
        } catch (irysError) {
          console.warn("⚠️ Irys upload failed, using mock ID:", irysError.message);
        }
      } else {
        console.log("ℹ️ Irys not available, using mock transaction ID");
      }
      
      // Set player name on smart contract
      console.log("🔄 Setting player name on smart contract...");
      const tx = await this.contract.setPlayerName(
        playerName,
        irysTransactionId
      );
      
      console.log("🔄 Smart contract transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      console.log("✅ Player name set successfully!");
      console.log("Smart contract transaction hash:", receipt.transactionHash);
      console.log("Irys transaction ID:", irysTransactionId);
      
      // Store name locally as well
      localStorage.setItem('playerName', playerName);
      
      return {
        success: true,
        smartContractTxHash: receipt.transactionHash,
        irysTransactionId: irysTransactionId,
        playerName: playerName
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