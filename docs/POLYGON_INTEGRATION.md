# Polygon Amoy Testnet Integration Guide

## Overview

CloudCare now uses **Polygon Amoy Testnet** for blockchain integration, providing free, fast, and secure medical record hash storage. This guide covers setup, configuration, and usage.

## Why Polygon Amoy?

### ✅ Benefits
- **100% FREE** - No gas costs for testing
- **EVM Compatible** - Works with existing ethers.js
- **Fast Transactions** - Sub-second confirmation times
- **Production Ready** - Easy migration to mainnet
- **Healthcare Friendly** - Low-cost for production use

### 📊 Network Details
- **Network Name**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC URL**: https://rpc-amoy.polygon.technology/
- **Currency**: POL (test tokens)
- **Block Explorer**: https://amoy.polygonscan.com/
- **Parent Chain**: Ethereum Sepolia

## Configuration

### Environment Variables

Update your `.env` file with Polygon Amoy configuration:

```bash
# Blockchain Configuration - Polygon Amoy Testnet
BLOCKCHAIN_NETWORK=polygon-amoy
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CHAIN_ID=80002

# Optional: For blockchain writes (leave empty for read-only)
PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=

# Gas Configuration (optimized for Polygon)
GAS_LIMIT=500000
GAS_PRICE=20000000000  # 20 gwei
```

### Required Setup

1. **Get Test Tokens** (POL):
   - Alchemy Faucet: https://www.alchemy.com/faucets/polygon-amoy
   - QuickNode Faucet: https://faucet.quicknode.com/polygon
   - GetBlock Faucet: https://getblock.io/faucet/matic-amoy/

2. **Create Wallet** (optional - for writes):
   ```bash
   # Generate a new wallet for testing
   npx ethers-cli generate-wallet
   ```

3. **Add Network to MetaMask**:
   - Network Name: Polygon Amoy
   - RPC URL: https://rpc-amoy.polygon.technology/
   - Chain ID: 80002
   - Currency Symbol: POL
   - Block Explorer: https://amoy.polygonscan.com/

## Usage Examples

### 1. Check Blockchain Connection

```typescript
import { blockchainService } from './services/blockchainService';

// Check connection status
const status = blockchainService.getConnectionStatus();
console.log('Blockchain Status:', status);

// Test connection
const connected = await blockchainService.checkConnection();
console.log('Connected:', connected);
```

### 2. Store Medical Record Hash

```typescript
// Generate hash from medical data
const medicalData = {
  patientId: 'patient-123',
  diagnosis: 'Hypertension',
  medications: ['Lisinopril 10mg'],
  timestamp: new Date().toISOString()
};

const dataHash = blockchainService.generateDataHash(medicalData);

// Store on blockchain
const record = await blockchainService.storeMedicalRecordHash(
  'patient-123',
  'record-456',
  dataHash
);

console.log('Stored on blockchain:', record.transactionHash);
```

### 3. Verify Medical Record

```typescript
// Verify integrity of stored medical record
const verified = await blockchainService.verifyMedicalRecordHash(
  'transaction-hash-here'
);

if (verified) {
  console.log('Record verified:', verified);
} else {
  console.log('Record not found or invalid');
}
```

### 4. Check Costs

```typescript
// Estimate transaction costs
const costs = await blockchainService.estimateStorageCost();
console.log('Estimated cost:', costs);

// Check wallet balance
const balance = await blockchainService.getWalletBalance();
console.log('Wallet balance:', balance, 'POL');
```

## API Endpoints

### Health Check with Blockchain Status

```bash
GET /api/health/detailed
```

Response includes blockchain connectivity:
```json
{
  "services": {
    "database": "connected",
    "blockchain": "connected"
  },
  "blockchain": {
    "connected": true,
    "network": "polygon-amoy",
    "rpcUrl": "https://rpc-amoy.polygon.technology/",
    "walletConnected": true,
    "walletAddress": "0x..."
  }
}
```

### Blockchain Status Endpoint (Future)

```bash
GET /api/blockchain/status
GET /api/blockchain/costs
POST /api/blockchain/store-hash
GET /api/blockchain/verify/:hash
```

## Security Considerations

### 🔒 Data Privacy
- Only **hashes** are stored on blockchain, never actual medical data
- Original data remains in encrypted database
- Blockchain provides immutable proof of record integrity

### 🛡️ HIPAA Compliance
- No PHI (Personal Health Information) on blockchain
- Blockchain hashes are cryptographically secure
- Audit trail through blockchain transactions

### 🔐 Wallet Security
- Use environment variables for private keys
- Consider hardware wallets for production
- Regular key rotation best practices

## Cost Analysis

### Testnet (Current)
- **Transaction Cost**: FREE
- **Storage Cost**: FREE  
- **API Calls**: FREE

### Mainnet (Future Production)
- **Transaction Cost**: ~$0.001 - $0.01 per record
- **Daily Cost (1000 records)**: ~$1 - $10
- **Monthly Cost**: ~$30 - $300
- **vs. Ethereum**: 100x cheaper

### Comparison with Ethereum Mainnet

| Feature | Polygon Mainnet | Ethereum Mainnet |
|---------|----------------|------------------|
| Transaction Fee | $0.001 - $0.01 | $5 - $50 |
| Confirmation Time | 2 seconds | 15 seconds - 5 minutes |
| Throughput | 7,000 TPS | 15 TPS |
| Healthcare Suitable | ✅ Yes | ❌ Too Expensive |

## Migration Path

### Development → Testnet → Production

1. **Current**: Polygon Amoy Testnet (FREE)
2. **Staging**: Polygon Mumbai → Amoy (FREE) 
3. **Production**: Polygon Mainnet (~$0.001/tx)

### Environment-Based Configuration

```typescript
const networks = {
  development: {
    rpcUrl: 'https://rpc-amoy.polygon.technology/',
    chainId: 80002,
    name: 'Polygon Amoy'
  },
  production: {
    rpcUrl: 'https://polygon-rpc.com/',
    chainId: 137,
    name: 'Polygon Mainnet'
  }
};
```

## Monitoring & Analytics

### Transaction Tracking
- All transactions viewable on [Amoy PolygonScan](https://amoy.polygonscan.com/)
- Real-time transaction status
- Gas usage analytics

### Health Monitoring
```typescript
// Monitor blockchain health
setInterval(async () => {
  const connected = await blockchainService.checkConnection();
  if (!connected) {
    logger.error('Blockchain connection lost');
  }
}, 30000); // Check every 30 seconds
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check RPC URL is correct
   - Verify network connectivity
   - Try alternative RPC endpoints

2. **Transaction Failed**
   - Ensure wallet has sufficient POL
   - Check gas limit settings
   - Verify private key format

3. **Gas Estimation Error**
   - Increase gas limit
   - Check network congestion
   - Verify transaction data

### Debug Commands

```bash
# Check blockchain connection
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check wallet balance
curl -X POST https://rpc-amoy.polygon.technology/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_WALLET_ADDRESS","latest"],"id":1}'
```

## Future Enhancements

### Planned Features
- **Smart Contracts**: Custom contracts for medical records
- **Multi-sig Wallets**: Enhanced security for production
- **Layer 2 Solutions**: Even lower costs with zkSync/Optimism
- **Cross-chain Bridge**: Ethereum ↔ Polygon interoperability

### Integration Roadmap
1. ✅ Basic hash storage (Current)
2. 🔄 Smart contract deployment
3. 📋 Advanced medical record schemas
4. 🔗 Cross-chain compatibility
5. 📊 Analytics dashboard

## Best Practices

### Development
- Always test on Amoy testnet first
- Use environment-specific configurations
- Implement proper error handling
- Monitor gas usage and costs

### Production
- Use hardware wallets for signing
- Implement transaction queuing
- Monitor blockchain network status
- Regular security audits

### Healthcare Compliance
- Hash sensitive data before blockchain storage
- Maintain audit logs of all blockchain operations
- Regular integrity verification
- Backup and recovery procedures

## Resources

### Official Documentation
- [Polygon Docs](https://docs.polygon.technology/)
- [Polygon Amoy Testnet](https://docs.polygon.technology/pos/reference/rpc-endpoints/#amoy)
- [ethers.js v6 Docs](https://docs.ethers.org/v6/)

### Tools & Explorers
- [Amoy PolygonScan](https://amoy.polygonscan.com/)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [MetaMask](https://metamask.io/)
- [Remix IDE](https://remix.ethereum.org/)

### Support
- [Polygon Discord](https://discord.com/invite/0xPolygonCommunity)
- [GitHub Issues](https://github.com/0xPolygon/polygon-docs/issues)
- [Developer Forum](https://forum.polygon.technology/)

---

## Summary

✅ **Polygon Amoy integration complete!**

- Free testnet environment for development
- Production-ready blockchain infrastructure  
- HIPAA-compliant medical record hashing
- Sub-second transaction times
- Easy migration path to mainnet

Your CloudCare system now has enterprise-grade blockchain capabilities at zero cost during development! 🎉
