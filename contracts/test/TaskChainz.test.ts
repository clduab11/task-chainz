import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Task Chainz Platform", function () {
  async function deployTaskChainzFixture() {
    const [owner, creator, worker, user2, feeCollector] = await ethers.getSigners();

    // Deploy Token
    const TaskChainzToken = await ethers.getContractFactory("TaskChainzToken");
    const token = await TaskChainzToken.deploy();
    await token.waitForDeployment();

    // Deploy Reputation NFT
    const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
    const reputationNFT = await ReputationNFT.deploy();
    await reputationNFT.waitForDeployment();

    // Deploy Task Manager
    const TaskManager = await ethers.getContractFactory("TaskManager");
    const taskManager = await TaskManager.deploy(
      await token.getAddress(),
      await reputationNFT.getAddress(),
      feeCollector.address
    );
    await taskManager.waitForDeployment();

    // Deploy Gamification
    const Gamification = await ethers.getContractFactory("Gamification");
    const gamification = await Gamification.deploy(await token.getAddress());
    await gamification.waitForDeployment();

    // Grant roles
    const REPUTATION_MANAGER_ROLE = await reputationNFT.REPUTATION_MANAGER_ROLE();

    await reputationNFT.grantRole(REPUTATION_MANAGER_ROLE, await taskManager.getAddress());
    await reputationNFT.grantRole(
      await reputationNFT.MINTER_ROLE(),
      await taskManager.getAddress()
    );

    // Distribute tokens
    const AMOUNT = ethers.parseEther("10000");
    await token.transfer(creator.address, AMOUNT);
    await token.transfer(worker.address, AMOUNT);
    await token.transfer(user2.address, AMOUNT);

    // Approve TaskManager to spend tokens
    await token.connect(creator).approve(await taskManager.getAddress(), ethers.MaxUint256);
    await token.connect(worker).approve(await taskManager.getAddress(), ethers.MaxUint256);

    // Mint reputation NFTs
    await reputationNFT.mintReputationNFT(creator.address, "ipfs://creator-metadata");
    await reputationNFT.mintReputationNFT(worker.address, "ipfs://worker-metadata");

    return {
      token,
      reputationNFT,
      taskManager,
      gamification,
      owner,
      creator,
      worker,
      user2,
      feeCollector,
    };
  }

  describe("TaskChainzToken", function () {
    it("Should have correct initial supply", async function () {
      const { token, owner } = await loadFixture(deployTaskChainzFixture);
      const initialSupply = ethers.parseEther("100000000");
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should not exceed max supply", async function () {
      const { token, owner } = await loadFixture(deployTaskChainzFixture);
      const maxSupply = ethers.parseEther("1000000000");
      const currentSupply = await token.totalSupply();
      const toMint = maxSupply - currentSupply + ethers.parseEther("1");

      await expect(token.mint(owner.address, toMint)).to.be.revertedWith("Max supply exceeded");
    });

    it("Should create vesting schedule", async function () {
      const { token, user2 } = await loadFixture(deployTaskChainzFixture);
      const amount = ethers.parseEther("1000");
      const duration = 365 * 24 * 60 * 60; // 1 year
      const cliff = 30 * 24 * 60 * 60; // 30 days

      await token.createVestingSchedule(user2.address, amount, duration, cliff);

      const schedule = await token.vestingSchedules(user2.address);
      expect(schedule.totalAmount).to.equal(amount);
    });
  });

  describe("ReputationNFT", function () {
    it("Should mint reputation NFT", async function () {
      const { reputationNFT, user2 } = await loadFixture(deployTaskChainzFixture);

      await reputationNFT.mintReputationNFT(user2.address, "ipfs://metadata");
      const tokenId = await reputationNFT.getUserTokenId(user2.address);

      expect(tokenId).to.be.gt(0);
      expect(await reputationNFT.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("Should prevent transfers (soul-bound)", async function () {
      const { reputationNFT, worker, user2 } = await loadFixture(deployTaskChainzFixture);

      const tokenId = await reputationNFT.getUserTokenId(worker.address);

      await expect(
        reputationNFT.connect(worker).transferFrom(worker.address, user2.address, tokenId)
      ).to.be.revertedWith("Reputation NFTs are soul-bound");
    });

    it("Should update reputation score", async function () {
      const { reputationNFT, worker } = await loadFixture(deployTaskChainzFixture);

      await reputationNFT.updateReputation(worker.address, 1000, 1);

      const data = await reputationNFT.getReputationData(worker.address);
      expect(data.score).to.equal(1000);
      expect(data.tasksCompleted).to.equal(1);
    });

    it("Should upgrade reputation tier", async function () {
      const { reputationNFT, worker } = await loadFixture(deployTaskChainzFixture);

      // Update to Silver tier (1000+ points)
      await reputationNFT.updateReputation(worker.address, 1500, 10);

      const data = await reputationNFT.getReputationData(worker.address);
      expect(data.tier).to.equal(1); // Silver = 1
    });
  });

  describe("TaskManager", function () {
    it("Should create a task", async function () {
      const { taskManager, creator } = await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400; // 1 day

      await expect(
        taskManager
          .connect(creator)
          .createTask("ipfs://task-details", bounty, deadline, 0, 0, false)
      )
        .to.emit(taskManager, "TaskCreated")
        .withArgs(0, creator.address, bounty, 0, "ipfs://task-details");

      const task = await taskManager.tasks(0);
      expect(task.creator).to.equal(creator.address);
      expect(task.bounty).to.equal(bounty);
    });

    it("Should allow worker to apply for task", async function () {
      const { taskManager, creator, worker } = await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);

      await expect(taskManager.connect(worker).applyForTask(0))
        .to.emit(taskManager, "TaskApplicationSubmitted")
        .withArgs(0, worker.address);

      const applications = await taskManager.getTaskApplications(0);
      expect(applications).to.include(worker.address);
    });

    it("Should assign task to worker", async function () {
      const { taskManager, creator, worker } = await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);

      await taskManager.connect(worker).applyForTask(0);

      await expect(taskManager.connect(creator).assignTask(0, worker.address))
        .to.emit(taskManager, "TaskAssigned")
        .withArgs(0, worker.address);

      const task = await taskManager.tasks(0);
      expect(task.worker).to.equal(worker.address);
      expect(task.status).to.equal(1); // Assigned
    });

    it("Should complete full task lifecycle", async function () {
      const { taskManager, token, creator, worker, feeCollector } =
        await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      // Create task
      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);

      // Apply
      await taskManager.connect(worker).applyForTask(0);

      // Assign
      await taskManager.connect(creator).assignTask(0, worker.address);

      // Submit
      await taskManager.connect(worker).submitTask(0, "ipfs://submission");

      const workerBalanceBefore = await token.balanceOf(worker.address);
      const feeCollectorBalanceBefore = await token.balanceOf(feeCollector.address);

      // Approve
      await expect(taskManager.connect(creator).approveTask(0))
        .to.emit(taskManager, "TaskCompleted")
        .withArgs(0, worker.address, ethers.parseEther("97.5")); // 100 - 2.5% fee

      const task = await taskManager.tasks(0);
      expect(task.status).to.equal(3); // Completed

      const workerBalanceAfter = await token.balanceOf(worker.address);
      const feeCollectorBalanceAfter = await token.balanceOf(feeCollector.address);

      expect(workerBalanceAfter - workerBalanceBefore).to.equal(ethers.parseEther("97.5"));
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(
        ethers.parseEther("2.5")
      );
    });

    it("Should allow task cancellation", async function () {
      const { taskManager, token, creator } = await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);

      const balanceBefore = await token.balanceOf(creator.address);

      await expect(taskManager.connect(creator).cancelTask(0))
        .to.emit(taskManager, "TaskCancelled")
        .withArgs(0);

      const balanceAfter = await token.balanceOf(creator.address);
      expect(balanceAfter - balanceBefore).to.equal(bounty);
    });

    it("Should initiate dispute", async function () {
      const { taskManager, creator, worker } = await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);
      await taskManager.connect(worker).applyForTask(0);
      await taskManager.connect(creator).assignTask(0, worker.address);
      await taskManager.connect(worker).submitTask(0, "ipfs://submission");

      await expect(taskManager.connect(creator).initiateDispute(0))
        .to.emit(taskManager, "TaskDisputed")
        .withArgs(0, creator.address);

      const task = await taskManager.tasks(0);
      expect(task.status).to.equal(4); // Disputed
    });
  });

  describe("Gamification", function () {
    it("Should track user streaks", async function () {
      const { gamification, worker } = await loadFixture(deployTaskChainzFixture);

      await expect(gamification.updateStreak(worker.address))
        .to.emit(gamification, "StreakUpdated")
        .withArgs(worker.address, 1, 100);

      const streak = await gamification.userStreaks(worker.address);
      expect(streak.currentStreak).to.equal(1);
    });

    it("Should apply streak multipliers", async function () {
      const { gamification, worker } = await loadFixture(deployTaskChainzFixture);

      // Simulate 7-day streak
      for (let i = 0; i < 7; i++) {
        await gamification.updateStreak(worker.address);
        await time.increase(86400); // 1 day
      }

      const baseReward = ethers.parseEther("100");
      const bonus = await gamification.calculateStreakBonus(worker.address, baseReward);

      expect(bonus).to.equal(ethers.parseEther("10")); // 10% bonus
    });

    it("Should register referrals", async function () {
      const { gamification, worker, user2 } = await loadFixture(deployTaskChainzFixture);

      await expect(gamification.registerReferral(user2.address, worker.address))
        .to.emit(gamification, "ReferralRegistered")
        .withArgs(user2.address, worker.address);

      const referralData = await gamification.referrals(user2.address);
      expect(referralData.referrer).to.equal(worker.address);
    });

    it("Should create community challenge", async function () {
      const { gamification, token } = await loadFixture(deployTaskChainzFixture);

      const rewardPool = ethers.parseEther("1000");
      await token.approve(await gamification.getAddress(), rewardPool);

      await expect(
        gamification.createChallenge(
          "Test Challenge",
          "Complete 10 tasks",
          86400 * 7,
          rewardPool,
          10
        )
      )
        .to.emit(gamification, "ChallengeCreated")
        .withArgs(0, "Test Challenge", rewardPool);

      const challenge = await gamification.challenges(0);
      expect(challenge.rewardPool).to.equal(rewardPool);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete task with reputation and gamification", async function () {
      const { taskManager, reputationNFT, creator, worker } =
        await loadFixture(deployTaskChainzFixture);

      const bounty = ethers.parseEther("100");
      const deadline = (await time.latest()) + 86400;

      // Create and complete task
      await taskManager
        .connect(creator)
        .createTask("ipfs://task-details", bounty, deadline, 0, 0, false);
      await taskManager.connect(worker).applyForTask(0);
      await taskManager.connect(creator).assignTask(0, worker.address);
      await taskManager.connect(worker).submitTask(0, "ipfs://submission");
      await taskManager.connect(creator).approveTask(0);

      // Check reputation was updated
      const repData = await reputationNFT.getReputationData(worker.address);
      expect(repData.tasksCompleted).to.equal(1);
      expect(repData.score).to.be.gt(0);
    });
  });
});
