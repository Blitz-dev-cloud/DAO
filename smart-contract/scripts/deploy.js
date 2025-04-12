const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  console.log("Starting deployment...");

  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const DAO = await ethers.getContractFactory("DAO");

  const initialSupply = ethers.parseEther("1000");
  console.log(
    `Deploying GovernanceToken with initial supply: ${ethers.formatEther(
      initialSupply
    )} tokens`
  );
  const governanceToken = await GovernanceToken.deploy(initialSupply);
  await governanceToken.waitForDeployment();

  const governanceTokenAddress = await governanceToken.getAddress();
  console.log(`GovernanceToken deployed to: ${governanceTokenAddress}`);

  const quorum = ethers.parseEther("10");
  console.log(
    `Deploying DAO with quorum: ${ethers.formatEther(quorum)} tokens`
  );

  const dao = await DAO.deploy(governanceTokenAddress, quorum);
  await dao.waitForDeployment();

  const daoAddress = await dao.getAddress();
  console.log(`DAO deployed to: ${daoAddress}`);

  // Verify ownership
  const daoOwner = await dao.owner();
  const tokenOwner = await governanceToken.owner();
  console.log(`DAO owner is now: ${daoOwner}`);
  console.log(`Token owner is now: ${tokenOwner}`);

  console.log("Deployment complete!");

  return {
    governanceToken: governanceTokenAddress,
    dao: daoAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
