import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting Task Chainz deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy TaskChainzToken
  console.log("📝 Deploying TaskChainzToken...");
  const TaskChainzToken = await ethers.getContractFactory("TaskChainzToken");
  const token = await TaskChainzToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ TaskChainzToken deployed to:", tokenAddress);

  // 2. Deploy ReputationNFT
  console.log("\n📝 Deploying ReputationNFT...");
  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("✅ ReputationNFT deployed to:", reputationNFTAddress);

  // 3. Deploy TaskManager
  console.log("\n📝 Deploying TaskManager...");
  const feeCollector = deployer.address; // For now, use deployer as fee collector
  const TaskManager = await ethers.getContractFactory("TaskManager");
  const taskManager = await TaskManager.deploy(tokenAddress, reputationNFTAddress, feeCollector);
  await taskManager.waitForDeployment();
  const taskManagerAddress = await taskManager.getAddress();
  console.log("✅ TaskManager deployed to:", taskManagerAddress);

  // 4. Deploy Gamification
  console.log("\n📝 Deploying Gamification...");
  const Gamification = await ethers.getContractFactory("Gamification");
  const gamification = await Gamification.deploy(tokenAddress);
  await gamification.waitForDeployment();
  const gamificationAddress = await gamification.getAddress();
  console.log("✅ Gamification deployed to:", gamificationAddress);

  // 5. Deploy Timelock for DAO
  console.log("\n📝 Deploying TimelockController...");
  const minDelay = 86400; // 1 day
  const proposers: string[] = [];
  const executors: string[] = [];
  const admin = deployer.address;

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(minDelay, proposers, executors, admin);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("✅ TimelockController deployed to:", timelockAddress);

  // 6. Deploy DAO
  console.log("\n📝 Deploying TaskChainzDAO...");
  const votingDelay = 1; // 1 block
  const votingPeriod = 50400; // ~1 week (assuming 12s blocks)
  const proposalThreshold = ethers.parseEther("1000"); // 1000 tokens to create proposal
  const quorumPercentage = 4; // 4% quorum

  const TaskChainzDAO = await ethers.getContractFactory("TaskChainzDAO");
  const dao = await TaskChainzDAO.deploy(
    tokenAddress,
    timelockAddress,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumPercentage
  );
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ TaskChainzDAO deployed to:", daoAddress);

  // 7. Setup roles and permissions
  console.log("\n🔧 Setting up roles and permissions...");

  // Grant TaskManager the ability to manage reputation
  const REPUTATION_MANAGER_ROLE = await reputationNFT.REPUTATION_MANAGER_ROLE();
  const MINTER_ROLE = await reputationNFT.MINTER_ROLE();
  await reputationNFT.grantRole(REPUTATION_MANAGER_ROLE, taskManagerAddress);
  await reputationNFT.grantRole(MINTER_ROLE, taskManagerAddress);
  console.log("✅ Granted TaskManager reputation roles");

  // Grant DAO dispute resolver role
  const DISPUTE_RESOLVER_ROLE = await taskManager.DISPUTE_RESOLVER_ROLE();
  await taskManager.grantRole(DISPUTE_RESOLVER_ROLE, daoAddress);
  console.log("✅ Granted DAO dispute resolver role");

  // Grant TaskManager and Gamification minter roles for rewards
  const TOKEN_MINTER_ROLE = await token.MINTER_ROLE();
  await token.grantRole(TOKEN_MINTER_ROLE, taskManagerAddress);
  await token.grantRole(TOKEN_MINTER_ROLE, gamificationAddress);
  console.log("✅ Granted minter roles");

  // Setup DAO roles in timelock
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, daoAddress);
  await timelock.grantRole(EXECUTOR_ROLE, daoAddress);
  console.log("✅ Granted DAO timelock roles");

  // 8. Fund gamification contract for bonuses
  console.log("\n💰 Funding Gamification contract...");
  const gamificationFunding = ethers.parseEther("1000000"); // 1M tokens
  await token.transfer(gamificationAddress, gamificationFunding);
  console.log("✅ Transferred", ethers.formatEther(gamificationFunding), "TASKZ to Gamification");

  // 9. Save deployment addresses
  const deploymentData = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TaskChainzToken: tokenAddress,
      ReputationNFT: reputationNFTAddress,
      TaskManager: taskManagerAddress,
      Gamification: gamificationAddress,
      TimelockController: timelockAddress,
      TaskChainzDAO: daoAddress,
    },
    configuration: {
      platformFeePercent: "250", // 2.5%
      referralBonusPercent: "500", // 5%
      votingDelay,
      votingPeriod,
      proposalThreshold: ethers.formatEther(proposalThreshold),
      quorumPercentage,
      timelockDelay: minDelay,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = (await ethers.provider.getNetwork()).name || "unknown";
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentFile);

  console.log("\n✅ Deployment completed successfully!\n");
  console.log("📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TaskChainzToken:     ", tokenAddress);
  console.log("ReputationNFT:       ", reputationNFTAddress);
  console.log("TaskManager:         ", taskManagerAddress);
  console.log("Gamification:        ", gamificationAddress);
  console.log("TimelockController:  ", timelockAddress);
  console.log("TaskChainzDAO:       ", daoAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network ${networkName} ${tokenAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${reputationNFTAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${taskManagerAddress} ${tokenAddress} ${reputationNFTAddress} ${feeCollector}`);
  console.log(`npx hardhat verify --network ${networkName} ${gamificationAddress} ${tokenAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${timelockAddress} ${minDelay} "[]" "[]" ${admin}`);
  console.log(`npx hardhat verify --network ${networkName} ${daoAddress} ${tokenAddress} ${timelockAddress} ${votingDelay} ${votingPeriod} ${proposalThreshold} ${quorumPercentage}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
