// Test script to verify backend database connection and user query
require('dotenv').config();
const mongoose = require('mongoose');

// Simulate the exact same normalization the backend uses
function normalizeMongoDBURI(uri) {
  if (uri.includes('mongodb+srv://')) {
    const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^\/\?]+)/);
    if (match) {
      const clusterHost = match[1];
      const clusterIndex = uri.indexOf(clusterHost) + clusterHost.length;
      const afterCluster = uri.substring(clusterIndex);
      
      if (afterCluster === '' || afterCluster === '/' || afterCluster.startsWith('/?')) {
        if (afterCluster.startsWith('/?')) {
          uri = uri.replace(clusterHost + '/?', clusterHost + '/burnout-risk-prediction?');
        } else if (afterCluster === '/') {
          uri = uri.replace(clusterHost + '/', clusterHost + '/burnout-risk-prediction');
        } else {
          uri = uri.replace(clusterHost, clusterHost + '/burnout-risk-prediction');
        }
      } else if (afterCluster.startsWith('/') && !afterCluster.match(/^\/burnout-risk-prediction(\?|$)/)) {
        const pathMatch = afterCluster.match(/^(\/[^?]+)(\?.*)?$/);
        if (pathMatch && pathMatch[1] !== '/burnout-risk-prediction') {
          uri = uri.replace(clusterHost + pathMatch[1], clusterHost + '/burnout-risk-prediction');
        }
      }
    }
  }
  return uri;
}

// Database connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';
const normalizedURI = normalizeMongoDBURI(MONGODB_URI);

console.log('🔍 Testing Backend Database Connection\n');
console.log(`Original URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
console.log(`Normalized URI: ${normalizedURI.replace(/\/\/.*@/, '//***:***@')}\n`);

// User schema matching backend model exactly
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { type: String, required: true, select: false },
  firstName: String,
  lastName: String,
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function testBackendConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(normalizedURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    const db = mongoose.connection.db;
    console.log(`✅ Connected to MongoDB`);
    console.log(`   Database name: ${db.databaseName}\n`);
    
    // Test the exact query the backend uses
    const testEmail = 'johann.stracke@company.com';
    const normalizedEmail = testEmail.toLowerCase().trim();
    
    console.log(`Testing login query for: "${testEmail}"`);
    console.log(`Normalized email: "${normalizedEmail}"\n`);
    
    // Exact query from backend auth.service.ts
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (user) {
      console.log('✅ User FOUND!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Password hash exists: ${user.password ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ User NOT FOUND!');
      
      // Check what's in the database
      console.log('\nChecking database contents...');
      const userCount = await User.countDocuments();
      console.log(`   Total users in database: ${userCount}`);
      
      if (userCount > 0) {
        console.log('\n   Sample users:');
        const sampleUsers = await User.find().limit(5).select('email firstName lastName');
        sampleUsers.forEach(u => {
          console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
        });
        
        // Check if email exists with different case
        const caseInsensitive = await User.findOne({ 
          email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
        });
        if (caseInsensitive) {
          console.log(`\n⚠️  Found user with case-insensitive search:`);
          console.log(`   Email in DB: "${caseInsensitive.email}"`);
          console.log(`   This suggests a case mismatch issue!`);
        }
      } else {
        console.log('   ⚠️  Database is empty! Users need to be imported.');
      }
    }
    
    // Check collection name
    console.log('\n📊 Database Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

testBackendConnection();

