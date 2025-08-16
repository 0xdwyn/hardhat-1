import fs from "fs";
import path from "path";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";

/**
 * Input: airdrop/airdrop.csv with header:
 * address,amount
 * 0xabc...,1000
 * 0xdef...,2500
 *
 * Output: merkle/merkle.json containing root and proofs.
 */

const inputPath = "airdrop/airdrop.csv";
if (!fs.existsSync(inputPath)) {
  fs.mkdirSync("airdrop", { recursive: true });
  fs.writeFileSync(
    inputPath,
    "address,amount\n0x0000000000000000000000000000000000000000,1000\n",
    "utf8"
  );
  console.log("Created example airdrop/airdrop.csv. Edit it and re-run.");
  process.exit(0);
}

const rows = fs.readFileSync(inputPath, "utf8").trim().split(/\r?\n/);
const header = rows.shift().split(",");
if (header[0] !== "address" || header[1] !== "amount") {
  throw new Error("CSV header must be: address,amount");
}

const allocations = [];
for (const line of rows) {
  const [address, amountStr] = line.split(",");
  const amount = BigInt(amountStr);
  allocations.push({ address, amount });
}

// Build leaves as keccak256(abi.encode(address, amount))
const leaves = allocations.map(({ address, amount }) => Buffer.from(keccak256(Buffer.concat([
  Buffer.from(keccak256(Buffer.from(address.replace(/^0x/, ""), "hex"))),
  Buffer.from(keccak256(Buffer.from(amount.toString())))
]).toString("hex"), "hex"));

const tree = new MerkleTree(leaves, (d)=>keccak256(d), { sortPairs: true });
const root = "0x" + tree.getRoot().toString("hex");

const proofs = {};
let total = 0n;
allocations.forEach(({ address, amount }, i) => {
  const leaf = leaves[i];
  const proof = tree.getHexProof(leaf);
  proofs[address.toLowerCase()] = { amount: amount.toString(), proof };
  total += amount;
});

const outDir = "merkle";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "merkle.json"), JSON.stringify({
  merkleRoot: root,
  totalAmount: total.toString(),
  proofs
}, null, 2));

console.log("Merkle root:", root);
console.log("Total amount:", total.toString());
console.log("Wrote merkle/merkle.json");
