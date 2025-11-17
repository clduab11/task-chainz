const hre = require("hardhat");

async function main() {
  console.log("Deploying Task-Chainz contracts...");

  // Deploy TaskChainzToken
  console.log("\n1. Deploying TaskChainzToken...");
  const TaskChainzToken = await hre.ethers.getContractFactory("TaskChainzToken");
  const taskToken = await TaskChainzToken.deploy();
  await taskToken.waitForDeployment();
  const taskTokenAddress = await taskToken.getAddress();
  console.log("TaskChainzToken deployed to:", taskTokenAddress);

  // Deploy ReputationNFT
  console.log("\n2. Deploying ReputationNFT...");
  const ReputationNFT = await hre.ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("ReputationNFT deployed to:", reputationNFTAddress);

  // Deploy TaskBounty
  console.log("\n3. Deploying TaskBounty...");
  const TaskBounty = await hre.ethers.getContractFactory("TaskBounty");
  const taskBounty = await TaskBounty.deploy(taskTokenAddress, reputationNFTAddress);
  await taskBounty.waitForDeployment();
  const taskBountyAddress = await taskBounty.getAddress();
  console.log("TaskBounty deployed to:", taskBountyAddress);

  // Deploy TaskDAO
  console.log("\n4. Deploying TaskDAO...");
  const TaskDAO = await hre.ethers.getContractFactory("TaskDAO");
  const taskDAO = await TaskDAO.deploy(taskTokenAddress);
  await taskDAO.waitForDeployment();
  const taskDAOAddress = await taskDAO.getAddress();
  console.log("TaskDAO deployed to:", taskDAOAddress);

  // Set DAO governance in TaskBounty
  console.log("\n5. Configuring contracts...");
  await taskBounty.setDAOGovernance(taskDAOAddress);
  console.log("DAO governance set in TaskBounty");

  // Transfer ReputationNFT ownership to TaskBounty
  await reputationNFT.transferOwnership(taskBountyAddress);
  console.log("ReputationNFT ownership transferred to TaskBounty");

  console.log("\n✅ All contracts deployed successfully!");
  console.log("\nContract Addresses:");
  console.log("==================");
  console.log("TaskChainzToken:", taskTokenAddress);
  console.log("ReputationNFT:", reputationNFTAddress);
  console.log("TaskBounty:", taskBountyAddress);
  console.log("TaskDAO:", taskDAOAddress);

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      TaskChainzToken: taskTokenAddress,
      ReputationNFT: reputationNFTAddress,
      TaskBounty: taskBountyAddress,
      TaskDAO: taskDAOAddress
    }
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to ${deploymentsDir}/${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
