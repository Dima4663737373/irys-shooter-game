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
    
    event PlayerNameSet(
        address indexed player,
        string newName,
        string oldName,
        uint256 timestamp
    );
    
    // State variables
    mapping(string => GameSession) public gameSessions;
    mapping(address => string[]) public playerSessions;
    mapping(address => uint256) public playerHighScores;
    mapping(address => string) public playerNames; // New: Store player names
    mapping(string => address) public nameToAddress; // New: Prevent duplicate names
    
    address public owner;
    uint256 public gameSessionFee = 0.00000001 ether; // Very small fee
    uint256 public nameChangeFee = 0.00000001 ether; // Fee for changing name
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
     * @dev Set or update player name
     * @param _name New player name (must be unique and non-empty)
     */
    function setPlayerName(string memory _name) external payable {
        require(msg.value >= nameChangeFee, "Insufficient fee for name change");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_name).length <= 32, "Name too long (max 32 characters)");
        
        // Check if name is already taken by another player
        address existingOwner = nameToAddress[_name];
        require(existingOwner == address(0) || existingOwner == msg.sender, "Name already taken");
        
        string memory oldName = playerNames[msg.sender];
        
        // If player had a previous name, free it up
        if (bytes(oldName).length > 0) {
            delete nameToAddress[oldName];
        }
        
        // Set new name
        playerNames[msg.sender] = _name;
        nameToAddress[_name] = msg.sender;
        
        emit PlayerNameSet(msg.sender, _name, oldName, block.timestamp);
    }
    
    /**
     * @dev Get player name by address
     * @param _player Player address
     */
    function getPlayerName(address _player) external view returns (string memory) {
        return playerNames[_player];
    }
    
    /**
     * @dev Get player address by name
     * @param _name Player name
     */
    function getPlayerAddress(string memory _name) external view returns (address) {
        return nameToAddress[_name];
    }
    
    /**
     * @dev Check if name is available
     * @param _name Name to check
     */
    function isNameAvailable(string memory _name) external view returns (bool) {
        return nameToAddress[_name] == address(0);
    }
    
    /**
     * @dev Update name change fee (owner only)
     * @param _newFee New fee amount
     */
    function updateNameChangeFee(uint256 _newFee) external onlyOwner {
        nameChangeFee = _newFee;
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
            uint256 _gameSessionFee,
            uint256 _nameChangeFee
        ) 
    {
        return (totalSessions, address(this).balance, gameSessionFee, nameChangeFee);
    }
}