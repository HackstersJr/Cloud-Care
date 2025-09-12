# 🔑 Wallet Setup & Test Tokens Guide

## Step-by-Step Wallet Creation & Token Setup

### Method 1: Using MetaMask (Recommended for Beginners)

#### 1. Install MetaMask
- Visit [metamask.io](https://metamask.io/)
- Download and install the browser extension
- Create a new wallet or import existing one

#### 2. Add Polygon Amoy Network to MetaMask

**Option A: Automatic Setup**
1. Visit [chainlist.org](https://chainlist.org/)
2. Search for "Polygon Amoy"
3. Click "Add to MetaMask"

**Option B: Manual Setup**
1. Open MetaMask
2. Click network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Enter these details:

```
Network Name: Polygon Amoy
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: POL
Block Explorer: https://amoy.polygonscan.com/
```

5. Click "Save"

#### 3. Get Your Wallet Address
1. Open MetaMask
2. Switch to "Polygon Amoy" network
3. Click on your account name to copy wallet address
4. It will look like: `0x742d35Cc6634C0532925a3b8D0B4E3A8b0f4E4b8`

### Method 2: Using Command Line (For Developers)

#### 1. Install ethers-cli
```bash
npm install -g ethers-cli
```

#### 2. Generate New Wallet
```bash
# Generate a new random wallet
npx ethers-cli generate-wallet

# Output will show:
# Address: 0x...
# Private Key: 0x...
# Mnemonic: word1 word2 word3...
```

#### 3. Save Credentials Securely
```bash
# Create .env file in your backend directory
echo "PRIVATE_KEY=your_private_key_here" >> .env
```

### Method 3: Using Your Existing Setup

If you already have a development wallet, you can use our built-in tools:

```bash
# Navigate to your backend directory
cd d:\CloudCare\backend

# Test wallet connection
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('New Wallet Created:');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
"
```

## 💰 Getting Test Tokens (POL)

### Faucet 1: Alchemy Faucet (Recommended)
1. Visit: https://www.alchemy.com/faucets/polygon-amoy
2. Enter your wallet address
3. Complete any verification (Google sign-in may give more tokens)
4. Click "Send Me POL"
5. **Receive**: 0.2-0.5 POL per day

### Faucet 2: QuickNode Faucet
1. Visit: https://faucet.quicknode.com/polygon
2. Connect your wallet (MetaMask/Coinbase/Phantom)
3. Choose "Amoy" network
4. Click "Continue"
5. **Receive**: 0.1-0.25 POL

### Faucet 3: GetBlock Faucet
1. Visit: https://getblock.io/faucet/matic-amoy/
2. Sign up for free account
3. Enter wallet address
4. Complete verification
5. **Receive**: 0.1 POL
6. **Bonus**: Tweet about the faucet for extra tokens

### Faucet 4: StakePool Faucet
1. Visit: https://stakely.io/en/faucet/polygon-amoy-testnet
2. Enter wallet address
3. Complete CAPTCHA
4. **Receive**: 0.5 POL

## 🔧 Configure CloudCare with Your Wallet

### 1. Update Environment Variables
```bash
# Edit your .env file
cd d:\CloudCare\backend
notepad .env
```

Add these lines:
```bash
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Polygon Amoy configuration (already set)
BLOCKCHAIN_NETWORK=polygon-amoy
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CHAIN_ID=80002
```

### 2. Test Your Configuration
```bash
# Test blockchain connection with your wallet
node -e "
const { blockchainService } = require('./dist/services/blockchainService');
(async () => {
  console.log('Testing wallet connection...');
  
  const status = blockchainService.getConnectionStatus();
  console.log('Connection Status:', status);
  
  if (status.walletConnected) {
    const balance = await blockchainService.getWalletBalance();
    console.log('Wallet Balance:', balance, 'POL');
    
    const costs = await blockchainService.estimateStorageCost();
    console.log('Transaction Cost:', costs.estimatedCost, 'POL');
  } else {
    console.log('❌ Wallet not connected - check PRIVATE_KEY in .env');
  }
})().catch(console.error);
"
```

## 🧪 Test Medical Record Storage

Once you have tokens, test the full blockchain functionality:

```bash
# Test storing a medical record hash
node -e "
const { blockchainService } = require('./dist/services/blockchainService');
(async () => {
  console.log('Testing medical record storage...');
  
  // Generate sample medical data hash
  const medicalData = {
    patientId: 'test-patient-123',
    diagnosis: 'Routine Checkup',
    timestamp: new Date().toISOString()
  };
  
  const dataHash = blockchainService.generateDataHash(medicalData);
  console.log('Generated Hash:', dataHash);
  
  // Check if we have enough balance
  const balance = await blockchainService.getWalletBalance();
  console.log('Wallet Balance:', balance, 'POL');
  
  if (parseFloat(balance) > 0.001) {
    console.log('✅ Sufficient balance for testing');
    
    // Optionally store on blockchain (uncomment to test)
    // const result = await blockchainService.storeMedicalRecordHash(
    //   'test-patient-123',
    //   'test-record-456', 
    //   dataHash
    // );
    // console.log('Stored on blockchain:', result);
  } else {
    console.log('❌ Insufficient balance - get more test tokens');
  }
})().catch(console.error);
"
```

## 🛡️ Security Best Practices

### Development Environment
- ✅ Use separate test wallet for development
- ✅ Never use mainnet private keys in development
- ✅ Store private keys in `.env` file (not committed to git)
- ✅ Use free test tokens only

### Production Environment (Future)
- 🔐 Use hardware wallets (Ledger/Trezor)
- 🔐 Implement multi-signature wallets
- 🔐 Use environment variable injection
- 🔐 Regular key rotation

## 🔍 Verification & Monitoring

### Check Your Transactions
1. Visit: https://amoy.polygonscan.com/
2. Enter your wallet address
3. View all transactions and balances

### Monitor Wallet in CloudCare
```bash
# Check health endpoint with blockchain status
curl http://localhost:3000/api/health/detailed
```

Response will include:
```json
{
  "blockchain": {
    "connected": true,
    "network": "polygon-amoy",
    "walletConnected": true,
    "walletAddress": "0x..."
  }
}
```

## 📊 Expected Token Usage

### Development Testing
- **Balance Needed**: 0.1-0.5 POL
- **Per Transaction**: ~0.0001 POL (almost free)
- **Daily Usage**: 0.01-0.05 POL
- **Refill Frequency**: Weekly from faucets

### Production Estimates
- **Per Medical Record**: $0.001-0.01 USD
- **1000 Records/Month**: $1-10 USD
- **Enterprise Scale**: $10-100/month

## 🚨 Troubleshooting

### Common Issues

#### 1. "Insufficient funds" Error
- **Solution**: Get more test tokens from faucets
- **Check**: Verify you're on Amoy network, not mainnet

#### 2. "Invalid private key" Error
- **Solution**: Ensure private key is 64 hex characters
- **Format**: Remove '0x' prefix if present

#### 3. MetaMask not connecting
- **Solution**: Manually add Amoy network
- **Check**: Network settings match exactly

#### 4. Faucet "Already claimed" Error
- **Solution**: Wait 24 hours between claims
- **Alternative**: Try different faucets

### Debug Commands
```bash
# Check if private key is valid
node -e "
const { ethers } = require('ethers');
try {
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY');
  console.log('✅ Valid private key');
  console.log('Address:', wallet.address);
} catch (error) {
  console.log('❌ Invalid private key:', error.message);
}
"

# Check network connection
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🎉 Success Checklist

- [ ] ✅ Wallet created (MetaMask or CLI)
- [ ] ✅ Polygon Amoy network added
- [ ] ✅ Test tokens received (>0.1 POL)
- [ ] ✅ Private key added to `.env`
- [ ] ✅ CloudCare blockchain connection working
- [ ] ✅ Wallet balance shows in health check
- [ ] ✅ Ready to store medical record hashes!

---

**🎯 You're now ready to use blockchain features in CloudCare!**

Your wallet can store medical record hashes on Polygon Amoy for FREE during development, with production costs under $0.01 per transaction! 🏥⚡️
