// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TaskChainzToken
 * @dev ERC20 token for Task Chainz platform with minting, burning, and governance features
 *
 * Features:
 * - Fixed maximum supply with controlled minting
 * - Role-based access control for minting
 * - Pausable for emergency stops
 * - ERC20Permit for gasless approvals
 * - Burnable for deflationary mechanics
 */
contract TaskChainzToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million initial

    // Vesting schedule for team tokens
    mapping(address => VestingSchedule) public vestingSchedules;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
    }

    event TokensVested(address indexed beneficiary, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);

    constructor() ERC20("TaskChainz Token", "TASKZ") ERC20Permit("TaskChainz Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Pause token transfers (only PAUSER_ROLE)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers (only PAUSER_ROLE)
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Create a vesting schedule for an address
     * @param beneficiary Address that will receive vested tokens
     * @param amount Total amount to vest
     * @param duration Duration of vesting in seconds
     * @param cliffDuration Cliff period before vesting starts
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        uint256 cliffDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(cliffDuration < duration, "Cliff must be < duration");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule already exists");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliffDuration: cliffDuration
        });

        // Transfer tokens to this contract for vesting
        _transfer(msg.sender, address(this), amount);

        emit VestingScheduleCreated(beneficiary, amount, duration);
    }

    /**
     * @dev Release vested tokens to beneficiary
     */
    function releaseVestedTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");

        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;

        require(releasableAmount > 0, "No tokens to release");

        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), msg.sender, releasableAmount);

        emit TokensVested(msg.sender, releasableAmount);
    }

    /**
     * @dev Calculate vested amount for a schedule
     */
    function _calculateVestedAmount(VestingSchedule memory schedule) private view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }

        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeVested) / schedule.duration;
    }

    /**
     * @dev Get releasable amount for a beneficiary
     */
    function getReleasableAmount(address beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) return 0;

        uint256 vestedAmount = _calculateVestedAmount(schedule);
        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
