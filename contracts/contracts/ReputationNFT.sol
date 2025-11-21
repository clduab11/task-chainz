// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReputationNFT
 * @dev Soul-bound NFTs representing user reputation and achievements
 *
 * Features:
 * - Non-transferable (soul-bound) tokens
 * - Tiered reputation levels (Bronze, Silver, Gold, Platinum, Diamond)
 * - Achievement badges for milestones
 * - On-chain reputation score tracking
 * - Upgradeable reputation levels
 */
contract ReputationNFT is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");

    uint256 private _tokenIdCounter;

    enum ReputationTier {
        Bronze,    // 0-999 points
        Silver,    // 1000-4999 points
        Gold,      // 5000-19999 points
        Platinum,  // 20000-99999 points
        Diamond    // 100000+ points
    }

    struct ReputationData {
        uint256 score;
        ReputationTier tier;
        uint256 tasksCompleted;
        uint256 tasksCreated;
        uint256 totalEarned;
        uint256 totalStaked;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 lastUpdated;
        mapping(bytes32 => bool) achievements;
    }

    // Mapping from token ID to reputation data
    mapping(uint256 => ReputationData) private _reputationData;

    // Mapping from address to token ID (one NFT per address)
    mapping(address => uint256) private _userTokenId;

    // Achievement definitions
    mapping(bytes32 => Achievement) public achievements;
    bytes32[] public achievementIds;

    struct Achievement {
        string name;
        string description;
        uint256 requiredScore;
        bool exists;
    }

    event ReputationUpdated(uint256 indexed tokenId, address indexed user, uint256 newScore, ReputationTier newTier);
    event AchievementUnlocked(uint256 indexed tokenId, address indexed user, bytes32 achievementId);
    event ReputationNFTMinted(uint256 indexed tokenId, address indexed user);

    constructor() ERC721("TaskChainz Reputation", "TASKR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(REPUTATION_MANAGER_ROLE, msg.sender);

        // Initialize default achievements
        _createAchievement("FIRST_TASK", "First Task", "Complete your first task", 0);
        _createAchievement("TASK_VETERAN", "Task Veteran", "Complete 100 tasks", 1000);
        _createAchievement("TASK_MASTER", "Task Master", "Complete 1000 tasks", 10000);
        _createAchievement("BIG_EARNER", "Big Earner", "Earn 10,000 TASKZ tokens", 5000);
        _createAchievement("DISPUTE_CHAMPION", "Dispute Champion", "Win 50 disputes", 5000);
    }

    /**
     * @dev Mint reputation NFT for a new user
     * @param to Address to mint NFT to
     * @param tokenURI Metadata URI for the NFT
     */
    function mintReputationNFT(address to, string memory tokenURI)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        // Check if user already has NFT (0 is sentinel value since tokenIds start at 1)
        require(_userTokenId[to] == 0, "User already has reputation NFT");
        require(to != address(0), "Invalid address");

        // Increment counter BEFORE assignment so tokenIds start at 1, not 0
        // This allows 0 to be used as sentinel value in _userTokenId mapping
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        _userTokenId[to] = tokenId;

        ReputationData storage data = _reputationData[tokenId];
        data.score = 0;
        data.tier = ReputationTier.Bronze;
        data.lastUpdated = block.timestamp;

        emit ReputationNFTMinted(tokenId, to);

        return tokenId;
    }

    /**
     * @dev Update user's reputation score
     * @param user Address of the user
     * @param scoreChange Change in reputation score (can be negative)
     * @param tasksCompleted Number of tasks completed (increment)
     */
    function updateReputation(
        address user,
        int256 scoreChange,
        uint256 tasksCompleted
    ) external onlyRole(REPUTATION_MANAGER_ROLE) {
        uint256 tokenId = _userTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        ReputationData storage data = _reputationData[tokenId];

        // Update score (prevent underflow)
        if (scoreChange < 0 && uint256(-scoreChange) > data.score) {
            data.score = 0;
        } else {
            data.score = uint256(int256(data.score) + scoreChange);
        }

        // Update tasks completed
        data.tasksCompleted += tasksCompleted;

        // Update tier based on new score
        ReputationTier newTier = _calculateTier(data.score);
        if (newTier != data.tier) {
            data.tier = newTier;
        }

        data.lastUpdated = block.timestamp;

        emit ReputationUpdated(tokenId, user, data.score, data.tier);

        // Check for achievement unlocks
        _checkAchievements(tokenId, user);
    }

    /**
     * @dev Record task statistics
     */
    function recordTaskStats(
        address user,
        uint256 earned,
        bool isCreator
    ) external onlyRole(REPUTATION_MANAGER_ROLE) {
        uint256 tokenId = _userTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        ReputationData storage data = _reputationData[tokenId];

        if (isCreator) {
            data.tasksCreated++;
            data.totalStaked += earned;
        } else {
            data.totalEarned += earned;
        }
    }

    /**
     * @dev Record dispute result
     */
    function recordDisputeResult(address user, bool won)
        external
        onlyRole(REPUTATION_MANAGER_ROLE)
    {
        uint256 tokenId = _userTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        ReputationData storage data = _reputationData[tokenId];

        if (won) {
            data.disputesWon++;
        } else {
            data.disputesLost++;
        }
    }

    /**
     * @dev Calculate reputation tier based on score
     */
    function _calculateTier(uint256 score) private pure returns (ReputationTier) {
        if (score >= 100000) return ReputationTier.Diamond;
        if (score >= 20000) return ReputationTier.Platinum;
        if (score >= 5000) return ReputationTier.Gold;
        if (score >= 1000) return ReputationTier.Silver;
        return ReputationTier.Bronze;
    }

    /**
     * @dev Check and unlock achievements (event-based, off-chain indexing recommended)
     * Only checks specific achievements that can be verified without iteration
     */
    function _checkAchievements(uint256 tokenId, address user) private {
        ReputationData storage data = _reputationData[tokenId];

        // Check specific achievements based on current state without iterating all
        // Use direct verification to avoid gas-intensive loops
        if (!data.achievements["FIRST_TASK"] && data.tasksCompleted >= 1) {
            data.achievements["FIRST_TASK"] = true;
            emit AchievementUnlocked(tokenId, user, "FIRST_TASK");
        }
        if (!data.achievements["TASK_VETERAN"] && data.tasksCompleted >= 100) {
            data.achievements["TASK_VETERAN"] = true;
            emit AchievementUnlocked(tokenId, user, "TASK_VETERAN");
        }
        if (!data.achievements["TASK_MASTER"] && data.tasksCompleted >= 1000) {
            data.achievements["TASK_MASTER"] = true;
            emit AchievementUnlocked(tokenId, user, "TASK_MASTER");
        }
        if (!data.achievements["BIG_EARNER"] && data.totalEarned >= 10000 ether) {
            data.achievements["BIG_EARNER"] = true;
            emit AchievementUnlocked(tokenId, user, "BIG_EARNER");
        }
        if (!data.achievements["DISPUTE_CHAMPION"] && data.disputesWon >= 50) {
            data.achievements["DISPUTE_CHAMPION"] = true;
            emit AchievementUnlocked(tokenId, user, "DISPUTE_CHAMPION");
        }
    }

    /**
     * @dev Create new achievement
     */
    function _createAchievement(
        bytes32 id,
        string memory name,
        string memory description,
        uint256 requiredScore
    ) private {
        achievements[id] = Achievement({
            name: name,
            description: description,
            requiredScore: requiredScore,
            exists: true
        });
        achievementIds.push(id);
    }

    /**
     * @dev Get reputation data for a user
     */
    function getReputationData(address user)
        external
        view
        returns (
            uint256 score,
            ReputationTier tier,
            uint256 tasksCompleted,
            uint256 tasksCreated,
            uint256 totalEarned,
            uint256 disputesWon,
            uint256 disputesLost
        )
    {
        uint256 tokenId = _userTokenId[user];
        require(tokenId != 0, "User has no reputation NFT");

        ReputationData storage data = _reputationData[tokenId];
        return (
            data.score,
            data.tier,
            data.tasksCompleted,
            data.tasksCreated,
            data.totalEarned,
            data.disputesWon,
            data.disputesLost
        );
    }

    /**
     * @dev Check if user has specific achievement
     */
    function hasAchievement(address user, bytes32 achievementId)
        external
        view
        returns (bool)
    {
        uint256 tokenId = _userTokenId[user];
        if (tokenId == 0) return false;
        return _reputationData[tokenId].achievements[achievementId];
    }

    /**
     * @dev Get token ID for a user
     */
    function getUserTokenId(address user) external view returns (uint256) {
        return _userTokenId[user];
    }

    /**
     * @dev Override transfers to make NFTs soul-bound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        require(from == address(0) || to == address(0), "Reputation NFTs are soul-bound");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
