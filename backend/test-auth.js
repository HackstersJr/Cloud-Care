const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test data
const testUser = {
  email: 'patient@cloudcare.com',
  password: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Patient',
  phone: '+1234567890',
  role: 'patient'
};

const doctorUser = {
  email: 'doctor@cloudcare.com',
  password: 'SecurePassword123',
  firstName: 'Dr. Sarah',
  lastName: 'Smith',
  role: 'doctor'
};

let authTokens = {};

async function testAPI() {
  console.log('🚀 CloudCare Authentication System Tests\n');

  try {
    // Test 1: User Registration
    console.log('Testing: User Registration');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration successful');
      console.log(`   User ID: ${registerResponse.data.data.user.id}`);
      console.log(`   Email: ${registerResponse.data.data.user.email}`);
      console.log(`   Role: ${registerResponse.data.data.user.role}`);
      
      authTokens = registerResponse.data.data.tokens;
      console.log(`   Access Token: ${authTokens.accessToken.substring(0, 50)}...`);
      console.log(`   Refresh Token: ${authTokens.refreshToken.substring(0, 50)}...`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, proceeding with login test');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.error?.message || error.message);
      }
    }

    // Test 2: User Login
    console.log('\nTesting: User Login');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful');
      console.log(`   User: ${loginResponse.data.data.user.first_name} ${loginResponse.data.data.user.last_name}`);
      console.log(`   Last Login: ${loginResponse.data.data.user.last_login || 'First time'}`);
      
      authTokens = loginResponse.data.data.tokens;
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error?.message || error.message);
    }

    // Test 3: Get User Profile (Protected Route)
    console.log('\nTesting: Get User Profile (Protected Route)');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`
        }
      });
      console.log('✅ Profile fetch successful');
      console.log(`   User ID: ${profileResponse.data.data.user.userId}`);
      console.log(`   Email: ${profileResponse.data.data.user.email}`);
      console.log(`   Role: ${profileResponse.data.data.user.role}`);
    } catch (error) {
      console.log('❌ Profile fetch failed:', error.response?.data?.error?.message || error.message);
    }

    // Test 4: Auth Status (Public Route)
    console.log('\nTesting: Auth Status (Public Route)');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/auth/status`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`
        }
      });
      console.log('✅ Auth status check successful');
      console.log(`   Authenticated: ${statusResponse.data.data.authenticated}`);
      console.log(`   User Role: ${statusResponse.data.data.user?.role || 'None'}`);
    } catch (error) {
      console.log('❌ Auth status failed:', error.response?.data?.error?.message || error.message);
    }

    // Test 5: Token Refresh
    console.log('\nTesting: Token Refresh');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: authTokens.refreshToken
      });
      console.log('✅ Token refresh successful');
      console.log(`   New Access Token: ${refreshResponse.data.data.tokens.accessToken.substring(0, 50)}...`);
      
      // Update tokens for further tests
      authTokens = refreshResponse.data.data.tokens;
    } catch (error) {
      console.log('❌ Token refresh failed:', error.response?.data?.error?.message || error.message);
    }

    // Test 6: Register Doctor (Different Role)
    console.log('\nTesting: Doctor Registration');
    try {
      const doctorResponse = await axios.post(`${BASE_URL}/auth/register`, doctorUser);
      console.log('✅ Doctor registration successful');
      console.log(`   Doctor: ${doctorResponse.data.data.user.first_name} ${doctorResponse.data.data.user.last_name}`);
      console.log(`   Role: ${doctorResponse.data.data.user.role}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('already exists')) {
        console.log('ℹ️  Doctor already exists');
      } else {
        console.log('❌ Doctor registration failed:', error.response?.data?.error?.message || error.message);
      }
    }

    // Test 7: Invalid Login Attempt
    console.log('\nTesting: Invalid Login Attempt');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'WrongPassword123'
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login properly rejected');
        console.log(`   Message: ${error.response.data.error.message}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error?.message || error.message);
      }
    }

    // Test 8: Access Protected Route Without Token
    console.log('\nTesting: Access Protected Route Without Token');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected route properly secured');
        console.log(`   Message: ${error.response.data.error.message}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.error?.message || error.message);
      }
    }

    // Test 9: Password Reset Request
    console.log('\nTesting: Password Reset Request');
    try {
      const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
        email: testUser.email
      });
      console.log('✅ Password reset request successful');
      console.log(`   Message: ${resetResponse.data.message}`);
      if (resetResponse.data.data?.resetToken) {
        console.log(`   Reset Token: ${resetResponse.data.data.resetToken.substring(0, 30)}...`);
      }
    } catch (error) {
      console.log('❌ Password reset failed:', error.response?.data?.error?.message || error.message);
    }

    // Test 10: Logout
    console.log('\nTesting: User Logout');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {
        refreshToken: authTokens.refreshToken
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`
        }
      });
      console.log('✅ Logout successful');
      console.log(`   Message: ${logoutResponse.data.message}`);
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.data?.error?.message || error.message);
    }

    console.log('\n✨ Authentication system test completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Run the tests
testAPI().catch(console.error);
