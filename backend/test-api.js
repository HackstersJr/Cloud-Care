#!/usr/bin/env node

// Simple test script to verify CloudCare API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(url, description) {
  try {
    console.log(`Testing: ${description}`);
    const response = await axios.get(`${BASE_URL}${url}`);
    console.log(`✅ ${url} - Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    console.log('');
  } catch (error) {
    console.log(`❌ ${url} - Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('');
  }
}

async function runTests() {
  console.log('🚀 CloudCare Healthcare Backend API Tests\n');
  
  // Test health endpoints
  await testEndpoint('/health', 'Basic Health Check');
  await testEndpoint('/health/detailed', 'Detailed Health Check');
  await testEndpoint('/health/ready', 'Readiness Check');
  await testEndpoint('/health/live', 'Liveness Check');
  
  // Test API health endpoint
  await testEndpoint('/api/health', 'API Health Check');
  
  // Test placeholder routes (should return "coming soon" messages)
  await testEndpoint('/api/v1/auth/status', 'Auth Status');
  await testEndpoint('/api/v1/patients/status', 'Patients Status (should fail - requires auth)');
  await testEndpoint('/api/v1/doctors/status', 'Doctors Status (should fail - requires auth)');
  
  // Test 404 endpoint
  await testEndpoint('/api/v1/nonexistent', 'Non-existent endpoint (404)');
  
  console.log('✨ Test run completed!');
}

runTests().catch(console.error);
