import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TaskToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TaskToken", function () {
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens

  async function deployTokenFixture() {
    const [owner, minter, user1, user2] = await ethers.getSigners();
    const TaskToken = await ethers.getContractFactory("TaskToken");
    const taskToken = await TaskToken.deploy(INITIAL_SUPPLY);

    return { taskToken, owner, minter, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { taskToken } = await loadFixture(deployTokenFixture);
      expect(await taskToken.name()).to.equal("TaskChainz Token");
      expect(await taskToken.symbol()).to.equal("TASK");
    });

    it("Should mint initial supply to deployer", async function () {
      const { taskToken, owner } = await loadFixture(deployTokenFixture);
      expect(await taskToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set deployer as admin and minter", async function () {
      const { taskToken, owner } = await loadFixture(deployTokenFixture);
      const DEFAULT_ADMIN_ROLE = await taskToken.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await taskToken.MINTER_ROLE();

      expect(await taskToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await taskToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should revert if initial supply exceeds max supply", async function () {
      const TaskToken = await ethers.getContractFactory("TaskToken");
      const maxSupply = ethers.parseEther("1000000001"); // 1 billion + 1

      await expect(TaskToken.deploy(maxSupply)).to.be.revertedWithCustomError(
        TaskToken,
        "ExceedsMaxSupply"
      );
    });

    it("Should allow zero initial supply", async function () {
      const TaskToken = await ethers.getContractFactory("TaskToken");
      const taskToken = await TaskToken.deploy(0);
      const [owner] = await ethers.getSigners();

      expect(await taskToken.balanceOf(owner.address)).to.equal(0);
      expect(await taskToken.totalMinted()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint with reason", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await expect(taskToken.connect(owner)["mint(address,uint256,string)"](
        user1.address,
        amount,
        "Task completion"
      ))
        .to.emit(taskToken, "TokensMinted")
        .withArgs(user1.address, amount, "Task completion");

      expect(await taskToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should allow minter to mint without reason", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await taskToken.connect(owner)["mint(address,uint256)"](user1.address, amount);
      expect(await taskToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should revert when non-minter tries to mint", async function () {
      const { taskToken, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await expect(
        taskToken.connect(user1)["mint(address,uint256)"](user2.address, amount)
      ).to.be.reverted;
    });

    it("Should revert when minting to zero address", async function () {
      const { taskToken, owner } = await loadFixture(deployTokenFixture);

      await expect(
        taskToken.connect(owner)["mint(address,uint256)"](ethers.ZeroAddress, 100)
      ).to.be.revertedWithCustomError(taskToken, "ZeroAddress");
    });

    it("Should revert when minting zero amount", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);

      await expect(
        taskToken.connect(owner)["mint(address,uint256)"](user1.address, 0)
      ).to.be.revertedWithCustomError(taskToken, "ZeroAmount");
    });

    it("Should revert when exceeding max supply", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);
      const maxSupply = await taskToken.MAX_SUPPLY();
      const remaining = maxSupply - INITIAL_SUPPLY;
      const excess = remaining + ethers.parseEther("1");

      await expect(
        taskToken.connect(owner)["mint(address,uint256)"](user1.address, excess)
      ).to.be.revertedWithCustomError(taskToken, "ExceedsMaxSupply");
    });

    it("Should track total minted correctly", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await taskToken.connect(owner)["mint(address,uint256)"](user1.address, amount);
      expect(await taskToken.totalMinted()).to.equal(INITIAL_SUPPLY + amount);
    });
  });

  describe("Minter Management", function () {
    it("Should allow admin to add minter", async function () {
      const { taskToken, owner, minter } = await loadFixture(deployTokenFixture);

      await expect(taskToken.addMinter(minter.address))
        .to.emit(taskToken, "MinterAdded")
        .withArgs(minter.address);

      expect(await taskToken.isMinter(minter.address)).to.be.true;
    });

    it("Should allow admin to remove minter", async function () {
      const { taskToken, owner, minter } = await loadFixture(deployTokenFixture);

      await taskToken.addMinter(minter.address);
      await expect(taskToken.removeMinter(minter.address))
        .to.emit(taskToken, "MinterRemoved")
        .withArgs(minter.address);

      expect(await taskToken.isMinter(minter.address)).to.be.false;
    });

    it("Should revert when non-admin tries to add minter", async function () {
      const { taskToken, user1, user2 } = await loadFixture(deployTokenFixture);

      await expect(taskToken.connect(user1).addMinter(user2.address)).to.be.reverted;
    });

    it("Should revert when adding zero address as minter", async function () {
      const { taskToken, owner } = await loadFixture(deployTokenFixture);

      await expect(taskToken.addMinter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        taskToken,
        "ZeroAddress"
      );
    });
  });

  describe("Burning", function () {
    it("Should allow token holder to burn", async function () {
      const { taskToken, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("100");

      await taskToken.burn(burnAmount);
      expect(await taskToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct remaining mintable supply", async function () {
      const { taskToken } = await loadFixture(deployTokenFixture);
      const maxSupply = await taskToken.MAX_SUPPLY();
      const expected = maxSupply - INITIAL_SUPPLY;

      expect(await taskToken.remainingMintableSupply()).to.equal(expected);
    });
  });

  describe("ERC20 Permit", function () {
    it("Should support permit", async function () {
      const { taskToken, owner, user1 } = await loadFixture(deployTokenFixture);
      const value = ethers.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await taskToken.nonces(owner.address);

      const domain = {
        name: "TaskChainz Token",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await taskToken.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: owner.address,
        spender: user1.address,
        value: value,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await owner.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(signature);

      await taskToken.permit(owner.address, user1.address, value, deadline, v, r, s);
      expect(await taskToken.allowance(owner.address, user1.address)).to.equal(value);
    });
  });
});
