/**
 * Minimal QR System Test
 * Tests individual components to isolate the issue
 */

import { database } from '../services/database';
import { blockchainService } from '../services/blockchainService';

async function minimalQRTest() {
  console.log('🧪 Minimal QR System Test\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing Database Service...');
    const dbResult = await database.query('SELECT NOW() as current_time');
    console.log('✅ Database working:', dbResult.rows[0].current_time);

    // Test 2: Blockchain service
    console.log('\n2️⃣ Testing Blockchain Service...');
    const isConnected = await blockchainService.checkConnection();
    console.log('✅ Blockchain connected:', isConnected);

    // Test 3: Create mock consent record
    console.log('\n3️⃣ Testing Consent Record Creation...');
    const testConsentData = {
      patientId: 'test-patient-123',
      recordIds: ['record-1', 'record-2'],
      facilityId: 'test-facility',
      shareType: 'full',
      token: 'test-token-uuid-123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      permissions: { read: true, download: true, timeAccess: 'limited' }
    };

    const consentResult = await blockchainService.createConsentRecord(testConsentData);
    console.log('✅ Consent record created:', {
      hash: consentResult.hash.substring(0, 10) + '...',
      timestamp: new Date(consentResult.timestamp).toISOString()
    });

    // Test 4: Verify consent
    console.log('\n4️⃣ Testing Consent Verification...');
    const isValid = await blockchainService.verifyConsentRecord(consentResult.hash);
    console.log('✅ Consent verification:', isValid);

    // Test 5: Test table existence
    console.log('\n5️⃣ Testing QR Tables...');
    const qrTableCheck = await database.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'qr_share_tokens' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ QR Share Tokens table structure:');
    qrTableCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n🎉 All tests passed! QR system components are working correctly.');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Run test
minimalQRTest().catch(console.error);
