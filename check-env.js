#!/usr/bin/env node

// Quick script to check if all required environment variables are set

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

require('dotenv').config();

console.log('\n🔍 Checking environment variables...\n');

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '' && !value.includes('your-') && !value.includes('***')) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing or not configured`);
    allSet = false;
  }
});

console.log('\n');

if (allSet) {
  console.log('✨ All environment variables are configured!');
  console.log('You can now run: npm run db:generate && npm run db:push && npm run dev\n');
} else {
  console.log('⚠️  Some environment variables are missing.');
  console.log('📖 See SETUP_GUIDE.md for detailed instructions on getting API keys.\n');
}

process.exit(allSet ? 0 : 1);

