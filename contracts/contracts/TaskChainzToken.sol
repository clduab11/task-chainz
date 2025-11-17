// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskChainzToken
 * @dev ERC-20 token used for task bounty rewards in the Task-Chainz marketplace
 */
contract TaskChainzToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
    constructor() ERC20("TaskChainz Token", "TASKZ") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Allows owner to mint new tokens for rewards
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burns tokens from caller's account
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
