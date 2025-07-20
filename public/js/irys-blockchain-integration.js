// Irys Network Blockchain Integration for Bubble Shooter Game
// This module handles all interactions with Irys Network blockchain

// Irys Network configuration
const IRYS_NETWORK_CONFIG = {
  // Irys Network settings
  network: "testnet", // Use testnet for development
  rpcUrl: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
  chainId: 1270,
  
  // Smart contract configuration on Irys Network
  // Smart contract configuration on Irys Network
  contractAddress: "0x07f1E01C18AF640711091A6fc862732607eBC250", // Замініть на адресу з виводу команди
  
  // Contract ABI for GameContract on Irys Network
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
        }
      ],
      "name": "GameSessionEnded",
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
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Add this at the beginning of the file, before the IRYS_NETWORK_CONFIG

// Handle multiple wallet extensions
function getEthereumProvider() {
  // Wait for wallet extensions to finish loading
  return new Promise((resolve) => {
    const checkProvider = () => {
      if (window.ethereum) {
        console.log('✅ Ethereum provider found:', window.ethereum.constructor.name || 'Unknown');
        
        // If multiple providers exist, prefer MetaMask
        if (window.ethereum.providers && window.ethereum.providers.length > 0) {
          const metamask = window.ethereum.providers.find(provider => provider.isMetaMask);
          if (metamask) {
            console.log('✅ Using MetaMask provider from multiple providers');
            resolve(metamask);
            return;
          }
        }
        
        // Use the main ethereum provider
        resolve(window.ethereum);
      } else {
        console.log('⏳ Waiting for Ethereum provider...');
        setTimeout(checkProvider, 100);
      }
    };
    
    checkProvider();
  });
}

// Main Irys Network integration object
const IrysNetworkIntegration = {
  contract: null,
  provider: null,
  signer: null,
  
  // Add this method for debugging - MOVED INSIDE THE OBJECT
  async checkConnection() {
    console.log("🔍 Checking Irys Network connection status:");
    console.log("- window.ethereum:", !!window.ethereum);
    console.log("- this.provider:", !!this.provider);
    console.log("- this.signer:", !!this.signer);
    console.log("- this.contract:", !!this.contract);
    
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log("- Connected accounts:", accounts);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("- Current chain ID:", chainId, "(expected: 0x4F6)");
      } catch (error) {
        console.log("- Error checking wallet:", error.message);
      }
    }
  },
  
  // Check if ethers is available
  async checkEthersAvailability() {
    return new Promise((resolve) => {
      const checkEthers = () => {
        if (typeof ethers !== 'undefined') {
          console.log('✅ ethers.js is available:', ethers.version);
          resolve(true);
        } else {
          console.log('⏳ Waiting for ethers.js to load...');
          setTimeout(checkEthers, 100);
        }
      };
      
      checkEthers();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (typeof ethers === 'undefined') {
          console.error('❌ ethers.js failed to load within 10 seconds');
          resolve(false);
        }
      }, 10000);
    });
  },
  
  // Add Irys Network to MetaMask
  async addIrysNetworkToWallet() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4F6', // 1270 in hex
          chainName: 'Irys Network Testnet',
          nativeCurrency: {
            name: 'IRYS',
            symbol: 'IRYS',
            decimals: 18
          },
          rpcUrls: [IRYS_NETWORK_CONFIG.rpcUrl],
          blockExplorerUrls: ['https://testnet-explorer.irys.xyz/']
        }]
      });
      console.log("✅ Irys Network added to wallet");
      return true;
    } catch (error) {
      console.error("❌ Failed to add Irys Network to wallet:", error);
      return false;
    }
  },

  // Switch to Irys Network
  // Switch to Irys Network
  async switchToIrysNetwork() {
    try {
      console.log("🔄 Attempting to switch to Irys Network (Chain ID: 1270)...");
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4F6' }] // 1270 in hex
      });
      
      console.log("✅ Successfully switched to Irys Network");
      return true;
    } catch (error) {
      console.log("⚠️ Network switch failed, trying to add network...");
      
      if (error.code === 4902) {
        // Network not added, try to add it
        return await this.addIrysNetworkToWallet();
      }
      
      console.error("❌ Failed to switch to Irys Network:", error);
      return false;
    }
  },
  
  // Initialize Irys Network connection - FIXED VARIABLE REFERENCE
  async initialize(provider) {
    try {
      console.log("🔄 Initializing Irys Network integration...");
      
      // Check if ethers is available first
      const ethersAvailable = await this.checkEthersAvailability();
      if (!ethersAvailable) {
        throw new Error("ethers.js is not available. Please ensure ethers.js is loaded.");
      }
      
      // Get the appropriate provider - FIXED: changed providerOverride to provider
      this.provider = provider || await getEthereumProvider();
      
      if (!this.provider) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }
      
      // Switch to Irys Network
      const switched = await this.switchToIrysNetwork();
      if (!switched) {
        throw new Error("Failed to switch to Irys Network");
      }
      
      // Create ethers provider and signer for Irys Network
      const ethersProvider = new ethers.providers.Web3Provider(this.provider);
      this.signer = ethersProvider.getSigner();
      
      // Verify we're on Irys Network
      const network = await ethersProvider.getNetwork();
      if (network.chainId !== IRYS_NETWORK_CONFIG.chainId) {
        throw new Error(`Wrong network. Expected Irys Network (${IRYS_NETWORK_CONFIG.chainId}), got ${network.chainId}`);
      }
      
      // Create smart contract instance on Irys Network
      this.contract = new ethers.Contract(
        IRYS_NETWORK_CONFIG.contractAddress,
        IRYS_NETWORK_CONFIG.abi,
        this.signer
      );
      
      console.log("✅ Irys Network integration initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Irys Network integration:", error);
      return false;
    }
  },

  // Show transaction details modal before confirming
  async showTransactionDetails(gameMode, fee) {
    return new Promise((resolve) => {
      // Create modal HTML with Irys Network branding
      const modalHTML = `
        <div id="transaction-modal" style="
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
          font-family: 'Orbitron', monospace;
        ">
          <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00ffff;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            color: #00ffff;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          ">
            <h2 style="
              color: #00ffff;
              text-align: center;
              margin-bottom: 25px;
              font-size: 24px;
              text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            ">IRYS NETWORK TRANSACTION</h2>
            
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">NETWORK:</span>
                <span style="color: #00ffff; font-weight: bold;">IRYS TESTNET</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">GAME MODE:</span>
                <span style="color: #00ffff; font-weight: bold;">${gameMode.toUpperCase()}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">GAS PRICE:</span>
                <span style="color: #00ffff;">0.50 GmIRYS</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">GAS USED:</span>
                <span style="color: #00ffff;">21000</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">VALUE:</span>
                <span style="color: #00ffff;">${ethers.utils.formatEther(fee)} IRYS</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">STATUS:</span>
                <span style="color: #00ff00;">✅ Ready</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #888;">EXPLORER:</span>
                <span style="color: #00ffff;">testnet-explorer.irys.xyz</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
              <button id="confirm-tx" style="
                background: linear-gradient(45deg, #00ff00, #00cc00);
                color: #000;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
              ">CONFIRM ON IRYS</button>
              
              <button id="cancel-tx" style="
                background: linear-gradient(45deg, #ff0000, #cc0000);
                color: #fff;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
              ">CANCEL</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to page
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Add event listeners
      document.getElementById('confirm-tx').onclick = () => {
        document.getElementById('transaction-modal').remove();
        resolve(true);
      };
      
      document.getElementById('cancel-tx').onclick = () => {
        document.getElementById('transaction-modal').remove();
        resolve(false);
      };
    });
  },
  
  // Start game session on Irys Network
  // Start game session on Irys Network
  async startGameSession(gameMode, walletAddress) {
    try {
      console.log("🔄 Starting game session on Irys Network...");
      
      // Ensure MetaMask is connected
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Force re-initialization to ensure fresh connection
      console.log("🔄 Force initializing Irys Network connection...");
      this.contract = null;
      this.provider = null;
      this.signer = null;
      
      const initialized = await this.initialize(window.ethereum);
      if (!initialized) {
        throw new Error("Failed to initialize Irys Network connection");
      }
      
      // Double-check that we have a valid contract
      if (!this.contract) {
        throw new Error("Contract not initialized after successful initialization");
      }
      
      // Generate session ID and Irys transaction ID
      const sessionId = this.generateSessionId();
      const irysTransactionId = 'irys_tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      
      // Get game mode fee from contract
      console.log("🔄 Getting game mode fee from Irys Network contract...");
      const fee = await this.contract.getGameModeFee(gameMode);
      
      if (fee.eq(0)) {
        throw new Error(`Invalid game mode: ${gameMode}. Available modes: endless, timed, challenge`);
      }
      
      console.log(`💰 Game mode '${gameMode}' fee: ${ethers.utils.formatEther(fee)} IRYS`);
      
      // ВИДАЛЕНО: Показ модального вікна з деталями транзакції
      // const confirmed = await this.showTransactionDetails(gameMode, fee);
      // if (!confirmed) {
      //   return {
      //     success: false,
      //     error: "Transaction cancelled by user"
      //   };
      // }
      
      // ВІДРАЗУ створюємо та відправляємо транзакцію для підпису
      console.log("🔄 Creating blockchain transaction for user signature...");
      console.log(`📝 Session ID: ${sessionId}`);
      console.log(`🎮 Game Mode: ${gameMode}`);
      console.log(`🆔 Irys Transaction ID: ${irysTransactionId}`);
      console.log(`💰 Fee: ${ethers.utils.formatEther(fee)} IRYS`);
      
      // Створити та підписати транзакцію (відразу викликає MetaMask)
      const tx = await this.contract.startGameSession(
        sessionId, 
        gameMode,
        irysTransactionId,
        {
          value: fee,
          gasLimit: 300000
        }
      );
      
      console.log("✅ Transaction signed by user!");
      console.log(`📋 Transaction hash: ${tx.hash}`);
      
      // 🚀 НЕГАЙНО повертаємо успіх після підпису (не чекаємо підтвердження)
      console.log("🎮 Starting game immediately after signature...");
      
      // Запускаємо підтвердження в фоні (не блокуємо гру)
      tx.wait().then(receipt => {
        console.log("✅ Transaction confirmed in background:", receipt.transactionHash);
        console.log("Explorer URL:", `https://testnet-explorer.irys.xyz/tx/${receipt.transactionHash}`);
      }).catch(error => {
        console.warn("⚠️ Transaction confirmation failed (but game already started):", error);
      });
      
      return {
        success: true,
        network: "Irys Network",
        transactionHash: tx.hash,
        explorerUrl: `https://testnet-explorer.irys.xyz/tx/${tx.hash}`,
        sessionId: sessionId,
        gameMode: gameMode,
        fee: ethers.utils.formatEther(fee),
        irysTransactionId: irysTransactionId,
        pending: true
      };
      
    } catch (error) {
      console.error("❌ Failed to start game session on Irys Network:", error);
      
      // Handle specific error types
      let errorMessage = error.message || "Transaction failed";
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.code === -32603) {
        errorMessage = "Internal JSON-RPC error. Please check your network connection.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient IRYS tokens. Please get testnet tokens from the faucet.";
      } else if (error.message.includes("wrong network")) {
        errorMessage = "Please switch to Irys Network in your wallet.";
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  // End game session on Irys Network
  // End game session on Irys Network
  async endGameSession(sessionId, score) {
    try {
      // Ensure we're connected to Irys Network
      const switched = await this.switchToIrysNetwork();
      if (!switched) {
        throw new Error("Failed to switch to Irys Network");
      }
      
      if (!this.contract) {
        throw new Error("Irys Network contract not initialized");
      }
      
      console.log(`🏁 Ending game session ${sessionId} with score ${score} on Irys Network`);
      
      // End game session on Irys Network smart contract
      console.log("🔄 Ending game session on Irys Network...");
      const tx = await this.contract.endGameSession(sessionId, score);
      
      const receipt = await tx.wait();
      
      console.log("✅ Game session ended successfully on Irys Network!");
      console.log("Irys Network transaction hash:", receipt.transactionHash);
      console.log("Explorer URL:", `https://testnet-explorer.irys.xyz/tx/${receipt.transactionHash}`);
      
      return {
        success: true,
        network: "Irys Network",
        transactionHash: receipt.transactionHash,
        explorerUrl: `https://testnet-explorer.irys.xyz/tx/${receipt.transactionHash}`
      };
      
    } catch (error) {
      console.error("❌ Failed to end game session on Irys Network:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get player stats from Irys Network smart contract
  async getPlayerStats(playerAddress) {
    try {
      if (!this.contract) {
        throw new Error("Irys Network contract not initialized");
      }
      
      const stats = await this.contract.getPlayerStats(playerAddress);
      return {
        totalGames: stats.totalGames.toNumber(),
        totalScore: stats.totalScore.toNumber(),
        highScore: stats.highScore.toNumber(),
        network: "Irys Network"
      };
    } catch (error) {
      console.error("❌ Failed to get player stats from Irys Network:", error);
      return null;
    }
  },
  
  // Generate unique session ID
  generateSessionId() {
    return 'irys_session_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  },
};

// Export the integration object
window.IrysNetworkIntegration = IrysNetworkIntegration;
console.log("🔄 Irys Network integration script loaded");