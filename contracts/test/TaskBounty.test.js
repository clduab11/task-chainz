const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TaskBounty", function () {
  let taskToken, reputationNFT, taskBounty, taskDAO;
  let owner, creator, worker, other;
  let bountyAmount;

  beforeEach(async function () {
    [owner, creator, worker, other] = await ethers.getSigners();

    // Deploy contracts
    const TaskChainzToken = await ethers.getContractFactory("TaskChainzToken");
    taskToken = await TaskChainzToken.deploy();

    const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
    reputationNFT = await ReputationNFT.deploy();

    const TaskBounty = await ethers.getContractFactory("TaskBounty");
    taskBounty = await TaskBounty.deploy(
      await taskToken.getAddress(),
      await reputationNFT.getAddress()
    );

    const TaskDAO = await ethers.getContractFactory("TaskDAO");
    taskDAO = await TaskDAO.deploy(await taskToken.getAddress());

    // Setup
    await taskBounty.setDAOGovernance(await taskDAO.getAddress());
    await reputationNFT.transferOwnership(await taskBounty.getAddress());

    // Transfer tokens to creator
    bountyAmount = ethers.parseEther("100");
    await taskToken.transfer(creator.address, ethers.parseEther("1000"));
  });

  describe("Task Creation", function () {
    it("Should create a task with escrow", async function () {
      await taskToken.connect(creator).approve(await taskBounty.getAddress(), bountyAmount);
      
      const deadline = (await time.latest()) + 86400; // 1 day
      
      await expect(
        taskBounty.connect(creator).createTask(
          "Build a website",
          "QmHash123",
          bountyAmount,
          deadline
        )
      ).to.emit(taskBounty, "TaskCreated");

      const task = await taskBounty.getTask(0);
      expect(task.creator).to.equal(creator.address);
      expect(task.bounty).to.equal(bountyAmount);
      expect(task.status).to.equal(0); // Open
    });

    it("Should fail if bounty is 0", async function () {
      const deadline = (await time.latest()) + 86400;
      
      await expect(
        taskBounty.connect(creator).createTask(
          "Build a website",
          "QmHash123",
          0,
          deadline
        )
      ).to.be.revertedWith("Bounty must be greater than 0");
    });
  });

  describe("Task Assignment", function () {
    let taskId;

    beforeEach(async function () {
      await taskToken.connect(creator).approve(await taskBounty.getAddress(), bountyAmount);
      const deadline = (await time.latest()) + 86400;
      
      await taskBounty.connect(creator).createTask(
        "Build a website",
        "QmHash123",
        bountyAmount,
        deadline
      );
      taskId = 0;
    });

    it("Should assign task to worker", async function () {
      await expect(
        taskBounty.connect(creator).assignTask(taskId, worker.address)
      ).to.emit(taskBounty, "TaskAssigned");

      const task = await taskBounty.getTask(taskId);
      expect(task.assignee).to.equal(worker.address);
      expect(task.status).to.equal(1); // Assigned
    });

    it("Should fail if non-creator tries to assign", async function () {
      await expect(
        taskBounty.connect(other).assignTask(taskId, worker.address)
      ).to.be.revertedWith("Only creator can assign");
    });
  });

  describe("Task Completion", function () {
    let taskId;

    beforeEach(async function () {
      await taskToken.connect(creator).approve(await taskBounty.getAddress(), bountyAmount);
      const deadline = (await time.latest()) + 86400;
      
      await taskBounty.connect(creator).createTask(
        "Build a website",
        "QmHash123",
        bountyAmount,
        deadline
      );
      taskId = 0;
      
      await taskBounty.connect(creator).assignTask(taskId, worker.address);
    });

    it("Should allow worker to submit task", async function () {
      await expect(
        taskBounty.connect(worker).submitTask(taskId)
      ).to.emit(taskBounty, "TaskSubmitted");

      const task = await taskBounty.getTask(taskId);
      expect(task.status).to.equal(2); // Submitted
    });

    it("Should complete task and release funds", async function () {
      await taskBounty.connect(worker).submitTask(taskId);

      const workerBalanceBefore = await taskToken.balanceOf(worker.address);
      
      await expect(
        taskBounty.connect(creator).approveTask(taskId)
      ).to.emit(taskBounty, "TaskCompleted");

      const workerBalanceAfter = await taskToken.balanceOf(worker.address);
      const task = await taskBounty.getTask(taskId);
      
      expect(task.status).to.equal(3); // Completed
      expect(task.fundsReleased).to.be.true;
      expect(workerBalanceAfter).to.be.gt(workerBalanceBefore);
    });
  });

  describe("Task Cancellation", function () {
    let taskId;

    beforeEach(async function () {
      await taskToken.connect(creator).approve(await taskBounty.getAddress(), bountyAmount);
      const deadline = (await time.latest()) + 86400;
      
      await taskBounty.connect(creator).createTask(
        "Build a website",
        "QmHash123",
        bountyAmount,
        deadline
      );
      taskId = 0;
    });

    it("Should allow creator to cancel open task", async function () {
      const creatorBalanceBefore = await taskToken.balanceOf(creator.address);
      
      await expect(
        taskBounty.connect(creator).cancelTask(taskId)
      ).to.emit(taskBounty, "TaskCancelled");

      const creatorBalanceAfter = await taskToken.balanceOf(creator.address);
      const task = await taskBounty.getTask(taskId);
      
      expect(task.status).to.equal(5); // Cancelled
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore + bountyAmount);
    });
  });

  describe("Dispute Resolution", function () {
    let taskId;

    beforeEach(async function () {
      await taskToken.connect(creator).approve(await taskBounty.getAddress(), bountyAmount);
      const deadline = (await time.latest()) + 86400;
      
      await taskBounty.connect(creator).createTask(
        "Build a website",
        "QmHash123",
        bountyAmount,
        deadline
      );
      taskId = 0;
      
      await taskBounty.connect(creator).assignTask(taskId, worker.address);
      await taskBounty.connect(worker).submitTask(taskId);
    });

    it("Should create dispute", async function () {
      await expect(
        taskBounty.connect(creator).createDispute(taskId, "Work not satisfactory")
      ).to.emit(taskBounty, "DisputeCreated");

      const task = await taskBounty.getTask(taskId);
      expect(task.status).to.equal(4); // Disputed
    });

    it("Should resolve dispute in favor of worker", async function () {
      await taskBounty.connect(creator).createDispute(taskId, "Work not satisfactory");
      
      const workerBalanceBefore = await taskToken.balanceOf(worker.address);
      
      await expect(
        taskBounty.connect(owner).resolveDispute(0, worker.address)
      ).to.emit(taskBounty, "DisputeResolved");

      const workerBalanceAfter = await taskToken.balanceOf(worker.address);
      expect(workerBalanceAfter).to.be.gt(workerBalanceBefore);
    });

    it("Should resolve dispute in favor of creator", async function () {
      await taskBounty.connect(creator).createDispute(taskId, "Work not satisfactory");
      
      const creatorBalanceBefore = await taskToken.balanceOf(creator.address);
      
      await taskBounty.connect(owner).resolveDispute(0, creator.address);

      const creatorBalanceAfter = await taskToken.balanceOf(creator.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore + bountyAmount);
    });
  });
});
