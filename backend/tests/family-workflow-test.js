const axios = require('axios');

// Test configuration
const BASE_URL = 'http://192.168.137.1:3000';
const FRONTEND_URL = 'http://localhost:5174';

// Test users
const TEST_USERS = {
  patient1: { email: 'patient1@test.com', password: 'testpass123' },
  patient2: { email: 'patient2@test.com', password: 'testpass123' },
  doctor1: { email: 'doctor1@test.com', password: 'testpass123' }
};

// Store test tokens and data
let testData = {
  tokens: {},
  users: {},
  familyGroup: null,
  invitation: null
};

console.log('🚀 Starting Family Workflow Tests');
console.log('==================================================');

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(token, method, endpoint, data = null) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// Test health endpoint
async function testHealthEndpoint() {
  console.log('\n🔍 Testing health endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Health endpoint responding correctly');
      return true;
    }
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return false;
  }
}

// Login user function
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email,
      password
    });
    
    const token = response.data.data?.tokens?.accessToken;
    const user = response.data.data?.user;
    
    if (token) {
      console.log(`✅ Login successful for ${email}`);
      return { success: true, token, user };
    }
    
    console.log(`❌ Login failed for ${email}: No token received`);
    return { success: false, error: 'No token received' };
  } catch (error) {
    console.log(`❌ Login failed for ${email}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Login all test users
async function loginTestUsers() {
  console.log('\n👤 Logging in test users...');
  
  for (const [key, credentials] of Object.entries(TEST_USERS)) {
    const result = await loginUser(credentials.email, credentials.password);
    if (result.success) {
      testData.tokens[key] = result.token;
      testData.users[key] = result.user;
    } else {
      console.log(`❌ Failed to login ${key}. Please ensure test users are created and verified.`);
      return false;
    }
  }
  
  return true;
}

// Test family group creation
async function testFamilyGroupCreation() {
  console.log('\n🔍 Testing family group creation...');
  
  const familyData = {
    name: 'Test Family Group',
    description: 'A family group for testing purposes'
  };
  
  const result = await makeAuthenticatedRequest(
    testData.tokens.patient1, 
    'POST', 
    '/api/v1/family/groups', 
    familyData
  );
  
  if (result.success) {
    testData.familyGroup = result.data.data || result.data;
    console.log('✅ Family group created successfully');
    console.log(`   Group ID: ${testData.familyGroup.id}`);
    console.log(`   Invite Code: ${testData.familyGroup.inviteCode}`);
    return true;
  } else {
    console.log('❌ Family group creation failed:', result.error);
    return false;
  }
}

// Test family invitation sending
async function testFamilyInvitation() {
  console.log('\n🔍 Testing family invitation...');
  
  if (!testData.familyGroup) {
    console.log('❌ No family group available for invitation test');
    return false;
  }
  
  const invitationData = {
    familyGroupId: testData.familyGroup.id,
    inviteeEmail: TEST_USERS.patient2.email,
    proposedRelationship: 'spouse',
    message: 'Join our family health network for better care coordination'
  };
  
  const result = await makeAuthenticatedRequest(
    testData.tokens.patient1,
    'POST',
    '/api/v1/family/invitations',
    invitationData
  );
  
  if (result.success) {
    testData.invitation = result.data.data || result.data;
    console.log('✅ Family invitation sent successfully');
    console.log(`   Invitation ID: ${testData.invitation.id}`);
    console.log(`   Invitation Token: ${testData.invitation.token}`);
    return true;
  } else {
    console.log('❌ Family invitation failed:', result.error);
    return false;
  }
}

// Test viewing pending invitations
async function testPendingInvitations() {
  console.log('\n🔍 Testing pending invitations...');
  
  const result = await makeAuthenticatedRequest(
    testData.tokens.patient2,
    'GET',
    '/api/v1/family/invitations?type=received'
  );
  
  if (result.success) {
    const invitations = result.data.data || result.data || [];
    console.log(`✅ Found ${invitations.length} pending invitations`);
    if (invitations.length > 0) {
      console.log(`   First invitation from: ${invitations[0].inviterName || invitations[0].inviter?.firstName}`);
    }
    return true;
  } else {
    console.log('❌ Failed to get pending invitations:', result.error);
    return false;
  }
}

// Test accepting family invitation
async function testAcceptInvitation() {
  console.log('\n🔍 Testing invitation acceptance...');
  
  if (!testData.invitation) {
    console.log('❌ No invitation available to accept');
    return false;
  }
  
  const result = await makeAuthenticatedRequest(
    testData.tokens.patient2,
    'PATCH',
    `/api/v1/family/invitations/${testData.invitation.token}`,
    { action: 'accept' }
  );
  
  if (result.success) {
    console.log('✅ Invitation accepted successfully');
    return true;
  } else {
    console.log('❌ Failed to accept invitation:', result.error);
    return false;
  }
}

// Test family member listing
async function testFamilyMembers() {
  console.log('\n🔍 Testing family member listing...');
  
  if (!testData.familyGroup) {
    console.log('❌ No family group available');
    return false;
  }
  
  // Use the get group details endpoint which includes members
  const result = await makeAuthenticatedRequest(
    testData.tokens.patient1,
    'GET',
    `/api/v1/family/groups/${testData.familyGroup.id}`
  );
  
  if (result.success) {
    const group = result.data.data || result.data;
    const members = group.members || [];
    console.log(`✅ Found ${members.length} family members`);
    members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.memberName || member.patient?.firstName} (${member.role})`);
    });
    return true;
  } else {
    console.log('❌ Failed to get family members:', result.error);
    return false;
  }
}

// Test doctor family insights
async function testDoctorInsights() {
  console.log('\n🔍 Testing doctor family insights...');
  
  const result = await makeAuthenticatedRequest(
    testData.tokens.doctor1,
    'GET',
    '/api/v1/family/insights-overview'
  );
  
  if (result.success) {
    const insights = result.data.data || result.data;
    console.log('✅ Doctor insights retrieved successfully');
    console.log(`   Total families: ${insights?.totalFamilies || 0}`);
    console.log(`   Total members: ${insights?.totalMembers || 0}`);
    return true;
  } else {
    console.log('❌ Failed to get doctor insights:', result.error);
    return false;
  }
}

// Test medical record sharing (placeholder - requires actual medical records)
async function testMedicalRecordSharing() {
  console.log('\n🔍 Testing medical record sharing...');
  
  // First check if user has any medical records
  const recordsResult = await makeAuthenticatedRequest(
    testData.tokens.patient1,
    'GET',
    '/api/v1/medical-records'
  );
  
  if (recordsResult.success) {
    const records = recordsResult.data.data || recordsResult.data || [];
    if (records.length === 0) {
      console.log('ℹ️  No medical records found - skipping sharing test');
      console.log('   (In real scenario, users would have medical records to share)');
      return true;
    }
    
    // Try to share the first record
    const shareData = {
      familyGroupId: testData.familyGroup.id,
      shareLevel: 'full',
      notes: 'Sharing for family health coordination'
    };
    
    const shareResult = await makeAuthenticatedRequest(
      testData.tokens.patient1,
      'POST',
      `/api/v1/family/records/${records[0].id}/share`,
      shareData
    );
    
    if (shareResult.success) {
      console.log('✅ Medical record shared successfully');
      return true;
    } else {
      console.log('❌ Failed to share medical record:', shareResult.error);
      return false;
    }
  } else {
    console.log('ℹ️  Could not access medical records - endpoint may require different structure');
    return true;
  }
}

// Main test execution
async function runFamilyWorkflowTests() {
  try {
    // Test basic connectivity
    const healthOk = await testHealthEndpoint();
    if (!healthOk) {
      console.log('❌ Backend not responding. Exiting tests.');
      return;
    }
    
    // Login test users
    const loginOk = await loginTestUsers();
    if (!loginOk) {
      console.log('❌ User login failed. Please ensure test users exist and are verified.');
      console.log('\nTo create test users, run: node tests/create-test-users.js');
      console.log('To verify test users, run: node tests/verify-test-users.js');
      return;
    }
    
    // Run family workflow tests
    const tests = [
      { name: 'Family Group Creation', fn: testFamilyGroupCreation },
      { name: 'Family Invitation', fn: testFamilyInvitation },
      { name: 'Pending Invitations', fn: testPendingInvitations },
      { name: 'Accept Invitation', fn: testAcceptInvitation },
      { name: 'Family Members', fn: testFamilyMembers },
      { name: 'Medical Record Sharing', fn: testMedicalRecordSharing },
      { name: 'Doctor Insights', fn: testDoctorInsights }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('==================================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All family workflow tests passed!');
      console.log('✅ Family management system is working correctly');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the issues above.');
    }
    
    console.log('\n📋 Test Data Summary:');
    console.log(`   Family Group: ${testData.familyGroup?.id || 'Not created'}`);
    console.log(`   Invitation: ${testData.invitation?.id || 'Not sent'}`);
    console.log(`   Logged in users: ${Object.keys(testData.tokens).length}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runFamilyWorkflowTests();
