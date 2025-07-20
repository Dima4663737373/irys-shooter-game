// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IrysGameContract
 * @dev Smart contract for Irys Shooter Game on Irys Network
 */
contract IrysGameContract {
    
    // Game session structure
    struct GameSession {
        address player;
        string gameMode;
        uint256 timestamp;
        string sessionId;
        bool isActive;
        uint256 score;
        string irysTransactionId; // Irys transaction ID
    }
    
    // Events
    event GameSessionStarted(
        address indexed player,
        string sessionId,
        string gameMode,
        uint256 timestamp,
        string irysTransactionId
    );
    
    event GameSessionEnded(
        address indexed player,
        string sessionId,
        uint256 score,
        uint256 timestamp,
        string irysTransactionId
    );
    
    event GameScoreUpdated(
        address indexed player,
        string sessionId,
        uint256 score,
        uint256 timestamp
    );
    
    // State variables
    mapping(string => GameSession) public gameSessions;
    mapping(address => string[]) public playerSessions;
    mapping(address => uint256) public playerHighScores;
    mapping(address => uint256) public playerTotalGames;
    mapping(address => uint256) public playerTotalScore;
    
    address public owner;
    uint256 public gameSessionFee = 0.0001 ether; // 0.0001 ETH fee
    uint256 public totalSessions;
    uint256 public totalVolume;
    
    // Game modes and their fees
    mapping(string => uint256) public gameModeFees;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validSessionId(string memory _sessionId) {
        require(bytes(_sessionId).length > 0, "Session ID cannot be empty");
        require(!gameSessions[_sessionId].isActive, "Session already exists");
        _;
    }
    
    modifier sessionExists(string memory _sessionId) {
        require(gameSessions[_sessionId].player != address(0), "Session does not exist");
        _;
    }
    
    modifier onlySessionOwner(string memory _sessionId) {
        require(gameSessions[_sessionId].player == msg.sender, "Only session owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Initialize game mode fees
        gameModeFees["endless"] = 0.0001 ether;
        gameModeFees["timed"] = 0.00015 ether;
        gameModeFees["challenge"] = 0.0002 ether;
    }
    
    /**
     * @dev Start a new game session with Irys transaction ID
     * @param _sessionId Unique session identifier
     * @param _gameMode Game mode (endless, timed, challenge)
     * @param _irysTransactionId Irys transaction ID for this session
     */
    function startGameSession(
        string memory _sessionId,
        string memory _gameMode,
        string memory _irysTransactionId
    ) external payable validSessionId(_sessionId) {
        uint256 requiredFee = gameModeFees[_gameMode];
        require(requiredFee > 0, "Invalid game mode");
        require(msg.value >= requiredFee, "Insufficient fee");
        require(bytes(_gameMode).length > 0, "Game mode cannot be empty");
        require(bytes(_irysTransactionId).length > 0, "Irys transaction ID cannot be empty");
        
        // Create new game session
        gameSessions[_sessionId] = GameSession({
            player: msg.sender,
            gameMode: _gameMode,
            timestamp: block.timestamp,
            sessionId: _sessionId,
            isActive: true,
            score: 0,
            irysTransactionId: _irysTransactionId
        });
        
        // Update player stats
        playerSessions[msg.sender].push(_sessionId);
        playerTotalGames[msg.sender]++;
        totalSessions++;
        totalVolume += msg.value;
        
        emit GameSessionStarted(msg.sender, _sessionId, _gameMode, block.timestamp, _irysTransactionId);
    }
    
    /**
     * @dev End a game session and record score
     * @param _sessionId Session identifier
     * @param _score Final game score
     * @param _irysTransactionId Irys transaction ID for score update
     */
    function endGameSession(
        string memory _sessionId,
        uint256 _score,
        string memory _irysTransactionId
    ) external sessionExists(_sessionId) onlySessionOwner(_sessionId) {
        GameSession storage session = gameSessions[_sessionId];
        require(session.isActive, "Session is not active");
        require(bytes(_irysTransactionId).length > 0, "Irys transaction ID cannot be empty");
        
        // Update session
        session.score = _score;
        session.isActive = false;
        session.irysTransactionId = _irysTransactionId;
        
        // Update player stats
        playerTotalScore[msg.sender] += _score;
        
        // Update high score if needed
        if (_score > playerHighScores[msg.sender]) {
            playerHighScores[msg.sender] = _score;
        }
        
        emit GameSessionEnded(msg.sender, _sessionId, _score, block.timestamp, _irysTransactionId);
    }
    
    /**
     * @dev Update score during active game session
     * @param _sessionId Session identifier
     * @param _score Current game score
     */
    function updateGameScore(
        string memory _sessionId,
        uint256 _score
    ) external sessionExists(_sessionId) onlySessionOwner(_sessionId) {
        GameSession storage session = gameSessions[_sessionId];
        require(session.isActive, "Session is not active");
        
        // Update score
        session.score = _score;
        
        emit GameScoreUpdated(msg.sender, _sessionId, _score, block.timestamp);
    }
    
    /**
     * @dev Get game session details
     * @param _sessionId Session identifier
     */
    function getGameSession(string memory _sessionId) 
        external 
        view 
        returns (
            address player,
            string memory gameMode,
            uint256 timestamp,
            bool isActive,
            uint256 score,
            string memory irysTransactionId
        ) 
    {
        GameSession memory session = gameSessions[_sessionId];
        return (
            session.player,
            session.gameMode,
            session.timestamp,
            session.isActive,
            session.score,
            session.irysTransactionId
        );
    }
    
    /**
     * @dev Get player's session count
     * @param _player Player address
     */
    function getPlayerSessionCount(address _player) external view returns (uint256) {
        return playerSessions[_player].length;
    }
    
    /**
     * @dev Get player's session by index
     * @param _player Player address
     * @param _index Session index
     */
    function getPlayerSession(address _player, uint256 _index) 
        external 
        view 
        returns (string memory) 
    {
        require(_index < playerSessions[_player].length, "Index out of bounds");
        return playerSessions[_player][_index];
    }
    
    /**
     * @dev Get player's high score
     * @param _player Player address
     */
    function getPlayerHighScore(address _player) external view returns (uint256) {
        return playerHighScores[_player];
    }
    
    /**
     * @dev Get player's total stats
     * @param _player Player address
     */
    function getPlayerStats(address _player) 
        external 
        view 
        returns (
            uint256 totalGames,
            uint256 totalScore,
            uint256 highScore,
            uint256 averageScore
        ) 
    {
        totalGames = playerTotalGames[_player];
        totalScore = playerTotalScore[_player];
        highScore = playerHighScores[_player];
        averageScore = totalGames > 0 ? totalScore / totalGames : 0;
    }
    
    /**
     * @dev Get game mode fee
     * @param _gameMode Game mode
     */
    function getGameModeFee(string memory _gameMode) external view returns (uint256) {
        return gameModeFees[_gameMode];
    }
    
    /**
     * @dev Update game mode fee (owner only)
     * @param _gameMode Game mode
     * @param _newFee New fee amount
     */
    function updateGameModeFee(string memory _gameMode, uint256 _newFee) external onlyOwner {
        gameModeFees[_gameMode] = _newFee;
    }
    
    /**
     * @dev Update game session fee (owner only)
     * @param _newFee New fee amount
     */
    function updateGameSessionFee(uint256 _newFee) external onlyOwner {
        gameSessionFee = _newFee;
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalSessions,
            uint256 _totalVolume,
            uint256 _contractBalance,
            uint256 _gameSessionFee
        ) 
    {
        return (totalSessions, totalVolume, address(this).balance, gameSessionFee);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Emergency pause function (owner only)
     */
    function emergencyPause() external onlyOwner {
        // This could be expanded with a pause mechanism
        // For now, just emit an event
        emit GameSessionEnded(address(0), "EMERGENCY_PAUSE", 0, block.timestamp, "");
    }
} 