# Testnet Airdrop (Hardhat + Merkle)

Siap pakai untuk airdrop di testnet (contoh: Sepolia). Fitur:
- Token ERC20 sederhana dengan fungsi `mint` (owner only)
- Kontrak Distributor airdrop pakai Merkle Tree (1 klaim per alamat)
- Script untuk generate root/proof dari CSV, deploy, fund distributor, dan klaim demo

## Persiapan
1. **Node.js 18+** terpasang.
2. `npm install` di folder proyek.
3. Duplikasi `.env.example` jadi `.env` dan isi:
   - `SEPOLIA_RPC_URL` (RPC dari Alchemy/Infura/dll)
   - `PRIVATE_KEY` (wallet yang akan deploy)
   - optional `ETHERSCAN_API_KEY`
4. Edit daftar penerima di `airdrop/airdrop.csv` (format: `address,amount`).

## Alur Cepat
```bash
# 1) Install dependencies
npm install

# 2) Generate Merkle root & proofs dari CSV
npm run generate:merkle

# 3) Deploy token & distributor (deadline default = 14 hari dari deploy)
npm run deploy

# Catat alamat yang muncul -> isi TOKEN_ADDRESS & DISTRIBUTOR_ADDRESS di .env

# 4) Mint total supply ke distributor + set merkleRoot
npm run fund:distributor

# 5) (Opsional) Coba klaim dengan akun di PRIVATE_KEY (harus ada di CSV)
npm run claim:demo
```

## Cara Kerja
- Leaf = `keccak256(abi.encode(address, amount))`.
- Klaim: user panggil `claim(amount, proof)`; kontrak verifikasi proof, cek `claimed`, lalu transfer token.
- Owner bisa update `merkleRoot` **sebelum** `deadline`. Setelah lewat, owner bisa `rescueUnclaimed(to)` untuk menarik sisa token.

## Testnet lain
Ganti konfigurasi network di `hardhat.config.js` dan tambahkan RPC/accounts sesuai chain testnet pilihan (BSC Testnet, Arbitrum Sepolia, dll).

## Catatan
- Setiap alamat hanya punya satu alokasi (mapping `claimed[address]`). Jika butuh multi-vesting/round, buat distributor baru per round.
- Kontrak menggunakan OpenZeppelin v5.
- Audit mandiri sebelum mainnet.
