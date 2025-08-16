import fs from "fs";
import { ethers } from "ethers";
import 'dotenv/config';

const RPC = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_ADDRESS;
if (!RPC || !PRIVATE_KEY || !DISTRIBUTOR_ADDRESS) {
  throw new Error("Set SEPOLIA_RPC_URL, PRIVATE_KEY, DISTRIBUTOR_ADDRESS in .env");
}

const merkle = JSON.parse(fs.readFileSync("merkle/merkle.json", "utf8"));
const me = new ethers.Wallet(PRIVATE_KEY);
const lower = me.address.toLowerCase();
if (!merkle.proofs[lower]) {
  throw new Error("Your address is not in the airdrop.csv—add it and rebuild merkle.");
}

const { amount, proof } = merkle.proofs[lower];
const provider = new ethers.JsonRpcProvider(RPC);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const abi = [
  "function claim(uint256 amount, bytes32[] proof) external",
  "function claimed(address) view returns (bool)"
];
const distributor = new ethers.Contract(DISTRIBUTOR_ADDRESS, abi, signer);

const already = await distributor.claimed(signer.address);
if (already) {
  console.log("Already claimed.");
  process.exit(0);
}

console.log("Claiming", amount, "tokens...");
const tx = await distributor.claim(amount, proof);
await tx.wait();
console.log("Claim TX mined:", tx.hash);
