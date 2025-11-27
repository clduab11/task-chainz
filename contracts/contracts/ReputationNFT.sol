// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationNFT
 * @dev ERC-721 NFT representing user reputation in the Task-Chainz marketplace
 */
contract ReputationNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter = 1; // Start at 1 to avoid token ID 0 issues
    
    struct ReputationData {
        uint256 tasksCompleted;
        uint256 totalEarned;
        uint256 rating; // Out of 100
        uint256 level;
    }
    
    mapping(uint256 => ReputationData) public reputations;
    mapping(address => uint256) public userTokenId;
    
    event ReputationUpdated(uint256 indexed tokenId, uint256 tasksCompleted, uint256 rating, uint256 level);
    
    constructor() ERC721("TaskChainz Reputation", "TASKR") Ownable(msg.sender) {}
    
    /**
     * @dev Mints a new reputation NFT for a user
     */
    function mintReputation(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        require(userTokenId[to] == 0, "User already has reputation NFT");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        userTokenId[to] = tokenId;
        reputations[tokenId] = ReputationData(0, 0, 50, 1); // Initial rating 50/100, level 1
        
        return tokenId;
    }
    
    /**
     * @dev Updates reputation data after task completion
     */
    function updateReputation(
        address user,
        uint256 tasksCompleted,
        uint256 earned,
        uint256 rating
    ) external onlyOwner {
        uint256 tokenId = userTokenId[user];
        require(tokenId != 0, "User doesn't have reputation NFT");
        
        ReputationData storage rep = reputations[tokenId];
        rep.tasksCompleted += tasksCompleted;
        rep.totalEarned += earned;
        rep.rating = rating;
        rep.level = calculateLevel(rep.tasksCompleted);
        
        emit ReputationUpdated(tokenId, rep.tasksCompleted, rep.rating, rep.level);
    }
    
    /**
     * @dev Calculates user level based on tasks completed
     */
    function calculateLevel(uint256 tasksCompleted) public pure returns (uint256) {
        if (tasksCompleted < 5) return 1;
        if (tasksCompleted < 20) return 2;
        if (tasksCompleted < 50) return 3;
        if (tasksCompleted < 100) return 4;
        return 5;
    }
    
    /**
     * @dev Returns reputation data for a user
     */
    function getUserReputation(address user) external view returns (ReputationData memory) {
        uint256 tokenId = userTokenId[user];
        require(tokenId != 0, "User doesn't have reputation NFT");
        return reputations[tokenId];
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
