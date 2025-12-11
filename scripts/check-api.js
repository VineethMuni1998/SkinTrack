// Quick script to check Perfect Corp API configuration
// Run with: node scripts/check-api.js

// Force fresh read of .env file
delete require.cache[require.resolve('dotenv')];
require('dotenv').config({ override: true });

console.log('Perfect Corp API Configuration Check\n');
console.log('=====================================\n');

// Check environment variables
const apiKey = process.env.YOUCAM_API_KEY;
const baseUrl = process.env.YOUCAM_API_BASE_URL;
const useMock = process.env.USE_MOCK_SKIN_ANALYSIS;

console.log('Environment Variables:');
console.log('  YOUCAM_API_KEY:', apiKey ? `${apiKey.substring(0, 15)}...` : '❌ NOT SET');
console.log('  YOUCAM_API_BASE_URL:', baseUrl || 'https://yce-api-01.makeupar.com (default)');
console.log('  USE_MOCK_SKIN_ANALYSIS:', useMock || 'false (default)\n');

// Determine status
if (apiKey) {
  console.log('✅ Perfect Corp API key is configured\n');

  if (useMock === 'true') {
    console.log('⚠️  MOCK MODE IS ENABLED');
    console.log('   Real API will NOT be used');
    console.log('   To use the real API:');
    console.log('   1. Change USE_MOCK_SKIN_ANALYSIS=false in .env');
    console.log('   2. Restart your dev server');
  } else {
    console.log('✅ REAL API MODE IS ENABLED');
    console.log('   Perfect Corp API will be used for skin analysis');
    console.log('\nTo test:');
    console.log('   1. Make sure dev server is running (npm run dev)');
    console.log('   2. Go to http://localhost:3000/onboarding');
    console.log('   3. Scan your face during skin type selection');
    console.log('   4. Check server logs for "Perfect Corp:" messages');
    console.log('\nExpected logs when using real API:');
    console.log('   Perfect Corp: Starting skin analysis task');
    console.log('   Perfect Corp: Task started successfully, ID: ...');
    console.log('   Perfect Corp: Poll attempt 1/300, status: processing');
    console.log('   Perfect Corp: Task completed successfully');
  }
} else {
  console.log('❌ Perfect Corp API is NOT configured');
  console.log('   Please set YOUCAM_API_KEY in your .env file');
}

console.log('\n=====================================\n');
