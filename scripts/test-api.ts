// Quick script to test if Perfect Corp API is configured correctly
// Run with: npx ts-node scripts/test-api.ts

import { validateApiConfiguration } from '../lib/perfectcorp.js';

console.log('Testing Perfect Corp API configuration...\n');

// Check environment variables
const apiKey = process.env.YOUCAM_API_KEY;
const baseUrl = process.env.YOUCAM_API_BASE_URL;
const useMock = process.env.USE_MOCK_SKIN_ANALYSIS;

console.log('Environment Variables:');
console.log('  YOUCAM_API_KEY:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
console.log('  YOUCAM_API_BASE_URL:', baseUrl || 'NOT SET (will use default)');
console.log('  USE_MOCK_SKIN_ANALYSIS:', useMock || 'false (default)\n');

// Check if API is configured
const isConfigured = validateApiConfiguration();

if (isConfigured) {
  console.log('✅ Perfect Corp API is configured correctly');

  if (useMock === 'true') {
    console.log('⚠️  Mock mode is ENABLED - real API will NOT be used');
    console.log('   Set USE_MOCK_SKIN_ANALYSIS=false to use real API');
  } else {
    console.log('✅ Mock mode is DISABLED - real API will be used');
  }
} else {
  console.log('❌ Perfect Corp API is NOT configured');
  console.log('   Please set YOUCAM_API_KEY in your .env file');
}
