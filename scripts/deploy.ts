import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TaskToken
  const initialSupply = ethers.parseEther("100000000"); // 100 million initial supply
  const TaskToken = await ethers.getContractFactory("TaskToken");
  const taskToken = await TaskToken.deploy(initialSupply);
  await taskToken.waitForDeployment();

  const taskTokenAddress = await taskToken.getAddress();
  console.log("TaskToken deployed to:", taskTokenAddress);

  // Deploy TaskChainz
  const feeRecipient = deployer.address; // Use deployer as initial fee recipient
  const TaskChainz = await ethers.getContractFactory("TaskChainz");
  const taskChainz = await TaskChainz.deploy(taskTokenAddress, feeRecipient);
  await taskChainz.waitForDeployment();

  const taskChainzAddress = await taskChainz.getAddress();
  console.log("TaskChainz deployed to:", taskChainzAddress);

  // Grant MINTER_ROLE to TaskChainz contract
  const MINTER_ROLE = await taskToken.MINTER_ROLE();
  await taskToken.grantRole(MINTER_ROLE, taskChainzAddress);
  console.log("Granted MINTER_ROLE to TaskChainz contract");

  // Output deployment info
  console.log("\n--- Deployment Summary ---");
  console.log("TaskToken:", taskTokenAddress);
  console.log("TaskChainz:", taskChainzAddress);
  console.log("Fee Recipient:", feeRecipient);
  console.log("Initial Supply:", ethers.formatEther(initialSupply), "TASK");

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    taskToken: taskTokenAddress,
    taskChainz: taskChainzAddress,
    feeRecipient: feeRecipient,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
