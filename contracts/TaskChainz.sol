// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./TaskToken.sol";

/**
 * @title TaskChainz
 * @dev Decentralized task management platform with token rewards and IPFS metadata
 * @notice Create tasks, complete them, and earn TASK tokens as rewards
 */
contract TaskChainz is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // Task status enumeration
    enum TaskStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }

    // Task structure
    struct Task {
        uint256 id;
        address creator;
        address assignee;
        string ipfsHash;          // IPFS CID for task metadata (title, description, etc.)
        uint256 reward;
        uint256 deadline;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
        string completionIpfsHash; // IPFS CID for completion proof
    }

    // State variables
    TaskToken public immutable taskToken;
    uint256 private _taskCounter;
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    uint256 public constant MAX_FEE = 1000;     // 10% max fee
    address public feeRecipient;

    // Mappings
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userCreatedTasks;
    mapping(address => uint256[]) public userAssignedTasks;
    mapping(address => uint256) public userCompletedTaskCount;
    mapping(address => uint256) public userTotalEarnings;
    mapping(bytes32 => bool) public usedSignatures;

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        string ipfsHash,
        uint256 reward,
        uint256 deadline
    );
    event TaskAssigned(uint256 indexed taskId, address indexed assignee);
    event TaskCompleted(
        uint256 indexed taskId,
        address indexed assignee,
        string completionIpfsHash,
        uint256 reward
    );
    event TaskCancelled(uint256 indexed taskId, address indexed creator);
    event TaskDisputed(uint256 indexed taskId, address indexed disputer);
    event DisputeResolved(uint256 indexed taskId, bool completedApproved);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event FeeRecipientUpdated(address newRecipient);

    // Errors
    error InvalidTaskId();
    error NotTaskCreator();
    error NotTaskAssignee();
    error InvalidStatus();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error InsufficientReward();
    error ZeroAddress();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error FeeTooHigh();
    error TransferFailed();

    /**
     * @dev Constructor
     * @param _taskToken Address of the TaskToken contract
     * @param _feeRecipient Address to receive platform fees
     */
    constructor(address _taskToken, address _feeRecipient) {
        if (_taskToken == address(0) || _feeRecipient == address(0)) {
            revert ZeroAddress();
        }

        taskToken = TaskToken(_taskToken);
        feeRecipient = _feeRecipient;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }

    /**
     * @dev Create a new task with IPFS metadata
     * @param ipfsHash IPFS CID containing task metadata (title, description, requirements)
     * @param reward Token reward for completing the task
     * @param deadline Unix timestamp deadline for task completion
     * @return taskId The ID of the created task
     */
    function createTask(
        string calldata ipfsHash,
        uint256 reward,
        uint256 deadline
    ) external nonReentrant returns (uint256 taskId) {
        if (bytes(ipfsHash).length == 0) revert InvalidTaskId();
        if (reward == 0) revert InsufficientReward();
        if (deadline <= block.timestamp) revert DeadlinePassed();

        taskId = ++_taskCounter;

        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            assignee: address(0),
            ipfsHash: ipfsHash,
            reward: reward,
            deadline: deadline,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            completedAt: 0,
            completionIpfsHash: ""
        });

        userCreatedTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, ipfsHash, reward, deadline);
    }

    /**
     * @dev Assign yourself to a task
     * @param taskId ID of the task to assign
     */
    function assignTask(uint256 taskId) external {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        if (task.deadline <= block.timestamp) revert DeadlinePassed();

        task.assignee = msg.sender;
        task.status = TaskStatus.InProgress;

        userAssignedTasks[msg.sender].push(taskId);

        emit TaskAssigned(taskId, msg.sender);
    }

    /**
     * @dev Complete a task and submit proof
     * @param taskId ID of the task to complete
     * @param completionIpfsHash IPFS CID containing completion proof
     */
    function completeTask(
        uint256 taskId,
        string calldata completionIpfsHash
    ) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.assignee != msg.sender) revert NotTaskAssignee();
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();
        if (bytes(completionIpfsHash).length == 0) revert InvalidTaskId();

        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.completionIpfsHash = completionIpfsHash;

        // Calculate fee and reward
        uint256 fee = (task.reward * platformFeePercentage) / 10000;
        uint256 netReward = task.reward - fee;

        // Update user stats
        userCompletedTaskCount[msg.sender]++;
        userTotalEarnings[msg.sender] += netReward;

        // Mint rewards
        taskToken.mint(msg.sender, netReward, "Task completion reward");
        if (fee > 0) {
            taskToken.mint(feeRecipient, fee, "Platform fee");
        }

        emit TaskCompleted(taskId, msg.sender, completionIpfsHash, netReward);
    }

    /**
     * @dev Complete task with validator signature (for trusted completion)
     * @param taskId ID of the task
     * @param completionIpfsHash IPFS CID with completion proof
     * @param signature Validator signature approving completion
     */
    function completeTaskWithSignature(
        uint256 taskId,
        string calldata completionIpfsHash,
        bytes calldata signature
    ) external nonReentrant {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.assignee != msg.sender) revert NotTaskAssignee();
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(taskId, msg.sender, completionIpfsHash)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedHash.recover(signature);
        if (!hasRole(VALIDATOR_ROLE, signer)) revert InvalidSignature();

        usedSignatures[ethSignedHash] = true;

        // Complete task
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.completionIpfsHash = completionIpfsHash;

        uint256 fee = (task.reward * platformFeePercentage) / 10000;
        uint256 netReward = task.reward - fee;

        userCompletedTaskCount[msg.sender]++;
        userTotalEarnings[msg.sender] += netReward;

        taskToken.mint(msg.sender, netReward, "Validated task completion");
        if (fee > 0) {
            taskToken.mint(feeRecipient, fee, "Platform fee");
        }

        emit TaskCompleted(taskId, msg.sender, completionIpfsHash, netReward);
    }

    /**
     * @dev Cancel a task (only creator, before assignment)
     * @param taskId ID of the task to cancel
     */
    function cancelTask(uint256 taskId) external {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.creator != msg.sender) revert NotTaskCreator();
        if (task.status != TaskStatus.Open) revert InvalidStatus();

        task.status = TaskStatus.Cancelled;

        emit TaskCancelled(taskId, msg.sender);
    }

    /**
     * @dev Dispute a task (creator can dispute completion)
     * @param taskId ID of the task to dispute
     */
    function disputeTask(uint256 taskId) external {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.creator != msg.sender) revert NotTaskCreator();
        if (task.status != TaskStatus.InProgress) revert InvalidStatus();

        task.status = TaskStatus.Disputed;

        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @dev Resolve a dispute (admin only)
     * @param taskId ID of the disputed task
     * @param approveCompletion True to approve, false to reject completion
     */
    function resolveDispute(
        uint256 taskId,
        bool approveCompletion
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.id == 0) revert InvalidTaskId();
        if (task.status != TaskStatus.Disputed) revert InvalidStatus();

        if (approveCompletion) {
            task.status = TaskStatus.Completed;
            task.completedAt = block.timestamp;

            uint256 fee = (task.reward * platformFeePercentage) / 10000;
            uint256 netReward = task.reward - fee;

            userCompletedTaskCount[task.assignee]++;
            userTotalEarnings[task.assignee] += netReward;

            taskToken.mint(task.assignee, netReward, "Dispute resolved - approved");
            if (fee > 0) {
                taskToken.mint(feeRecipient, fee, "Platform fee");
            }
        } else {
            task.status = TaskStatus.Open;
            task.assignee = address(0);
        }

        emit DisputeResolved(taskId, approveCompletion);
    }

    // View functions

    /**
     * @dev Get task details
     * @param taskId ID of the task
     * @return Task struct with all details
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        if (tasks[taskId].id == 0) revert InvalidTaskId();
        return tasks[taskId];
    }

    /**
     * @dev Get all tasks created by a user
     * @param user Address of the user
     * @return Array of task IDs
     */
    function getUserCreatedTasks(address user) external view returns (uint256[] memory) {
        return userCreatedTasks[user];
    }

    /**
     * @dev Get all tasks assigned to a user
     * @param user Address of the user
     * @return Array of task IDs
     */
    function getUserAssignedTasks(address user) external view returns (uint256[] memory) {
        return userAssignedTasks[user];
    }

    /**
     * @dev Get user statistics
     * @param user Address of the user
     * @return completedCount Number of completed tasks
     * @return totalEarnings Total tokens earned
     */
    function getUserStats(address user) external view returns (
        uint256 completedCount,
        uint256 totalEarnings
    ) {
        return (userCompletedTaskCount[user], userTotalEarnings[user]);
    }

    /**
     * @dev Get total number of tasks
     * @return Total task count
     */
    function totalTasks() external view returns (uint256) {
        return _taskCounter;
    }

    // Admin functions

    /**
     * @dev Update platform fee
     * @param newFeePercentage New fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeePercentage > MAX_FEE) revert FeeTooHigh();
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    /**
     * @dev Update fee recipient
     * @param newRecipient New address to receive fees
     */
    function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @dev Add a validator
     * @param validator Address to grant validator role
     */
    function addValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (validator == address(0)) revert ZeroAddress();
        grantRole(VALIDATOR_ROLE, validator);
    }

    /**
     * @dev Remove a validator
     * @param validator Address to revoke validator role from
     */
    function removeValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VALIDATOR_ROLE, validator);
    }
}
