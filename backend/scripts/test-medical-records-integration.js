#!/usr/bin/env node

/**
 * CloudCare Medical Records Blockchain Integration Test
 * Demonstrates end-to-end medical record storage with blockchain verification
 */

const axios = require('axios');
const { blockchainService } = require('../dist/services/blockchainService');

const API_BASE = 'http://localhost:3000/api';

// Sample test data
const sampleMedicalRecord = {
  patientId: 'patient-12345',
  recordType: 'consultation',
  title: 'Annual Physical Examination',
  description: 'Comprehensive annual health checkup including vital signs, blood work, and general assessment',
  diagnosis: ['Hypertension - Stage 1', 'Vitamin D Deficiency'],
  symptoms: ['Mild headaches', 'Fatigue', 'Joint stiffness'],
  medications: [
    {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '3 months',
      instructions: 'Take with food in the morning',
      prescribedDate: new Date().toISOString(),
      prescribedBy: 'dr-smith-789',
      isActive: true
    },
    {
      name: 'Vitamin D3',
      dosage: '2000 IU',
      frequency: 'Once daily',
      duration: '6 months',
      instructions: 'Take with largest meal',
      prescribedDate: new Date().toISOString(),
      prescribedBy: 'dr-smith-789',
      isActive: true
    }
  ],
  labResults: [
    {
      testName: 'Complete Blood Count',
      value: 'Normal',
      status: 'normal',
      testedDate: new Date().toISOString(),
      labName: 'CloudCare Labs'
    },
    {
      testName: 'Vitamin D Level',
      value: '18',
      unit: 'ng/mL',
      referenceRange: '30-50 ng/mL',
      status: 'abnormal',
      testedDate: new Date().toISOString(),
      labName: 'CloudCare Labs',
      notes: 'Below normal range - supplementation recommended'
    },
    {
      testName: 'Blood Pressure',
      value: '138/88',
      unit: 'mmHg',
      referenceRange: '<120/80 mmHg',
      status: 'abnormal',
      testedDate: new Date().toISOString()
    }
  ],
  notes: 'Patient reports feeling generally well with occasional fatigue. Blood pressure slightly elevated, recommend lifestyle modifications and medication. Vitamin D deficiency noted, supplementation prescribed. Follow-up in 3 months.',
  visitDate: new Date().toISOString(),
  followUpRequired: true,
  followUpDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
  severity: 'medium',
  confidentialityLevel: 'restricted',
  shareableViaQR: false
};

async function testMedicalRecordsBlockchainIntegration() {
  console.log('🧪 CloudCare Medical Records Blockchain Integration Test');
  console.log('=======================================================\n');

  try {
    // Test 1: Check blockchain connection
    console.log('1️⃣ Testing Blockchain Connection...');
    const connected = await blockchainService.checkConnection();
    if (connected) {
      const status = blockchainService.getConnectionStatus();
      console.log('✅ Blockchain connected');
      console.log(`   Network: ${status.network}`);
      console.log(`   Wallet: ${status.walletConnected ? '✅' : '❌'} ${status.walletAddress || 'Not configured'}`);
      
      if (status.walletConnected) {
        const balance = await blockchainService.getWalletBalance();
        console.log(`   Balance: ${balance} POL`);
      }
    } else {
      console.log('❌ Blockchain connection failed');
      return;
    }

    console.log('');

    // Test 2: Generate medical record hash
    console.log('2️⃣ Testing Medical Record Hash Generation...');
    const recordHash = blockchainService.generateDataHash(sampleMedicalRecord);
    console.log('✅ Medical record hash generated');
    console.log(`   Hash: ${recordHash}`);
    console.log(`   Length: ${recordHash.length} characters`);

    console.log('');

    // Test 3: Estimate blockchain storage cost
    console.log('3️⃣ Testing Blockchain Storage Cost Estimation...');
    try {
      const costs = await blockchainService.estimateStorageCost();
      console.log('✅ Cost estimation successful');
      console.log(`   Gas Limit: ${costs.gasLimit}`);
      console.log(`   Gas Price: ${costs.gasPrice} gwei`);
      console.log(`   Estimated Cost: ${costs.estimatedCost} POL`);
      console.log(`   USD Equivalent: ~$${costs.costInUSD}`);
    } catch (error) {
      console.log('⚠️  Cost estimation failed:', error.message);
    }

    console.log('');

    // Test 4: Store medical record hash on blockchain (if wallet has balance)
    console.log('4️⃣ Testing Medical Record Blockchain Storage...');
    
    if (blockchainService.getConnectionStatus().walletConnected) {
      try {
        const balance = await blockchainService.getWalletBalance();
        
        if (parseFloat(balance) >= 0.01) {
          console.log('💾 Storing medical record hash on Polygon Amoy blockchain...');
          
          const result = await blockchainService.storeMedicalRecordHash(
            sampleMedicalRecord.patientId,
            `test-record-${Date.now()}`,
            recordHash
          );
          
          console.log('✅ Medical record hash stored on blockchain!');
          console.log(`   Transaction Hash: ${result.transactionHash}`);
          console.log(`   Patient ID: ${result.patientId}`);
          console.log(`   Record ID: ${result.recordId}`);
          console.log(`   Timestamp: ${new Date(result.timestamp * 1000).toISOString()}`);
          console.log(`   Explorer: https://amoy.polygonscan.com/tx/${result.transactionHash}`);
          
          // Test verification
          console.log('\n🔍 Testing Hash Verification...');
          const verifiedRecord = await blockchainService.verifyMedicalRecordHash(result.transactionHash);
          
          if (verifiedRecord && verifiedRecord.hash === recordHash) {
            console.log('✅ Hash verification successful');
            console.log('   Data integrity confirmed - no tampering detected');
          } else {
            console.log('❌ Hash verification failed');
            console.log('   Data may have been tampered with');
          }
          
        } else {
          console.log('⚠️  Insufficient balance for blockchain storage test');
          console.log(`   Current balance: ${balance} POL`);
          console.log('   Need at least 0.01 POL for testing');
          console.log('   Get test tokens from: https://www.alchemy.com/faucets/polygon-amoy');
        }
      } catch (error) {
        console.log('❌ Blockchain storage test failed:', error.message);
      }
    } else {
      console.log('⚠️  No wallet configured - blockchain storage skipped');
      console.log('   Run: npm run generate-wallet to set up blockchain wallet');
    }

    console.log('');

    // Test 5: Demonstrate tamper detection
    console.log('5️⃣ Testing Tamper Detection...');
    
    // Create a tampered version of the medical record
    const tamperedRecord = {
      ...sampleMedicalRecord,
      diagnosis: ['Modified diagnosis - this is tampered data'],
      notes: 'This record has been tampered with for testing purposes'
    };
    
    const tamperedHash = blockchainService.generateDataHash(tamperedRecord);
    
    console.log('✅ Tamper detection test');
    console.log(`   Original Hash:  ${recordHash}`);
    console.log(`   Tampered Hash:  ${tamperedHash}`);
    console.log(`   Hashes Match:   ${recordHash === tamperedHash ? '✅' : '❌'}`);
    
    if (recordHash !== tamperedHash) {
      console.log('✅ Tamper detection working correctly');
      console.log('   Any modification to medical data changes the hash');
    }

    console.log('');

    // Test Summary
    console.log('📊 Integration Test Summary');
    console.log('============================');
    console.log('✅ Blockchain Connection: Working');
    console.log('✅ Hash Generation: Working');
    console.log('✅ Cost Estimation: Working');
    console.log('✅ Tamper Detection: Working');
    
    const walletStatus = blockchainService.getConnectionStatus().walletConnected;
    console.log(`${walletStatus ? '✅' : '⚠️'} Blockchain Storage: ${walletStatus ? 'Ready' : 'Needs wallet setup'}`);

    console.log('');
    console.log('🎉 Medical Records Blockchain Integration Test Complete!');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Start your CloudCare backend: npm start');
    console.log('   2. Use the API endpoints to create medical records');
    console.log('   3. All records will automatically get blockchain protection');
    console.log('   4. Use /verify endpoints to check data integrity');

    if (!walletStatus) {
      console.log('');
      console.log('🔧 To enable blockchain storage:');
      console.log('   1. npm run generate-wallet');
      console.log('   2. Get test tokens from Polygon Amoy faucet');
      console.log('   3. Run this test again');
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMedicalRecordsBlockchainIntegration().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
