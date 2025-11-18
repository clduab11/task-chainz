import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TaskChainz, TaskToken } from "../typechain-types";

describe("TaskChainz", function () {
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const TASK_REWARD = ethers.parseEther("100");
  const ONE_DAY = 24 * 60 * 60;

  async function deployContractsFixture() {
    const [owner, validator, creator, worker, user] = await ethers.getSigners();

    // Deploy TaskToken
    const TaskToken = await ethers.getContractFactory("TaskToken");
    const taskToken = await TaskToken.deploy(INITIAL_SUPPLY);

    // Deploy TaskChainz
    const TaskChainz = await ethers.getContractFactory("TaskChainz");
    const taskChainz = await TaskChainz.deploy(
      await taskToken.getAddress(),
      owner.address
    );

    // Grant MINTER_ROLE to TaskChainz
    const MINTER_ROLE = await taskToken.MINTER_ROLE();
    await taskToken.grantRole(MINTER_ROLE, await taskChainz.getAddress());

    // Add validator
    await taskChainz.addValidator(validator.address);

    return { taskChainz, taskToken, owner, validator, creator, worker, user };
  }

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      const { taskChainz, taskToken } = await loadFixture(deployContractsFixture);
      expect(await taskChainz.taskToken()).to.equal(await taskToken.getAddress());
    });

    it("Should set the correct fee recipient", async function () {
      const { taskChainz, owner } = await loadFixture(deployContractsFixture);
      expect(await taskChainz.feeRecipient()).to.equal(owner.address);
    });

    it("Should set default platform fee to 2.5%", async function () {
      const { taskChainz } = await loadFixture(deployContractsFixture);
      expect(await taskChainz.platformFeePercentage()).to.equal(250);
    });

    it("Should revert with zero token address", async function () {
      const TaskChainz = await ethers.getContractFactory("TaskChainz");
      const [owner] = await ethers.getSigners();

      await expect(
        TaskChainz.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(TaskChainz, "ZeroAddress");
    });

    it("Should revert with zero fee recipient", async function () {
      const { taskToken } = await loadFixture(deployContractsFixture);
      const TaskChainz = await ethers.getContractFactory("TaskChainz");

      await expect(
        TaskChainz.deploy(await taskToken.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(TaskChainz, "ZeroAddress");
    });
  });

  describe("Task Creation", function () {
    it("Should create a task successfully", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;
      const ipfsHash = "QmTest123";

      await expect(
        taskChainz.connect(creator).createTask(ipfsHash, TASK_REWARD, deadline)
      )
        .to.emit(taskChainz, "TaskCreated")
        .withArgs(1, creator.address, ipfsHash, TASK_REWARD, deadline);

      const task = await taskChainz.getTask(1);
      expect(task.creator).to.equal(creator.address);
      expect(task.ipfsHash).to.equal(ipfsHash);
      expect(task.reward).to.equal(TASK_REWARD);
      expect(task.status).to.equal(0); // Open
    });

    it("Should increment task counter", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash1", TASK_REWARD, deadline);
      await taskChainz.connect(creator).createTask("hash2", TASK_REWARD, deadline);

      expect(await taskChainz.totalTasks()).to.equal(2);
    });

    it("Should track user created tasks", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash1", TASK_REWARD, deadline);
      await taskChainz.connect(creator).createTask("hash2", TASK_REWARD, deadline);

      const userTasks = await taskChainz.getUserCreatedTasks(creator.address);
      expect(userTasks.length).to.equal(2);
      expect(userTasks[0]).to.equal(1);
      expect(userTasks[1]).to.equal(2);
    });

    it("Should revert with empty IPFS hash", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await expect(
        taskChainz.connect(creator).createTask("", TASK_REWARD, deadline)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidTaskId");
    });

    it("Should revert with zero reward", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await expect(
        taskChainz.connect(creator).createTask("hash", 0, deadline)
      ).to.be.revertedWithCustomError(taskChainz, "InsufficientReward");
    });

    it("Should revert with past deadline", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const pastDeadline = (await time.latest()) - ONE_DAY;

      await expect(
        taskChainz.connect(creator).createTask("hash", TASK_REWARD, pastDeadline)
      ).to.be.revertedWithCustomError(taskChainz, "DeadlinePassed");
    });
  });

  describe("Task Assignment", function () {
    it("Should assign task to worker", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await expect(taskChainz.connect(worker).assignTask(1))
        .to.emit(taskChainz, "TaskAssigned")
        .withArgs(1, worker.address);

      const task = await taskChainz.getTask(1);
      expect(task.assignee).to.equal(worker.address);
      expect(task.status).to.equal(1); // InProgress
    });

    it("Should track user assigned tasks", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      const assignedTasks = await taskChainz.getUserAssignedTasks(worker.address);
      expect(assignedTasks.length).to.equal(1);
      expect(assignedTasks[0]).to.equal(1);
    });

    it("Should revert assigning non-existent task", async function () {
      const { taskChainz, worker } = await loadFixture(deployContractsFixture);

      await expect(
        taskChainz.connect(worker).assignTask(999)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidTaskId");
    });

    it("Should revert assigning already assigned task", async function () {
      const { taskChainz, creator, worker, user } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      await expect(
        taskChainz.connect(user).assignTask(1)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidStatus");
    });

    it("Should revert assigning task after deadline", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await time.increase(ONE_DAY + 1);

      await expect(
        taskChainz.connect(worker).assignTask(1)
      ).to.be.revertedWithCustomError(taskChainz, "DeadlinePassed");
    });
  });

  describe("Task Completion", function () {
    it("Should complete task and mint rewards", async function () {
      const { taskChainz, taskToken, creator, worker, owner } = await loadFixture(
        deployContractsFixture
      );
      const deadline = (await time.latest()) + ONE_DAY;
      const completionHash = "QmCompletion123";

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      // Calculate expected rewards
      const fee = (TASK_REWARD * 250n) / 10000n; // 2.5%
      const netReward = TASK_REWARD - fee;

      await expect(taskChainz.connect(worker).completeTask(1, completionHash))
        .to.emit(taskChainz, "TaskCompleted")
        .withArgs(1, worker.address, completionHash, netReward);

      // Check rewards were minted
      expect(await taskToken.balanceOf(worker.address)).to.equal(netReward);
      expect(await taskToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY + fee);

      // Check task status
      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(2); // Completed
      expect(task.completionIpfsHash).to.equal(completionHash);
    });

    it("Should update user stats on completion", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);
      await taskChainz.connect(worker).completeTask(1, "completion");

      const [completedCount, totalEarnings] = await taskChainz.getUserStats(worker.address);
      const expectedReward = TASK_REWARD - (TASK_REWARD * 250n) / 10000n;

      expect(completedCount).to.equal(1);
      expect(totalEarnings).to.equal(expectedReward);
    });

    it("Should revert if not assignee", async function () {
      const { taskChainz, creator, worker, user } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      await expect(
        taskChainz.connect(user).completeTask(1, "completion")
      ).to.be.revertedWithCustomError(taskChainz, "NotTaskAssignee");
    });

    it("Should revert with empty completion hash", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      await expect(
        taskChainz.connect(worker).completeTask(1, "")
      ).to.be.revertedWithCustomError(taskChainz, "InvalidTaskId");
    });
  });

  describe("Task Completion with Signature", function () {
    it("Should complete task with valid validator signature", async function () {
      const { taskChainz, taskToken, creator, worker, validator } = await loadFixture(
        deployContractsFixture
      );
      const deadline = (await time.latest()) + ONE_DAY;
      const completionHash = "QmSignedCompletion";

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      // Create signature
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "string"],
        [1, worker.address, completionHash]
      );
      const signature = await validator.signMessage(ethers.getBytes(messageHash));

      await expect(
        taskChainz.connect(worker).completeTaskWithSignature(1, completionHash, signature)
      )
        .to.emit(taskChainz, "TaskCompleted");

      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(2); // Completed
    });

    it("Should revert with invalid signature", async function () {
      const { taskChainz, creator, worker, user } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;
      const completionHash = "QmInvalidSig";

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      // Create signature from non-validator
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "string"],
        [1, worker.address, completionHash]
      );
      const signature = await user.signMessage(ethers.getBytes(messageHash));

      await expect(
        taskChainz.connect(worker).completeTaskWithSignature(1, completionHash, signature)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidSignature");
    });

    it("Should revert with reused signature", async function () {
      const { taskChainz, creator, worker, validator } = await loadFixture(
        deployContractsFixture
      );
      const deadline = (await time.latest()) + ONE_DAY;
      const completionHash = "QmReusedSig";

      await taskChainz.connect(creator).createTask("hash1", TASK_REWARD, deadline);
      await taskChainz.connect(creator).createTask("hash2", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "string"],
        [1, worker.address, completionHash]
      );
      const signature = await validator.signMessage(ethers.getBytes(messageHash));

      await taskChainz.connect(worker).completeTaskWithSignature(1, completionHash, signature);

      // Try to reuse for different task (would need different taskId, but using same sig)
      await taskChainz.connect(worker).assignTask(2);
      await expect(
        taskChainz.connect(worker).completeTaskWithSignature(2, completionHash, signature)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidSignature");
    });
  });

  describe("Task Cancellation", function () {
    it("Should allow creator to cancel open task", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await expect(taskChainz.connect(creator).cancelTask(1))
        .to.emit(taskChainz, "TaskCancelled")
        .withArgs(1, creator.address);

      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(3); // Cancelled
    });

    it("Should revert if not creator", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);

      await expect(
        taskChainz.connect(worker).cancelTask(1)
      ).to.be.revertedWithCustomError(taskChainz, "NotTaskCreator");
    });

    it("Should revert cancelling assigned task", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      await expect(
        taskChainz.connect(creator).cancelTask(1)
      ).to.be.revertedWithCustomError(taskChainz, "InvalidStatus");
    });
  });

  describe("Dispute Resolution", function () {
    it("Should allow creator to dispute in-progress task", async function () {
      const { taskChainz, creator, worker } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);

      await expect(taskChainz.connect(creator).disputeTask(1))
        .to.emit(taskChainz, "TaskDisputed")
        .withArgs(1, creator.address);

      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(4); // Disputed
    });

    it("Should allow admin to resolve dispute in favor of worker", async function () {
      const { taskChainz, taskToken, owner, creator, worker } = await loadFixture(
        deployContractsFixture
      );
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);
      await taskChainz.connect(creator).disputeTask(1);

      await expect(taskChainz.connect(owner).resolveDispute(1, true))
        .to.emit(taskChainz, "DisputeResolved")
        .withArgs(1, true);

      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(2); // Completed

      // Check worker received rewards
      const expectedReward = TASK_REWARD - (TASK_REWARD * 250n) / 10000n;
      expect(await taskToken.balanceOf(worker.address)).to.equal(expectedReward);
    });

    it("Should allow admin to resolve dispute against worker", async function () {
      const { taskChainz, creator, worker, owner } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      await taskChainz.connect(creator).createTask("hash", TASK_REWARD, deadline);
      await taskChainz.connect(worker).assignTask(1);
      await taskChainz.connect(creator).disputeTask(1);

      await taskChainz.connect(owner).resolveDispute(1, false);

      const task = await taskChainz.getTask(1);
      expect(task.status).to.equal(0); // Back to Open
      expect(task.assignee).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update platform fee", async function () {
      const { taskChainz, owner } = await loadFixture(deployContractsFixture);

      await expect(taskChainz.connect(owner).setPlatformFee(500))
        .to.emit(taskChainz, "PlatformFeeUpdated")
        .withArgs(500);

      expect(await taskChainz.platformFeePercentage()).to.equal(500);
    });

    it("Should revert if fee exceeds maximum", async function () {
      const { taskChainz, owner } = await loadFixture(deployContractsFixture);

      await expect(
        taskChainz.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWithCustomError(taskChainz, "FeeTooHigh");
    });

    it("Should allow admin to update fee recipient", async function () {
      const { taskChainz, owner, user } = await loadFixture(deployContractsFixture);

      await expect(taskChainz.connect(owner).setFeeRecipient(user.address))
        .to.emit(taskChainz, "FeeRecipientUpdated")
        .withArgs(user.address);

      expect(await taskChainz.feeRecipient()).to.equal(user.address);
    });

    it("Should revert setting zero address as fee recipient", async function () {
      const { taskChainz, owner } = await loadFixture(deployContractsFixture);

      await expect(
        taskChainz.connect(owner).setFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(taskChainz, "ZeroAddress");
    });

    it("Should allow admin to manage validators", async function () {
      const { taskChainz, owner, user } = await loadFixture(deployContractsFixture);

      await taskChainz.connect(owner).addValidator(user.address);
      const VALIDATOR_ROLE = await taskChainz.VALIDATOR_ROLE();
      expect(await taskChainz.hasRole(VALIDATOR_ROLE, user.address)).to.be.true;

      await taskChainz.connect(owner).removeValidator(user.address);
      expect(await taskChainz.hasRole(VALIDATOR_ROLE, user.address)).to.be.false;
    });
  });

  describe("View Functions", function () {
    it("Should return correct task count", async function () {
      const { taskChainz, creator } = await loadFixture(deployContractsFixture);
      const deadline = (await time.latest()) + ONE_DAY;

      expect(await taskChainz.totalTasks()).to.equal(0);

      await taskChainz.connect(creator).createTask("hash1", TASK_REWARD, deadline);
      expect(await taskChainz.totalTasks()).to.equal(1);

      await taskChainz.connect(creator).createTask("hash2", TASK_REWARD, deadline);
      expect(await taskChainz.totalTasks()).to.equal(2);
    });

    it("Should revert getting non-existent task", async function () {
      const { taskChainz } = await loadFixture(deployContractsFixture);

      await expect(taskChainz.getTask(999)).to.be.revertedWithCustomError(
        taskChainz,
        "InvalidTaskId"
      );
    });
  });
});
