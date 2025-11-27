// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ReputationNFT.sol";

/**
 * @title TaskManager
 * @dev Manages task creation, assignment, completion, and escrow payments
 *
 * Features:
 * - Task creation with bounty staking
 * - Automated escrow for task payments
 * - Worker assignment and submission
 * - Dispute resolution integration
 * - Platform fee collection
 * - Emergency pause functionality
 */
contract TaskManager is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");

    IERC20 public immutable taskToken;
    ReputationNFT public immutable reputationNFT;

    uint256 public platformFeePercent = 250; // 2.5% (basis points)
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;

    address public feeCollector;

    uint256 private _taskIdCounter;

    enum TaskStatus {
        Open,
        Assigned,
        Submitted,
        Completed,
        Disputed,
        Cancelled
    }

    enum TaskCategory {
        Development,
        Design,
        Writing,
        Marketing,
        Research,
        DataEntry,
        Testing,
        Other
    }

    struct Task {
        uint256 id;
        address creator;
        address worker;
        string ipfsHash; // IPFS hash for task details
        uint256 bounty;
        uint256 deadline;
        TaskStatus status;
        TaskCategory category;
        uint256 createdAt;
        uint256 completedAt;
        string submissionHash; // IPFS hash for submission
        uint256 requiredReputation;
        bool isUrgent;
    }

    struct TaskStake {
        uint256 amount;
        uint256 stakedAt;
        bool withdrawn;
    }

    // Task storage
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => TaskStake) public taskStakes;

    // Worker applications
    mapping(uint256 => address[]) public taskApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    // Tracking
    mapping(address => uint256[]) public userCreatedTasks;
    mapping(address => uint256[]) public userAssignedTasks;

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        uint256 bounty,
        TaskCategory category,
        string ipfsHash
    );
    event TaskApplicationSubmitted(uint256 indexed taskId, address indexed applicant);
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event TaskSubmitted(uint256 indexed taskId, string submissionHash);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 payment);
    event TaskCancelled(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId, address indexed disputant);
    event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 payment);
    event PlatformFeeUpdated(uint256 newFeePercent);
    event FeeCollectorUpdated(address newCollector);

    constructor(
        address _taskToken,
        address _reputationNFT,
        address _feeCollector
    ) {
        require(_taskToken != address(0), "Invalid token address");
        require(_reputationNFT != address(0), "Invalid reputation NFT address");
        require(_feeCollector != address(0), "Invalid fee collector");

        taskToken = IERC20(_taskToken);
        reputationNFT = ReputationNFT(_reputationNFT);
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISPUTE_RESOLVER_ROLE, msg.sender);
    }

    /**
     * @dev Create a new task with bounty
     * @param ipfsHash IPFS hash containing task details
     * @param bounty Amount of tokens offered as bounty
     * @param deadline Task deadline timestamp
     * @param category Task category
     * @param requiredReputation Minimum reputation score required
     * @param isUrgent Whether the task is urgent (affects visibility)
     */
    function createTask(
        string calldata ipfsHash,
        uint256 bounty,
        uint256 deadline,
        TaskCategory category,
        uint256 requiredReputation,
        bool isUrgent
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(bounty > 0, "Bounty must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");

        uint256 taskId = _taskIdCounter++;

        // Transfer bounty to escrow
        taskToken.safeTransferFrom(msg.sender, address(this), bounty);

        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            worker: address(0),
            ipfsHash: ipfsHash,
            bounty: bounty,
            deadline: deadline,
            status: TaskStatus.Open,
            category: category,
            createdAt: block.timestamp,
            completedAt: 0,
            submissionHash: "",
            requiredReputation: requiredReputation,
            isUrgent: isUrgent
        });

        taskStakes[taskId] = TaskStake({
            amount: bounty,
            stakedAt: block.timestamp,
            withdrawn: false
        });

        userCreatedTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, bounty, category, ipfsHash);

        return taskId;
    }

    /**
     * @dev Apply to work on a task
     * @param taskId ID of the task
     */
    function applyForTask(uint256 taskId) external whenNotPaused {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(task.creator != msg.sender, "Cannot apply to own task");
        require(!hasApplied[taskId][msg.sender], "Already applied");
        require(block.timestamp < task.deadline, "Task deadline passed");

        // Check reputation requirement
        if (task.requiredReputation > 0) {
            try reputationNFT.getReputationData(msg.sender) returns (
                uint256 score,
                ReputationNFT.ReputationTier,
                uint256,
                uint256,
                uint256,
                uint256,
                uint256
            ) {
                require(score >= task.requiredReputation, "Insufficient reputation");
            } catch {
                revert("No reputation NFT");
            }
        }

        taskApplications[taskId].push(msg.sender);
        hasApplied[taskId][msg.sender] = true;

        emit TaskApplicationSubmitted(taskId, msg.sender);
    }

    /**
     * @dev Assign task to a worker
     * @param taskId ID of the task
     * @param worker Address of the selected worker
     */
    function assignTask(uint256 taskId, address worker) external {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can assign");
        require(task.status == TaskStatus.Open, "Task not open");
        require(hasApplied[taskId][worker], "Worker has not applied");
        require(block.timestamp < task.deadline, "Task deadline passed");

        task.worker = worker;
        task.status = TaskStatus.Assigned;

        userAssignedTasks[worker].push(taskId);

        emit TaskAssigned(taskId, worker);
    }

    /**
     * @dev Submit completed work
     * @param taskId ID of the task
     * @param submissionHash IPFS hash of the submission
     */
    function submitTask(uint256 taskId, string calldata submissionHash) external {
        Task storage task = tasks[taskId];
        require(task.worker == msg.sender, "Not assigned worker");
        require(task.status == TaskStatus.Assigned, "Task not assigned");
        require(bytes(submissionHash).length > 0, "Invalid submission hash");

        task.submissionHash = submissionHash;
        task.status = TaskStatus.Submitted;

        emit TaskSubmitted(taskId, submissionHash);
    }

    /**
     * @dev Approve task completion and release payment
     * @param taskId ID of the task
     */
    function approveTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can approve");
        require(task.status == TaskStatus.Submitted, "Task not submitted");

        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;

        // Calculate platform fee
        uint256 fee = (task.bounty * platformFeePercent) / BASIS_POINTS;
        uint256 workerPayment = task.bounty - fee;

        // Transfer payment to worker
        taskToken.safeTransfer(task.worker, workerPayment);

        // Transfer fee to collector
        if (fee > 0) {
            taskToken.safeTransfer(feeCollector, fee);
        }

        // Mark stake as withdrawn
        taskStakes[taskId].withdrawn = true;

        // Update reputation - let calls fail loudly for atomicity
        reputationNFT.updateReputation(task.worker, int256(task.bounty / 1000), 1);
        reputationNFT.recordTaskStats(task.worker, task.bounty, false);
        reputationNFT.recordTaskStats(task.creator, task.bounty, true);

        emit TaskCompleted(taskId, task.worker, workerPayment);
    }

    /**
     * @dev Cancel a task (only if not assigned or by admin)
     * @param taskId ID of the task
     */
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(
            task.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized"
        );
        require(
            task.status == TaskStatus.Open || task.status == TaskStatus.Assigned,
            "Cannot cancel completed task"
        );

        TaskStake storage stake = taskStakes[taskId];
        require(!stake.withdrawn, "Stake already withdrawn");

        task.status = TaskStatus.Cancelled;

        // Refund bounty to creator
        taskToken.safeTransfer(task.creator, task.bounty);
        stake.withdrawn = true;

        emit TaskCancelled(taskId);
    }

    /**
     * @dev Initiate dispute for a task
     * @param taskId ID of the task
     */
    function initiateDispute(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(
            task.creator == msg.sender || task.worker == msg.sender,
            "Only creator or worker can dispute"
        );
        require(
            task.status == TaskStatus.Submitted || task.status == TaskStatus.Assigned,
            "Invalid status for dispute"
        );

        task.status = TaskStatus.Disputed;

        emit TaskDisputed(taskId, msg.sender);
    }

    /**
     * @dev Resolve dispute (called by DAO or admin)
     * @param taskId ID of the task
     * @param favorCreator True if ruling in favor of creator
     */
    function resolveDispute(uint256 taskId, bool favorCreator)
        external
        nonReentrant
        onlyRole(DISPUTE_RESOLVER_ROLE)
    {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Disputed, "Task not disputed");

        TaskStake storage stake = taskStakes[taskId];
        require(!stake.withdrawn, "Stake already withdrawn");

        address winner;
        uint256 payment;

        if (favorCreator) {
            // Refund to creator
            winner = task.creator;
            payment = task.bounty;
            taskToken.safeTransfer(task.creator, task.bounty);

            // Negative reputation for worker
            try reputationNFT.updateReputation(task.worker, -int256(task.bounty / 2000), 0) {} catch {}
            try reputationNFT.recordDisputeResult(task.creator, true) {} catch {}
            try reputationNFT.recordDisputeResult(task.worker, false) {} catch {}
        } else {
            // Pay worker
            winner = task.worker;
            uint256 fee = (task.bounty * platformFeePercent) / BASIS_POINTS;
            payment = task.bounty - fee;

            taskToken.safeTransfer(task.worker, payment);
            if (fee > 0) {
                taskToken.safeTransfer(feeCollector, fee);
            }

            // Update reputation
            try reputationNFT.updateReputation(task.worker, int256(task.bounty / 1000), 1) {} catch {}
            try reputationNFT.recordTaskStats(task.worker, task.bounty, false) {} catch {}
            try reputationNFT.recordDisputeResult(task.worker, true) {} catch {}
            try reputationNFT.recordDisputeResult(task.creator, false) {} catch {}
        }

        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        stake.withdrawn = true;

        emit DisputeResolved(taskId, winner, payment);
    }

    /**
     * @dev Get task applications
     */
    function getTaskApplications(uint256 taskId) external view returns (address[] memory) {
        return taskApplications[taskId];
    }

    /**
     * @dev Get user's created tasks
     */
    function getUserCreatedTasks(address user) external view returns (uint256[] memory) {
        return userCreatedTasks[user];
    }

    /**
     * @dev Get user's assigned tasks
     */
    function getUserAssignedTasks(address user) external view returns (uint256[] memory) {
        return userAssignedTasks[user];
    }

    /**
     * @dev Update platform fee (admin only)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyRole(ADMIN_ROLE) {
        require(newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }

    /**
     * @dev Update fee collector (admin only)
     */
    function updateFeeCollector(address newCollector) external onlyRole(ADMIN_ROLE) {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
