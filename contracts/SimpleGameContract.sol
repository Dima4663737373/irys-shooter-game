// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleGameContract
 * @dev Simple contract for testing game transactions in Sepolia testnet
 */
contract SimpleGameContract {
    
    // Game session event
    event GameSessionStarted(
        address indexed player,
        string sessionId,
        string gameMode,
        uint256 timestamp,
        uint256 amount
    );
    
    // Game session counter
    uint256 public totalSessions;
    
    // Minimum fee for game session (very small for testing)
    uint256 public gameSessionFee = 0.001 ether; // 0.001 ETH
    
    // Owner of the contract
    address public owner;
    
    // Mapping to store game sessions
    mapping(string => address) public gameSessions;
    
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
    ) external payable {
        require(msg.value >= gameSessionFee, "Insufficient fee");
        require(bytes(_sessionId).length > 0, "Session ID cannot be empty");
        require(bytes(_gameMode).length > 0, "Game mode cannot be empty");
        require(gameSessions[_sessionId] == address(0), "Session already exists");
        
        // Store the game session
        gameSessions[_sessionId] = msg.sender;
        totalSessions++;
        
        // Emit event
        emit GameSessionStarted(
            msg.sender,
            _sessionId,
            _gameMode,
            block.timestamp,
            msg.value
        );
    }
    
    /**
     * @dev Get total sessions count
     */
    function getTotalSessions() external view returns (uint256) {
        return totalSessions;
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Update game session fee (owner only)
     */
    function updateGameSessionFee(uint256 _newFee) external {
        require(msg.sender == owner, "Only owner can update fee");
        gameSessionFee = _newFee;
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}