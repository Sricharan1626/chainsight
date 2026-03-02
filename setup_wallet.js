const fs = require('fs');
const algosdk = require('algosdk');

const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

const envContent = `
# PostgreSQL Database Connection String
DATABASE_URL=postgresql://user:password@localhost:5432/supply_chain_db

# Algorand Testnet Central Wallet Mnemonic (25 words)
ALGORAND_WALLET_MNEMONIC="${mnemonic}"
`;

// Write to .env
fs.writeFileSync('.env', envContent.trim());

console.log('✅ Generated new Algorand Testnet Account and saved to .env');
console.log('');
console.log('Public Address:');
console.log(account.addr);
console.log('');
console.log('Please fund this address using the Algorand Testnet Dispenser:');
console.log('👉 https://bank.testnet.algorand.network/');
