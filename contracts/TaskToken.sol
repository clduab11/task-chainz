// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TaskToken
 * @dev ERC-20 token for task completion rewards in the TaskChainz platform
 * @notice This token is minted as rewards when tasks are completed
 */
contract TaskToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 private _totalMinted;

    event TokensMinted(address indexed to, uint256 amount, string reason);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    error ExceedsMaxSupply(uint256 requested, uint256 available);
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @dev Constructor initializes the token with name "TaskChainz Token" and symbol "TASK"
     * @param initialSupply Initial supply to mint to deployer
     */
    constructor(uint256 initialSupply)
        ERC20("TaskChainz Token", "TASK")
        ERC20Permit("TaskChainz Token")
    {
        if (initialSupply > MAX_SUPPLY) {
            revert ExceedsMaxSupply(initialSupply, MAX_SUPPLY);
        }

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
            _totalMinted = initialSupply;
        }
    }

    /**
     * @dev Mint new tokens for task rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param reason Description of why tokens were minted
     */
    function mint(address to, uint256 amount, string calldata reason) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 newTotal = _totalMinted + amount;
        if (newTotal > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - _totalMinted);
        }

        _totalMinted = newTotal;
        _mint(to, amount);

        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Mint tokens without reason (simpler interface)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 newTotal = _totalMinted + amount;
        if (newTotal > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - _totalMinted);
        }

        _totalMinted = newTotal;
        _mint(to, amount);

        emit TokensMinted(to, amount, "");
    }

    /**
     * @dev Add a new minter
     * @param minter Address to grant minting privileges
     */
    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (minter == address(0)) revert ZeroAddress();
        grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter
     * @param minter Address to revoke minting privileges from
     */
    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }

    /**
     * @dev Check if an address has minting privileges
     * @param account Address to check
     * @return bool True if address can mint
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @dev Get remaining mintable supply
     * @return uint256 Amount of tokens that can still be minted
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - _totalMinted;
    }

    /**
     * @dev Get total minted supply (includes burned tokens)
     * @return uint256 Total amount ever minted
     */
    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }
}
