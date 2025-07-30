// Leaderboard Smart Contract Integration
class LeaderboardIntegration {
    constructor() {
        // Адреса контракту - оновіть після деплою
        this.contractAddress = "0xb2eA84Ac0ffFcE45B301B84Efff88858e588D235"; // GameContract deployed on Irys testnet
        
        this.contractABI = [
            {
                "inputs": [
                    {"internalType": "uint256", "name": "score", "type": "uint256"},
                    {"internalType": "string", "name": "playerName", "type": "string"},
                    {"internalType": "string", "name": "gameMode", "type": "string"}
                ],
                "name": "saveScore",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
                "name": "getLeaderboard",
                "outputs": [{
                    "components": [
                        {"internalType": "address", "name": "player", "type": "address"},
                        {"internalType": "string", "name": "playerName", "type": "string"},
                        {"internalType": "uint256", "name": "score", "type": "uint256"},
                        {"internalType": "string", "name": "gameMode", "type": "string"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "bool", "name": "claimed", "type": "bool"}
                    ],
                    "internalType": "struct GameContract.LeaderboardEntry",
                    "name": "",
                    "type": "tuple"
                }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "limit", "type": "uint256"}],
                "name": "getTopPlayers",
                "outputs": [{
                    "components": [
                        {"internalType": "address", "name": "player", "type": "address"},
                        {"internalType": "string", "name": "playerName", "type": "string"},
                        {"internalType": "uint256", "name": "score", "type": "uint256"},
                        {"internalType": "string", "name": "gameMode", "type": "string"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "bool", "name": "claimed", "type": "bool"}
                    ],
                    "internalType": "struct GameContract.LeaderboardEntry[]",
                    "name": "",
                    "type": "tuple[]"
                }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTotalPlayers",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
                    {"indexed": false, "internalType": "string", "name": "playerName", "type": "string"},
                    {"indexed": false, "internalType": "uint256", "name": "score", "type": "uint256"},
                    {"indexed": false, "internalType": "string", "name": "gameMode", "type": "string"},
                    {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "name": "ScoreSaved",
                "type": "event"
            }
        ];
        this.contract = null;
        this.web3 = null;
        this.isInitialized = false;
    }

    // Метод для оновлення адреси контракту
    setContractAddress(address) {
        this.contractAddress = address;
        this.isInitialized = false;
        console.log('📍 Адреса контракту оновлена:', address);
    }

    // Перевірка та переключення на Irys testnet
    async ensureIrysNetwork() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('❌ MetaMask не знайдено');
            }

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const irysChainId = '0x4F6'; // 1270 в hex
            
            if (chainId !== irysChainId) {
                console.log('🔄 Переключення на Irys testnet...');
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: irysChainId }]
                    });
                } catch (switchError) {
                    // Якщо мережа не додана, додаємо її
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: irysChainId,
                                chainName: 'Irys Testnet',
                                nativeCurrency: {
                                    name: 'IRYS',
                                    symbol: 'IRYS',
                                    decimals: 18
                                },
                                rpcUrls: [
                                    'https://testnet-rpc.irys.xyz/v1/execution-rpc',
                                    'https://rpc.testnet.irys.xyz',
                                    'https://irys-testnet.rpc.thirdweb.com'
                                ],
                                blockExplorerUrls: ['https://testnet-explorer.irys.xyz/']
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            console.log('✅ Підключено до Irys testnet');
            return true;
        } catch (error) {
            console.error('❌ Помилка переключення мережі:', error);
            throw error;
        }
    }

    // Ініціалізація з резервними RPC endpoints
    async initialize() {
        try {
            if (this.contractAddress === "0x0000000000000000000000000000000000000000") {
                throw new Error('❌ Адреса контракту не встановлена! Використайте setContractAddress()');
            }

            if (typeof window.ethereum !== 'undefined') {
                // Переконуємося, що підключені до правильної мережі
                await this.ensureIrysNetwork();
                
                this.web3 = new Web3(window.ethereum);
                this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                
                // Перевіряємо, чи контракт існує з обробкою помилок RPC
                const contractExists = await this.verifyContractWithFallback();
                if (!contractExists) {
                    console.warn('⚠️ Не вдалося перевірити контракт через проблеми з RPC. Продовжуємо роботу...');
                }
                
                this.isInitialized = true;
                console.log('✅ Лідерборд ініціалізовано успішно на Irys testnet');
                return true;
            }
            console.warn('⚠️ MetaMask не знайдено - лідерборд буде працювати в режимі тільки для читання');
            this.isInitialized = false;
            return false;
        } catch (error) {
            console.error('❌ Помилка ініціалізації:', error);
            // Навіть якщо є помилки RPC, дозволяємо продовжити роботу
            if (error.message.includes('521') || error.message.includes('HTTP request failed')) {
                console.warn('⚠️ Проблеми з RPC сервером, але продовжуємо роботу в обмеженому режимі');
                this.isInitialized = true;
                return true;
            }
            this.isInitialized = false;
            return false;
        }
    }

    // Перевірка контракту з резервними RPC
    async verifyContractWithFallback() {
        const rpcUrls = [
            'https://testnet-rpc.irys.xyz/v1/execution-rpc',
            'https://rpc.testnet.irys.xyz',
            'https://irys-testnet.rpc.thirdweb.com'
        ];

        for (const rpcUrl of rpcUrls) {
            try {
                console.log(`🔄 Спроба перевірки контракту через ${rpcUrl}...`);
                const tempWeb3 = new Web3(rpcUrl);
                const code = await tempWeb3.eth.getCode(this.contractAddress);
                if (code === '0x') {
                    console.warn(`⚠️ Контракт не знайдено за адресою ${this.contractAddress}`);
                    return false;
                }
                console.log(`✅ Контракт підтверджено через ${rpcUrl}`);
                return true;
            } catch (error) {
                console.warn(`⚠️ RPC ${rpcUrl} недоступний:`, error.message);
                continue;
            }
        }
        
        console.warn('⚠️ Всі RPC endpoints недоступні, але продовжуємо роботу');
        return false;
    }

    // Підключення гаманця
    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Переконуємося, що підключені до правильної мережі
                await this.ensureIrysNetwork();
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                // Ініціалізуємо web3 якщо ще не ініціалізовано
                if (!this.web3) {
                    this.web3 = new Web3(window.ethereum);
                }
                
                const accounts = await this.web3.eth.getAccounts();
                console.log('🔗 Гаманець підключено до Irys testnet:', accounts[0]);
                return accounts[0];
            }
            throw new Error('❌ MetaMask не знайдено');
        } catch (error) {
            console.error('❌ Помилка підключення гаманця:', error);
            throw error;
        }
    }

    // Збереження рахунку в лідерборд
    async saveScore(score, playerName = '', gameMode = 'endless') {
        try {
            if (!this.isInitialized) {
                throw new Error('❌ Лідерборд не ініціалізовано');
            }

            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                throw new Error('❌ Гаманець не підключено');
            }

            const account = accounts[0];
            
            // Отримуємо ім'я з localStorage якщо не передано
            const finalPlayerName = playerName || localStorage.getItem('playerName') || 'Anonymous';
            
            console.log('💾 Збереження рахунку:', score, 'для гравця:', finalPlayerName, 'режим:', gameMode);
            
            // Виклик функції saveScore з новими параметрами
            const result = await this.contract.methods.saveScore(score, finalPlayerName, gameMode).send({
                from: account,
                gas: 400000 // Збільшуємо газ для додаткових параметрів
            });

            console.log('✅ Рахунок збережено:', result.transactionHash);
            return result;
        } catch (error) {
            console.error('❌ Помилка збереження рахунку:', error);
            throw error;
        }
    }

    // Отримання рахунку гравця
    async getPlayerScore(playerAddress) {
        try {
            if (!this.isInitialized) {
                throw new Error('❌ Лідерборд не ініціалізовано');
            }

            const result = await this.contract.methods.getLeaderboard(playerAddress).call();
            return {
                player: result.player,
                playerName: result.playerName,
                score: parseInt(result.score),
                gameMode: result.gameMode,
                timestamp: parseInt(result.timestamp),
                claimed: result.claimed
            };
        } catch (error) {
            console.error('❌ Помилка отримання рахунку:', error);
            throw error;
        }
    }

    // Отримання топ гравців з резервними RPC
    async getTopPlayers(limit = 10) {
        try {
            if (!this.isInitialized) {
                throw new Error('❌ Лідерборд не ініціалізовано');
            }

            // Спробуємо отримати дані через поточне підключення
            try {
                const result = await this.contract.methods.getTopPlayers(limit).call();
                return result.map(entry => ({
                    player: entry.player,
                    playerName: entry.playerName,
                    score: parseInt(entry.score),
                    gameMode: entry.gameMode,
                    timestamp: parseInt(entry.timestamp),
                    claimed: entry.claimed
                })).filter(entry => entry.score > 0);
            } catch (rpcError) {
                if (rpcError.message.includes('521') || rpcError.message.includes('HTTP request failed')) {
                    console.warn('⚠️ Основний RPC недоступний, спробуємо резервні endpoints...');
                    return await this.getTopPlayersWithFallback(limit);
                }
                throw rpcError;
            }
        } catch (error) {
            console.error('❌ Помилка отримання топ гравців:', error);
            // Повертаємо порожній масив замість помилки для кращого UX
            return [];
        }
    }

    // Отримання топ гравців через резервні RPC
    async getTopPlayersWithFallback(limit = 10) {
        const rpcUrls = [
            'https://rpc.testnet.irys.xyz',
            'https://irys-testnet.rpc.thirdweb.com'
        ];

        for (const rpcUrl of rpcUrls) {
            try {
                console.log(`🔄 Спроба отримання даних через ${rpcUrl}...`);
                const tempWeb3 = new Web3(rpcUrl);
                const tempContract = new tempWeb3.eth.Contract(this.contractABI, this.contractAddress);
                const result = await tempContract.methods.getTopPlayers(limit).call();
                console.log(`✅ Дані отримано через ${rpcUrl}`);
                return result.map(entry => ({
                    player: entry.player,
                    playerName: entry.playerName,
                    score: parseInt(entry.score),
                    gameMode: entry.gameMode,
                    timestamp: parseInt(entry.timestamp),
                    claimed: entry.claimed
                })).filter(entry => entry.score > 0);
            } catch (error) {
                console.warn(`⚠️ RPC ${rpcUrl} недоступний для читання:`, error.message);
                continue;
            }
        }
        
        console.warn('⚠️ Всі RPC endpoints недоступні для читання даних');
        return [];
    }

    // Отримання загальної кількості гравців з резервними RPC
    async getTotalPlayers() {
        try {
            if (!this.isInitialized) {
                throw new Error('❌ Лідерборд не ініціалізовано');
            }

            // Спробуємо отримати дані через поточне підключення
            try {
                const result = await this.contract.methods.getTotalPlayers().call();
                return parseInt(result);
            } catch (rpcError) {
                if (rpcError.message.includes('521') || rpcError.message.includes('HTTP request failed')) {
                    console.warn('⚠️ Основний RPC недоступний, спробуємо резервні endpoints...');
                    return await this.getTotalPlayersWithFallback();
                }
                throw rpcError;
            }
        } catch (error) {
            console.error('❌ Помилка отримання кількості гравців:', error);
            // Повертаємо 0 замість помилки для кращого UX
            return 0;
        }
    }

    // Отримання кількості гравців через резервні RPC
    async getTotalPlayersWithFallback() {
        const rpcUrls = [
            'https://rpc.testnet.irys.xyz',
            'https://irys-testnet.rpc.thirdweb.com'
        ];

        for (const rpcUrl of rpcUrls) {
            try {
                console.log(`🔄 Спроба отримання кількості гравців через ${rpcUrl}...`);
                const tempWeb3 = new Web3(rpcUrl);
                const tempContract = new tempWeb3.eth.Contract(this.contractABI, this.contractAddress);
                const result = await tempContract.methods.getTotalPlayers().call();
                console.log(`✅ Кількість гравців отримано через ${rpcUrl}`);
                return parseInt(result);
            } catch (error) {
                console.warn(`⚠️ RPC ${rpcUrl} недоступний для отримання кількості:`, error.message);
                continue;
            }
        }
        
        console.warn('⚠️ Всі RPC endpoints недоступні для отримання кількості гравців');
        return 0;
    }

    async clearAllScores() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            // This would require an admin function in the smart contract
            // For now, we'll throw an error indicating this feature needs contract support
            throw new Error('Clear all scores function requires admin privileges in smart contract');
        } catch (error) {
            console.error('Error clearing all scores:', error);
            throw error;
        }
    }
}

// Експорт для використання
window.LeaderboardIntegration = LeaderboardIntegration;