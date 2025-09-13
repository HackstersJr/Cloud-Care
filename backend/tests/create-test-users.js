const axios = require('axios');

const BASE_URL = 'http://192.168.137.1:3000';

// Test users to create
const TEST_USERS = [
  {
    email: 'patient1@test.com',
    password: 'testpass123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'patient',
    phone: '+1234567890'
  },
  {
    email: 'patient2@test.com',
    password: 'testpass123',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'patient',
    phone: '+1234567891'
  },
  {
    email: 'doctor1@test.com',
    password: 'testpass123',
    firstName: 'Dr.',
    lastName: 'Smith',
    role: 'doctor',
    phone: '+1234567892',
    specialization: 'Family Medicine',
    licenseNumber: 'DOC12345'
  }
];

async function createTestUsers() {
  console.log('🔧 Creating test users for family workflow tests...');
  
  for (const user of TEST_USERS) {
    try {
      console.log(`\n👤 Creating user: ${user.firstName} ${user.lastName} (${user.email})`);
      
      const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, user);
      
      if (response.status === 201) {
        console.log(`✅ User ${user.email} created successfully`);
      } else {
        console.log(`⚠️  Unexpected response for ${user.email}:`, response.status);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  User ${user.email} already exists`);
      } else {
        console.log(`❌ Failed to create user ${user.email}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log('\n✅ Test user creation completed!');
  console.log('\n📋 Test User Credentials:');
  TEST_USERS.forEach(user => {
    console.log(`- ${user.firstName} ${user.lastName}: ${user.email} / ${user.password} (${user.role})`);
  });
}

// Run the script
if (require.main === module) {
  createTestUsers().catch(error => {
    console.error('❌ Failed to create test users:', error);
    process.exit(1);
  });
}

module.exports = { createTestUsers, TEST_USERS };
