// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IrysShooterGame
 * @dev Smart contract for Irys Shooter Game sessions
 */
contract IrysShooterGame {
    
    // Game session structure
    struct GameSession {
        address player;
        string gameMode;
        uint256 timestamp;
        string sessionId;
        bool isActive;
        uint256 score;
    }
    
    // Events
    event GameSessionStarted(
        address indexed player,
        string sessionId,
        string gameMode,
        uint256 timestamp
    );
    
    event GameSessionEnded(
        address indexed player,
        string sessionId,
        uint256 score,
        uint256 timestamp
    );
    
    // State variables
    mapping(string => GameSession) public gameSessions;
    mapping(address => string[]) public playerSessions;
    mapping(address => uint256) public playerHighScores;
    
    address public owner;
    uint256 public gameSessionFee = 0.00000001 ether; // Very small fee
    uint256 public totalSessions;
    
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
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Start a new game session
     * @param _sessionId Unique session identifier
     * @param _gameMode Game mode (endless, timed, etc.)
     */
    function startGameSession(
        string memory _sessionId,
        string memory _gameMode
    ) external payable validSessionId(_sessionId) {
        require(msg.value >= gameSessionFee, "Insufficient fee");
        require(bytes(_gameMode).length > 0, "Game mode cannot be empty");
        
        // Create new game session
        gameSessions[_sessionId] = GameSession({
            player: msg.sender,
            gameMode: _gameMode,
            timestamp: block.timestamp,
            sessionId: _sessionId,
            isActive: true,
            score: 0
        });
        
        // Add to player's sessions
        playerSessions[msg.sender].push(_sessionId);
        totalSessions++;
        
        emit GameSessionStarted(msg.sender, _sessionId, _gameMode, block.timestamp);
    }
    
    /**
     * @dev End a game session and record score
     * @param _sessionId Session identifier
     * @param _score Final game score
     */
    function endGameSession(
        string memory _sessionId,
        uint256 _score
    ) external {
        GameSession storage session = gameSessions[_sessionId];
        require(session.player == msg.sender, "Only session owner can end it");
        require(session.isActive, "Session is not active");
        
        // Update session
        session.score = _score;
        session.isActive = false;
        
        // Update high score if needed
        if (_score > playerHighScores[msg.sender]) {
            playerHighScores[msg.sender] = _score;
        }
        
        emit GameSessionEnded(msg.sender, _sessionId, _score, block.timestamp);
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
            uint256 score
        ) 
    {
        GameSession memory session = gameSessions[_sessionId];
        return (
            session.player,
            session.gameMode,
            session.timestamp,
            session.isActive,
            session.score
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
     * @dev Update game session fee (owner only)
     * @param _newFee New fee amount
     */
    function updateGameSessionFee(uint256 _newFee) external onlyOwner {
        gameSessionFee = _newFee;
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
     * @dev Get contract stats
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalSessions,
            uint256 _contractBalance,
            uint256 _gameSessionFee
        ) 
    {
        return (totalSessions, address(this).balance, gameSessionFee);
    }
}