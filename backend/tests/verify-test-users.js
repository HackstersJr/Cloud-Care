const axios = require('axios');

const BASE_URL = 'http://192.168.137.1:3000';

// Test user emails to verify
const TEST_EMAILS = [
  'patient1@test.com',
  'patient2@test.com',
  'doctor1@test.com'
];

async function verifyTestUsers() {
  console.log('🔧 Verifying test users for family workflow tests...');
  
  for (const email of TEST_EMAILS) {
    try {
      console.log(`\n📧 Verifying user: ${email}`);
      
      // First, try to trigger verification (this might send an email)
      const verifyResponse = await axios.post(`${BASE_URL}/api/v1/auth/verify-email`, {
        email
      });
      
      console.log(`✅ Verification process started for ${email}`);
      console.log('   Response:', verifyResponse.data);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already verified')) {
        console.log(`ℹ️  User ${email} already verified`);
      } else {
        console.log(`❌ Failed to verify user ${email}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('\n✅ User verification process completed!');
  console.log('\nℹ️  Note: In a production environment, users would click verification links in emails.');
  console.log('For testing, we may need to directly update the database or use test verification endpoints.');
}

// Also create a function to directly update database (for testing only)
async function directDatabaseVerification() {
  console.log('\n🔧 Attempting direct database verification (testing only)...');
  
  // This would require database access - for now just log the SQL that would be needed
  console.log('\nSQL to run manually:');
  console.log(`
UPDATE users 
SET is_email_verified = true, updated_at = NOW() 
WHERE email IN ('patient1@test.com', 'patient2@test.com', 'doctor1@test.com');
  `);
  
  console.log('\nAlternatively, check if there\'s a test verification endpoint in the auth routes.');
}

// Run the script
if (require.main === module) {
  verifyTestUsers()
    .then(() => directDatabaseVerification())
    .catch(error => {
      console.error('❌ Failed to verify test users:', error);
      process.exit(1);
    });
}

module.exports = { verifyTestUsers };
