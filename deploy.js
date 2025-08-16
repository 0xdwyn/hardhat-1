const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy token
  const Token = await hre.ethers.getContractFactory("AirdropToken");
  const token = await Token.deploy("Airdrop Token", "ADT");
  await token.waitForDeployment();
  console.log("Token deployed:", await token.getAddress());

  // 2) Deploy distributor with dummy root (update later)
  const now = Math.floor(Date.now() / 1000);
  const deadline = now + 60 * 60 * 24 * 14; // 14 days from now
  const Distributor = await hre.ethers.getContractFactory("AirdropDistributor");
  const distributor = await Distributor.deploy(await token.getAddress(), hre.ethers.ZeroHash, deadline);
  await distributor.waitForDeployment();
  console.log("Distributor deployed:", await distributor.getAddress());

  // 3) Transfer ownership of token to deployer remains (you can keep it)
  // Mint and fund distributor will be done in a separate step.

  console.log("Done. Next: generate Merkle, update root, mint+fund distributor.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
