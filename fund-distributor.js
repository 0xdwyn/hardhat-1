const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const out = JSON.parse(fs.readFileSync("merkle/merkle.json", "utf8"));
  const tokenAddr = process.env.TOKEN_ADDRESS;
  const distributorAddr = process.env.DISTRIBUTOR_ADDRESS;
  if (!tokenAddr || !distributorAddr) throw new Error("Set TOKEN_ADDRESS and DISTRIBUTOR_ADDRESS in .env");

  const total = out.totalAmount;
  const Token = await hre.ethers.getContractAt("AirdropToken", tokenAddr, signer);
  console.log("Minting total to distributor:", total);
  const tx1 = await Token.mint(distributorAddr, total);
  await tx1.wait();
  console.log("Minted.");

  console.log("Updating merkle root on distributor:", out.merkleRoot);
  const Distributor = await hre.ethers.getContractAt("AirdropDistributor", distributorAddr, signer);
  const tx2 = await Distributor.updateMerkleRoot(out.merkleRoot);
  await tx2.wait();
  console.log("Updated root.");
}

main().catch((e) => { console.error(e); process.exit(1); });
