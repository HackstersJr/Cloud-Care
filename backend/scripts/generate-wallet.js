#!/usr/bin/env node

/**
 * CloudCare Wallet Generator
 * Generates a new Ethereum-compatible wallet for Polygon Amoy testnet
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

console.log('🔑 CloudCare Wallet Generator for Polygon Amoy\n');

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('✅ New wallet generated successfully!\n');
console.log('📄 Wallet Details:');
console.log('================');
console.log(`Address:     ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log(`Mnemonic:    ${wallet.mnemonic.phrase}\n`);

// Create .env entry
const envEntry = `# Polygon Amoy Wallet Configuration
PRIVATE_KEY=${wallet.privateKey.slice(2)}  # Remove 0x prefix
WALLET_ADDRESS=${wallet.address}`;

console.log('🔧 Environment Configuration:');
console.log('=============================');
console.log(envEntry);
console.log('');

// Ask if user wants to save to .env file
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('💾 Save private key to .env file? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    const envPath = path.join(__dirname, '.env');
    
    // Check if .env exists
    if (fs.existsSync(envPath)) {
      console.log('\n⚠️  .env file already exists!');
      rl.question('Append to existing .env file? (y/N): ', (appendAnswer) => {
        if (appendAnswer.toLowerCase() === 'y' || appendAnswer.toLowerCase() === 'yes') {
          fs.appendFileSync(envPath, '\n\n' + envEntry + '\n');
          console.log('✅ Private key appended to .env file');
        } else {
          console.log('❌ Private key not saved');
        }
        showNextSteps();
        rl.close();
      });
    } else {
      // Create new .env file with template
      const envTemplate = `# CloudCare Backend Environment Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudcare_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_chars
JWT_EXPIRES_IN=24h

${envEntry}

# Blockchain Configuration - Polygon Amoy Testnet
BLOCKCHAIN_NETWORK=polygon-amoy
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CHAIN_ID=80002
GAS_LIMIT=500000
GAS_PRICE=20000000000
`;
      
      fs.writeFileSync(envPath, envTemplate);
      console.log('✅ .env file created with wallet configuration');
      showNextSteps();
      rl.close();
    }
  } else {
    console.log('❌ Private key not saved - remember to add it manually to your .env file');
    showNextSteps();
    rl.close();
  }
});

function showNextSteps() {
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('1. 💰 Get test tokens from faucets:');
  console.log('   • Alchemy: https://www.alchemy.com/faucets/polygon-amoy');
  console.log('   • QuickNode: https://faucet.quicknode.com/polygon');
  console.log('   • GetBlock: https://getblock.io/faucet/matic-amoy/');
  console.log('');
  console.log('2. 🔗 Add Polygon Amoy to MetaMask:');
  console.log('   • Network: Polygon Amoy');
  console.log('   • RPC: https://rpc-amoy.polygon.technology/');
  console.log('   • Chain ID: 80002');
  console.log('   • Symbol: POL');
  console.log('');
  console.log('3. 🧪 Test your setup:');
  console.log('   npm run build && npm run test:blockchain');
  console.log('');
  console.log('4. 🏥 Start using blockchain features in CloudCare!');
  console.log('');
  console.log('💡 Your wallet address for faucets: ' + wallet.address);
  console.log('');
  console.log('⚠️  SECURITY REMINDER:');
  console.log('   • This is a TEST wallet for development only');
  console.log('   • Never use this private key on mainnet');
  console.log('   • Keep your private key secure and never share it');
}
