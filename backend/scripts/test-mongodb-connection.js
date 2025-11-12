#!/usr/bin/env node
/**
 * Quick MongoDB Connection Test Script
 * Tests if MongoDB is accessible before running other scripts
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

console.log('🔍 Testing MongoDB connection...');
console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ MongoDB connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Solutions:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check your .env file has MONGODB_URI set');
    console.log('   3. Verify connection string is correct');
    console.log('   4. See docs/MONGODB_SETUP.md for detailed setup guide');
    process.exit(1);
  });

