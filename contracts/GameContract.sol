// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GameContract {
    struct LeaderboardEntry {
        address player;
        string playerName;
        uint256 score;
        string gameMode;
        uint256 timestamp;
        bool claimed;
    }

    mapping(address => LeaderboardEntry) private leaderboard;
    address[] public players; // Для отримання списку всіх гравців
    uint256 public totalPlayers;

    event ScoreSaved(address indexed player, string playerName, uint256 score, string gameMode, uint256 timestamp);

    /// @notice Отримати лідерборд запис для конкретного гравця
    function getLeaderboard(address player) external view returns (LeaderboardEntry memory) {
        return leaderboard[player];
    }

    /// @notice Зберегти новий рахунок (якщо він кращий за попередній)
    function saveScore(uint256 score, string memory playerName, string memory gameMode) external returns (bool) {
        LeaderboardEntry storage entry = leaderboard[msg.sender];

        // Initialize the entry if it hasn't been already
        if (entry.player == address(0)) {
            entry.player = msg.sender;
            entry.playerName = playerName;
            entry.score = 0;
            entry.gameMode = gameMode;
            entry.timestamp = 0;
            entry.claimed = false;
            players.push(msg.sender);
            totalPlayers++;
        }

        // Save only if the new score is better
        if (score > entry.score) {
            entry.score = score;
            entry.playerName = playerName;
            entry.gameMode = gameMode;
            entry.timestamp = block.timestamp;
            entry.claimed = false;

            emit ScoreSaved(msg.sender, playerName, score, gameMode, block.timestamp);
            return true;
        }

        return false;
    }

    /// @notice Отримати топ N гравців
    function getTopPlayers(uint256 limit) external view returns (LeaderboardEntry[] memory) {
        require(limit > 0, "Limit must be greater than 0");
        
        uint256 actualLimit = limit > totalPlayers ? totalPlayers : limit;
        LeaderboardEntry[] memory topPlayers = new LeaderboardEntry[](actualLimit);
        
        // Простий алгоритм сортування для невеликої кількості гравців
        for (uint256 i = 0; i < actualLimit; i++) {
            uint256 maxScore = 0;
            uint256 maxIndex = 0;
            
            for (uint256 j = 0; j < players.length; j++) {
                if (leaderboard[players[j]].score > maxScore) {
                    bool alreadyAdded = false;
                    for (uint256 k = 0; k < i; k++) {
                        if (topPlayers[k].player == players[j]) {
                            alreadyAdded = true;
                            break;
                        }
                    }
                    if (!alreadyAdded) {
                        maxScore = leaderboard[players[j]].score;
                        maxIndex = j;
                    }
                }
            }
            
            if (maxScore > 0) {
                topPlayers[i] = leaderboard[players[maxIndex]];
            }
        }
        
        return topPlayers;
    }

    /// @notice Отримати загальну кількість гравців
    function getTotalPlayers() external view returns (uint256) {
        return totalPlayers;
    }
}