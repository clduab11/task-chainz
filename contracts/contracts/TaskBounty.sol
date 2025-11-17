// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationNFT.sol";

/**
 * @title TaskBounty
 * @dev Main contract for task bounty system with escrow and dispute resolution
 */
contract TaskBounty is ReentrancyGuard, Ownable {
    IERC20 public taskToken;
    ReputationNFT public reputationNFT;
    address public daoGovernance;
    
    enum TaskStatus { Open, Assigned, Submitted, Completed, Disputed, Cancelled }
    
    struct Task {
        uint256 id;
        address creator;
        address assignee;
        string title;
        string descriptionHash; // IPFS hash
        uint256 bounty;
        TaskStatus status;
        uint256 createdAt;
        uint256 deadline;
        bool fundsReleased;
    }
    
    struct Dispute {
        uint256 taskId;
        address initiator;
        string reason;
        uint256 createdAt;
        bool resolved;
        address winner;
    }
    
    uint256 private _taskIdCounter;
    uint256 private _disputeIdCounter;
    
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public userTasks;
    mapping(address => uint256[]) public assignedTasks;
    
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    
    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 bounty, uint256 deadline);
    event TaskAssigned(uint256 indexed taskId, address indexed assignee);
    event TaskSubmitted(uint256 indexed taskId);
    event TaskCompleted(uint256 indexed taskId, address indexed assignee, uint256 bounty);
    event TaskCancelled(uint256 indexed taskId);
    event DisputeCreated(uint256 indexed disputeId, uint256 indexed taskId, address indexed initiator);
    event DisputeResolved(uint256 indexed disputeId, address indexed winner);
    
    constructor(address _taskToken, address _reputationNFT) Ownable(msg.sender) {
        taskToken = IERC20(_taskToken);
        reputationNFT = ReputationNFT(_reputationNFT);
    }
    
    /**
     * @dev Sets the DAO governance address for dispute resolution
     */
    function setDAOGovernance(address _daoGovernance) external onlyOwner {
        daoGovernance = _daoGovernance;
    }
    
    /**
     * @dev Updates platform fee (only owner)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
    }
    
    /**
     * @dev Creates a new task with bounty in escrow
     */
    function createTask(
        string memory title,
        string memory descriptionHash,
        uint256 bounty,
        uint256 deadline
    ) external nonReentrant returns (uint256) {
        require(bounty > 0, "Bounty must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(taskToken.transferFrom(msg.sender, address(this), bounty), "Token transfer failed");
        
        uint256 taskId = _taskIdCounter++;
        
        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            assignee: address(0),
            title: title,
            descriptionHash: descriptionHash,
            bounty: bounty,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            deadline: deadline,
            fundsReleased: false
        });
        
        userTasks[msg.sender].push(taskId);
        
        emit TaskCreated(taskId, msg.sender, bounty, deadline);
        
        return taskId;
    }
    
    /**
     * @dev Assigns task to a worker
     */
    function assignTask(uint256 taskId, address assignee) external {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can assign");
        require(task.status == TaskStatus.Open, "Task not open");
        require(assignee != address(0), "Invalid assignee");
        
        task.assignee = assignee;
        task.status = TaskStatus.Assigned;
        assignedTasks[assignee].push(taskId);
        
        emit TaskAssigned(taskId, assignee);
    }
    
    /**
     * @dev Worker submits completed task
     */
    function submitTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.assignee == msg.sender, "Only assignee can submit");
        require(task.status == TaskStatus.Assigned, "Task not assigned");
        require(block.timestamp <= task.deadline, "Deadline passed");
        
        task.status = TaskStatus.Submitted;
        
        emit TaskSubmitted(taskId);
    }
    
    /**
     * @dev Creator approves task completion and releases funds
     */
    function approveTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can approve");
        require(task.status == TaskStatus.Submitted, "Task not submitted");
        require(!task.fundsReleased, "Funds already released");
        
        task.status = TaskStatus.Completed;
        task.fundsReleased = true;
        
        // Calculate fee and payment
        uint256 fee = (task.bounty * platformFee) / 10000;
        uint256 payment = task.bounty - fee;
        
        // Transfer payment to assignee
        require(taskToken.transfer(task.assignee, payment), "Payment transfer failed");
        
        // Transfer fee to owner
        if (fee > 0) {
            require(taskToken.transfer(owner(), fee), "Fee transfer failed");
        }
        
        // Update reputation
        try reputationNFT.updateReputation(task.assignee, 1, payment, 80) {} catch {}
        
        emit TaskCompleted(taskId, task.assignee, payment);
    }
    
    /**
     * @dev Cancels task and returns funds to creator (only if not assigned or disputed)
     */
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "Only creator can cancel");
        require(task.status == TaskStatus.Open || task.status == TaskStatus.Assigned, "Cannot cancel task");
        require(!task.fundsReleased, "Funds already released");
        
        task.status = TaskStatus.Cancelled;
        task.fundsReleased = true;
        
        // Return bounty to creator
        require(taskToken.transfer(task.creator, task.bounty), "Refund failed");
        
        emit TaskCancelled(taskId);
    }
    
    /**
     * @dev Creates a dispute for a task
     */
    function createDispute(uint256 taskId, string memory reason) external returns (uint256) {
        Task storage task = tasks[taskId];
        require(
            task.creator == msg.sender || task.assignee == msg.sender,
            "Only task participants can dispute"
        );
        require(
            task.status == TaskStatus.Submitted || task.status == TaskStatus.Assigned,
            "Invalid task status for dispute"
        );
        
        task.status = TaskStatus.Disputed;
        
        uint256 disputeId = _disputeIdCounter++;
        
        disputes[disputeId] = Dispute({
            taskId: taskId,
            initiator: msg.sender,
            reason: reason,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0)
        });
        
        emit DisputeCreated(disputeId, taskId, msg.sender);
        
        return disputeId;
    }
    
    /**
     * @dev Resolves a dispute (called by DAO governance)
     */
    function resolveDispute(uint256 disputeId, address winner) external nonReentrant {
        require(msg.sender == daoGovernance || msg.sender == owner(), "Only DAO or owner can resolve");
        
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        
        Task storage task = tasks[dispute.taskId];
        require(task.status == TaskStatus.Disputed, "Task not in dispute");
        require(!task.fundsReleased, "Funds already released");
        
        dispute.resolved = true;
        dispute.winner = winner;
        task.fundsReleased = true;
        
        if (winner == task.assignee) {
            // Worker wins - pay out bounty minus fee
            task.status = TaskStatus.Completed;
            uint256 fee = (task.bounty * platformFee) / 10000;
            uint256 payment = task.bounty - fee;
            
            require(taskToken.transfer(task.assignee, payment), "Payment transfer failed");
            if (fee > 0) {
                require(taskToken.transfer(owner(), fee), "Fee transfer failed");
            }
            
            try reputationNFT.updateReputation(task.assignee, 1, payment, 75) {} catch {}
        } else {
            // Creator wins - refund bounty
            task.status = TaskStatus.Cancelled;
            require(taskToken.transfer(task.creator, task.bounty), "Refund failed");
        }
        
        emit DisputeResolved(disputeId, winner);
    }
    
    /**
     * @dev Returns tasks created by a user
     */
    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }
    
    /**
     * @dev Returns tasks assigned to a user
     */
    function getAssignedTasks(address user) external view returns (uint256[] memory) {
        return assignedTasks[user];
    }
    
    /**
     * @dev Returns task details
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
    
    /**
     * @dev Returns total number of tasks
     */
    function getTotalTasks() external view returns (uint256) {
        return _taskIdCounter;
    }
}
