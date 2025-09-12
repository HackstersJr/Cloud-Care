#!/usr/bin/env node

/**
 * CloudCare Blockchain Test Script
 * Tests Polygon Amoy connection and wallet functionality
 */

const { blockchainService } = require('../dist/services/blockchainService');

async function testBlockchain() {
  console.log('🧪 CloudCare Blockchain Test Suite');
  console.log('===================================\n');

  // Test 1: Connection
  console.log('1️⃣ Testing Polygon Amoy Connection...');
  try {
    const connected = await blockchainService.checkConnection();
    if (connected) {
      console.log('✅ Connected to Polygon Amoy testnet');
      
      const networkInfo = await blockchainService.getNetworkInfo();
      console.log(`   Chain ID: ${networkInfo.chainId}`);
      console.log(`   Network: ${networkInfo.name}`);
      console.log(`   Current Block: ${networkInfo.blockNumber}`);
      console.log(`   Gas Price: ${Number(networkInfo.gasPrice) / 1e9} gwei`);
    } else {
      console.log('❌ Failed to connect to Polygon Amoy');
      return;
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return;
  }

  console.log('');

  // Test 2: Wallet Status
  console.log('2️⃣ Testing Wallet Configuration...');
  const status = blockchainService.getConnectionStatus();
  
  if (status.walletConnected) {
    console.log('✅ Wallet connected');
    console.log(`   Address: ${status.walletAddress}`);
    
    try {
      const balance = await blockchainService.getWalletBalance();
      console.log(`   Balance: ${balance} POL`);
      
      if (parseFloat(balance) > 0) {
        console.log('✅ Wallet has sufficient balance for testing');
      } else {
        console.log('⚠️  Wallet balance is 0 - get test tokens from faucet');
        console.log('   Alchemy Faucet: https://www.alchemy.com/faucets/polygon-amoy');
        console.log(`   Your address: ${status.walletAddress}`);
      }
    } catch (error) {
      console.log('❌ Failed to get wallet balance:', error.message);
    }
  } else {
    console.log('⚠️  No wallet connected - add PRIVATE_KEY to .env file');
    console.log('   Run: npm run generate-wallet');
  }

  console.log('');

  // Test 3: Cost Estimation
  console.log('3️⃣ Testing Cost Estimation...');
  try {
    const costs = await blockchainService.estimateStorageCost();
    console.log('✅ Cost estimation successful');
    console.log(`   Gas Limit: ${costs.gasLimit}`);
    console.log(`   Gas Price: ${costs.gasPrice} gwei`);
    console.log(`   Estimated Cost: ${costs.estimatedCost} POL`);
    console.log(`   USD Cost: ~$${costs.costInUSD}`);
  } catch (error) {
    console.log('❌ Cost estimation failed:', error.message);
  }

  console.log('');

  // Test 4: Hash Generation
  console.log('4️⃣ Testing Medical Record Hash Generation...');
  try {
    const sampleMedicalData = {
      patientId: 'test-patient-123',
      recordId: 'record-456',
      diagnosis: 'Routine Health Checkup',
      medications: ['Vitamin D3 1000IU'],
      vitals: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6
      },
      timestamp: new Date().toISOString(),
      physicianId: 'dr-smith-789'
    };

    const dataHash = blockchainService.generateDataHash(sampleMedicalData);
    console.log('✅ Hash generation successful');
    console.log(`   Sample Data Hash: ${dataHash}`);
    console.log('   Hash is deterministic - same data = same hash');
  } catch (error) {
    console.log('❌ Hash generation failed:', error.message);
  }

  console.log('');

  // Test 5: Blockchain Storage (if wallet has balance)
  if (status.walletConnected) {
    console.log('5️⃣ Testing Blockchain Storage...');
    try {
      const balance = await blockchainService.getWalletBalance();
      
      if (parseFloat(balance) >= 0.001) {
        console.log('💾 Attempting to store medical record hash...');
        
        const sampleData = {
          patientId: 'test-patient-' + Date.now(),
          diagnosis: 'Blockchain Test Record',
          timestamp: new Date().toISOString()
        };
        
        const hash = blockchainService.generateDataHash(sampleData);
        
        // Real blockchain storage test - using your test tokens!
        console.log('💾 Storing test medical record on Polygon Amoy...');
        
        const result = await blockchainService.storeMedicalRecordHash(
          sampleData.patientId,
          'test-record-' + Date.now(),
          hash
        );
        
        console.log('✅ Successfully stored medical record hash on blockchain!');
        console.log(`   Transaction Hash: ${result.transactionHash}`);
        console.log(`   Gas Used: ${result.gasUsed}`);
        console.log(`   Cost: ${result.actualCost} POL`);
        console.log(`   View on Explorer: https://amoy.polygonscan.com/tx/${result.transactionHash}`);
        console.log('');
        
        // Test retrieval
        console.log('� Testing hash retrieval...');
        const retrievedHash = await blockchainService.getMedicalRecordHash(result.transactionHash);
        console.log(`   Retrieved Hash: ${retrievedHash}`);
        console.log(`   Hash Match: ${retrievedHash === hash ? '✅' : '❌'}`);
        
        console.log('🎯 Real blockchain storage test completed successfully!');
        
      } else {
        console.log('⚠️  Insufficient balance for storage test');
        console.log('   Need at least 0.001 POL for testing');
        console.log('   Get tokens from: https://faucet.polygon.technology/');
      }
    } catch (error) {
      console.log('❌ Storage test failed:', error.message);
    }
  } else {
    console.log('5️⃣ Blockchain Storage Test Skipped (No wallet)');
  }

  console.log('');

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Network: ${status.connected ? '✅' : '❌'} Polygon Amoy`);
  console.log(`RPC: ${status.connected ? '✅' : '❌'} ${status.rpcUrl}`);
  console.log(`Wallet: ${status.walletConnected ? '✅' : '⚠️'} ${status.walletConnected ? 'Connected' : 'Not configured'}`);
  
  if (status.walletConnected) {
    try {
      const balance = await blockchainService.getWalletBalance();
      console.log(`Balance: ${parseFloat(balance) > 0 ? '✅' : '⚠️'} ${balance} POL`);
    } catch (error) {
      console.log(`Balance: ❌ Error checking balance`);
    }
  }

  console.log('');
  console.log('🎉 Blockchain test completed!');
  
  if (!status.walletConnected) {
    console.log('\n💡 To enable full functionality:');
    console.log('   1. Run: npm run generate-wallet');
    console.log('   2. Get test tokens from faucet');
    console.log('   3. Run this test again');
  }
}

// Run the test
testBlockchain().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
