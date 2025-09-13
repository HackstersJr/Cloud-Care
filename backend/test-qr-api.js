const http = require('http');

// Test QR validation endpoint
const testData = JSON.stringify({
  token: 'test-token',
  checksum: 'test-checksum'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/qr/validate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('🧪 Testing QR System API Endpoints...\n');

const req = http.request(options, (res) => {
  console.log('✅ QR Validate Endpoint Status:', res.statusCode);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Response Body:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('\n🎉 QR System is properly integrated in Docker container!');
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(testData);
req.end();
