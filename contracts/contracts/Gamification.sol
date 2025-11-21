// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Gamification
 * @dev Gamification system with streaks, leaderboards, referrals, and community challenges
 *
 * Features:
 * - Daily task completion streaks with multipliers
 * - Global and category-specific leaderboards
 * - Referral rewards
 * - Community challenges with pooled rewards
 * - Seasonal competitions
 * - Bonus multipliers for consistent performers
 */
contract Gamification is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant GAME_MANAGER_ROLE = keccak256("GAME_MANAGER_ROLE");

    IERC20 public immutable taskToken;

    // Streak tracking
    struct StreakData {
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastTaskDate; // Last task completion date (days since epoch)
        uint256 totalBonusEarned;
    }

    mapping(address => StreakData) public userStreaks;

    // Leaderboard
    struct LeaderboardEntry {
        address user;
        uint256 score;
        uint256 tasksCompleted;
        uint256 totalEarned;
    }

    LeaderboardEntry[] public globalLeaderboard;
    mapping(address => uint256) public leaderboardPosition;

    // Referrals
    struct ReferralData {
        address referrer;
        uint256 totalReferred;
        uint256 referralEarnings;
    }

    mapping(address => ReferralData) public referrals;
    mapping(address => address[]) public userReferrals;

    uint256 public referralBonusPercent = 500; // 5% bonus
    uint256 public constant MAX_REFERRAL_BONUS = 2000; // 20% max

    // Community Challenges
    struct Challenge {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardPool;
        uint256 targetTasks;
        uint256 participantCount;
        bool active;
        bool completed;
    }

    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => mapping(address => uint256)) public challengeProgress;
    mapping(uint256 => address[]) public challengeParticipants;
    mapping(uint256 => mapping(address => uint256)) public challengeRewards; // Claimable rewards per user
    mapping(uint256 => mapping(address => bool)) public rewardsClaimed; // Track claimed rewards
    uint256 private _challengeIdCounter;

    // Streak multipliers
    uint256 public constant STREAK_7_BONUS = 110; // 10% bonus
    uint256 public constant STREAK_30_BONUS = 125; // 25% bonus
    uint256 public constant STREAK_90_BONUS = 150; // 50% bonus
    uint256 public constant STREAK_365_BONUS = 200; // 100% bonus
    uint256 public constant MULTIPLIER_BASE = 100;

    // Events
    event StreakUpdated(address indexed user, uint256 currentStreak, uint256 multiplier);
    event StreakBroken(address indexed user, uint256 previousStreak);
    event ReferralRegistered(address indexed referee, address indexed referrer);
    event ReferralBonusPaid(address indexed referrer, address indexed referee, uint256 amount);
    event ChallengeCreated(uint256 indexed challengeId, string name, uint256 rewardPool);
    event ChallengeJoined(uint256 indexed challengeId, address indexed user);
    event ChallengeCompleted(uint256 indexed challengeId, address indexed user);
    event ChallengeFinalized(uint256 indexed challengeId, uint256 winnerCount, uint256 rewardPerWinner);
    event ChallengeRewardClaimed(uint256 indexed challengeId, address indexed user, uint256 amount);
    event LeaderboardUpdated(address indexed user, uint256 position, uint256 score);

    constructor(address _taskToken) {
        require(_taskToken != address(0), "Invalid token address");
        taskToken = IERC20(_taskToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Update user streak on task completion
     * @param user Address of the user
     * @return multiplier Current streak multiplier
     */
    function updateStreak(address user) external onlyRole(GAME_MANAGER_ROLE) returns (uint256) {
        StreakData storage streak = userStreaks[user];
        uint256 today = block.timestamp / 1 days;

        if (streak.lastTaskDate == 0) {
            // First task
            streak.currentStreak = 1;
            streak.longestStreak = 1;
        } else if (streak.lastTaskDate == today) {
            // Already completed task today, no change
            return _getStreakMultiplier(streak.currentStreak);
        } else if (streak.lastTaskDate == today - 1) {
            // Consecutive day
            streak.currentStreak++;
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }
        } else {
            // Streak broken
            emit StreakBroken(user, streak.currentStreak);
            streak.currentStreak = 1;
        }

        streak.lastTaskDate = today;

        uint256 multiplier = _getStreakMultiplier(streak.currentStreak);
        emit StreakUpdated(user, streak.currentStreak, multiplier);

        return multiplier;
    }

    /**
     * @dev Calculate streak bonus for a reward
     * @param user Address of the user
     * @param baseReward Base reward amount
     * @return bonusReward Additional bonus from streak
     */
    function calculateStreakBonus(address user, uint256 baseReward)
        external
        view
        returns (uint256)
    {
        uint256 multiplier = _getStreakMultiplier(userStreaks[user].currentStreak);
        if (multiplier == MULTIPLIER_BASE) return 0;

        return (baseReward * (multiplier - MULTIPLIER_BASE)) / MULTIPLIER_BASE;
    }

    /**
     * @dev Get streak multiplier based on streak length
     */
    function _getStreakMultiplier(uint256 streak) private pure returns (uint256) {
        if (streak >= 365) return STREAK_365_BONUS;
        if (streak >= 90) return STREAK_90_BONUS;
        if (streak >= 30) return STREAK_30_BONUS;
        if (streak >= 7) return STREAK_7_BONUS;
        return MULTIPLIER_BASE;
    }

    /**
     * @dev Register a referral
     * @param referee New user being referred
     * @param referrer Existing user referring
     */
    function registerReferral(address referee, address referrer)
        external
        onlyRole(GAME_MANAGER_ROLE)
    {
        require(referee != address(0) && referrer != address(0), "Invalid addresses");
        require(referee != referrer, "Cannot refer yourself");
        require(referrals[referee].referrer == address(0), "Already referred");

        referrals[referee].referrer = referrer;
        referrals[referrer].totalReferred++;
        userReferrals[referrer].push(referee);

        emit ReferralRegistered(referee, referrer);
    }

    /**
     * @dev Pay referral bonus
     * @param referee User who completed task
     * @param taskReward Reward amount from task
     */
    function payReferralBonus(address referee, uint256 taskReward)
        external
        nonReentrant
        onlyRole(GAME_MANAGER_ROLE)
    {
        address referrer = referrals[referee].referrer;
        if (referrer == address(0)) return;

        uint256 bonus = (taskReward * referralBonusPercent) / 10000;
        if (bonus == 0) return;

        referrals[referrer].referralEarnings += bonus;

        // Transfer bonus from contract (must be funded)
        taskToken.safeTransfer(referrer, bonus);

        emit ReferralBonusPaid(referrer, referee, bonus);
    }

    /**
     * @dev Create a community challenge
     * @param name Challenge name
     * @param description Challenge description
     * @param duration Duration in seconds
     * @param rewardPool Total reward pool
     * @param targetTasks Target number of tasks
     */
    function createChallenge(
        string calldata name,
        string calldata description,
        uint256 duration,
        uint256 rewardPool,
        uint256 targetTasks
    ) external onlyRole(GAME_MANAGER_ROLE) returns (uint256) {
        require(duration > 0, "Invalid duration");
        require(rewardPool > 0, "Invalid reward pool");
        require(targetTasks > 0, "Invalid target");

        uint256 challengeId = _challengeIdCounter++;

        challenges[challengeId] = Challenge({
            id: challengeId,
            name: name,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            rewardPool: rewardPool,
            targetTasks: targetTasks,
            participantCount: 0,
            active: true,
            completed: false
        });

        // Transfer reward pool to contract
        taskToken.safeTransferFrom(msg.sender, address(this), rewardPool);

        emit ChallengeCreated(challengeId, name, rewardPool);

        return challengeId;
    }

    /**
     * @dev Join a challenge
     * @param challengeId ID of the challenge
     */
    function joinChallenge(uint256 challengeId, address user)
        external
        onlyRole(GAME_MANAGER_ROLE)
    {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(block.timestamp < challenge.endTime, "Challenge ended");
        require(challengeProgress[challengeId][user] == 0, "Already joined");

        challengeParticipants[challengeId].push(user);
        challenge.participantCount++;
        challengeProgress[challengeId][user] = 1; // Mark as joined

        emit ChallengeJoined(challengeId, user);
    }

    /**
     * @dev Update challenge progress
     * @param challengeId ID of the challenge
     * @param user User completing task
     */
    function updateChallengeProgress(uint256 challengeId, address user)
        external
        onlyRole(GAME_MANAGER_ROLE)
    {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active, "Challenge not active");
        require(challengeProgress[challengeId][user] > 0, "Not participating");

        challengeProgress[challengeId][user]++;

        if (challengeProgress[challengeId][user] >= challenge.targetTasks) {
            emit ChallengeCompleted(challengeId, user);
        }
    }

    /**
     * @dev Finalize challenge and calculate rewards (pull-over-push pattern to avoid DoS)
     * @param challengeId ID of the challenge
     * @param batchStart Start index for processing participants
     * @param batchSize Number of participants to process in this batch
     */
    function finalizeChallenge(uint256 challengeId, uint256 batchStart, uint256 batchSize)
        external
        nonReentrant
        onlyRole(GAME_MANAGER_ROLE)
    {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.active || challenge.completed, "Challenge not active");
        require(block.timestamp >= challenge.endTime, "Challenge not ended");

        address[] memory participants = challengeParticipants[challengeId];
        uint256 batchEnd = batchStart + batchSize;
        if (batchEnd > participants.length) {
            batchEnd = participants.length;
        }

        // First pass: count winners if not already completed
        if (!challenge.completed) {
            uint256 winnerCount = 0;
            for (uint256 i = 0; i < participants.length; i++) {
                if (challengeProgress[challengeId][participants[i]] >= challenge.targetTasks) {
                    winnerCount++;
                }
            }
            
            if (winnerCount > 0) {
                uint256 rewardPerWinner = challenge.rewardPool / winnerCount;
                // Store rewards for each winner
                for (uint256 i = 0; i < participants.length; i++) {
                    address participant = participants[i];
                    if (challengeProgress[challengeId][participant] >= challenge.targetTasks) {
                        challengeRewards[challengeId][participant] = rewardPerWinner;
                    }
                }
                emit ChallengeFinalized(challengeId, winnerCount, rewardPerWinner);
            }
            
            challenge.active = false;
            challenge.completed = true;
        }
    }

    /**
     * @dev Claim challenge rewards (pull pattern)
     * @param challengeId ID of the challenge
     */
    function claimChallengeReward(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.completed, "Challenge not finalized");
        require(!rewardsClaimed[challengeId][msg.sender], "Reward already claimed");
        
        uint256 reward = challengeRewards[challengeId][msg.sender];
        require(reward > 0, "No reward available");

        rewardsClaimed[challengeId][msg.sender] = true;
        taskToken.safeTransfer(msg.sender, reward);
        
        emit ChallengeRewardClaimed(challengeId, msg.sender, reward);
    }

    /**
     * @dev Update leaderboard (emit events only, sorting handled off-chain to avoid gas costs)
     * @param user User to update
     * @param score New score
     * @param tasksCompleted Total tasks completed
     * @param totalEarned Total earned
     */
    function updateLeaderboard(
        address user,
        uint256 score,
        uint256 tasksCompleted,
        uint256 totalEarned
    ) external onlyRole(GAME_MANAGER_ROLE) {
        uint256 position = leaderboardPosition[user];

        if (position == 0) {
            // New entry
            globalLeaderboard.push(
                LeaderboardEntry({
                    user: user,
                    score: score,
                    tasksCompleted: tasksCompleted,
                    totalEarned: totalEarned
                })
            );
            position = globalLeaderboard.length;
            leaderboardPosition[user] = position;
        } else {
            // Update existing
            globalLeaderboard[position - 1] = LeaderboardEntry({
                user: user,
                score: score,
                tasksCompleted: tasksCompleted,
                totalEarned: totalEarned
            });
        }

        // Emit event for off-chain indexing and sorting
        emit LeaderboardUpdated(user, position, score);
    }

    /**
     * @dev Get top N leaderboard entries
     */
    function getTopLeaderboard(uint256 count)
        external
        view
        returns (LeaderboardEntry[] memory)
    {
        uint256 length = count > globalLeaderboard.length
            ? globalLeaderboard.length
            : count;

        LeaderboardEntry[] memory top = new LeaderboardEntry[](length);

        for (uint256 i = 0; i < length; i++) {
            top[i] = globalLeaderboard[i];
        }

        return top;
    }

    /**
     * @dev Get user's referrals
     */
    function getUserReferrals(address user) external view returns (address[] memory) {
        return userReferrals[user];
    }

    /**
     * @dev Update referral bonus percentage
     */
    function updateReferralBonus(uint256 newPercent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPercent <= MAX_REFERRAL_BONUS, "Bonus too high");
        referralBonusPercent = newPercent;
    }

    /**
     * @dev Fund contract for bonuses
     */
    function fundContract(uint256 amount) external {
        taskToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
