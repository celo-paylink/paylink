const hre = require("hardhat");
const { verify } = require("../utils/verify.js");
require("dotenv").config();
async function main() {
  const [deployer, buyer] = await hre.ethers.getSigners();

  // Deploy Cr8or
  const payLink = await hre.ethers.deployContract("Paylink");
  await payLink.waitForDeployment();
  console.log("PayLink Contract Deployed at " + payLink.target);
  console.log("");

  // Verify contracts (optional, only if you have an etherscan key and on testnet/mainnet)

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contracts...");
    await verify(payLink.target, [], "contracts/Paylink.sol:Paylink");
  } else {
    console.log("Skipping verification on local network");
  }
  console.log("");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
