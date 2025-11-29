// Master script to set up complete user data and predictions
// This script:
// 1. Generates new USER_CREDENTIALS.json with 120 users
// 2. Imports users into MongoDB with proper relationships
// 3. Generates realistic predictions from CSV data

const { generateUsers } = require('./generate-new-user-credentials');
const { importUsers } = require('./import-users-from-credentials');
const { generatePredictions } = require('./generate-realistic-predictions-from-csv');

async function setupCompleteData() {
  try {
    console.log('🚀 Starting complete user data setup...\n');
    console.log('=' .repeat(60));
    
    // Step 1: Generate USER_CREDENTIALS.json
    console.log('\n📝 Step 1: Generating USER_CREDENTIALS.json...');
    console.log('-'.repeat(60));
    generateUsers();
    console.log('✅ USER_CREDENTIALS.json generated\n');
    
    // Step 2: Import users
    console.log('👥 Step 2: Importing users into MongoDB...');
    console.log('-'.repeat(60));
    await importUsers();
    console.log('✅ Users imported\n');
    
    // Step 3: Generate predictions
    console.log('🎯 Step 3: Generating realistic predictions from CSV data...');
    console.log('-'.repeat(60));
    await generatePredictions();
    console.log('✅ Predictions generated\n');
    
    console.log('=' .repeat(60));
    console.log('\n✅ Complete setup finished successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 120 users created (2 admins, 7 managers, 111 employees)');
    console.log('   - All users have proper hierarchical relationships');
    console.log('   - Realistic predictions generated from CSV datasets');
    console.log('   - Ready for use!\n');
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupCompleteData();
}

module.exports = { setupCompleteData };





