// Debug script to test login for a specific user
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

if (MONGODB_URI.includes('mongodb+srv://')) {
  const clusterMatch = MONGODB_URI.match(/mongodb\+srv:\/\/[^@]+@([^\/\?]+)/);
  if (clusterMatch) {
    const clusterHost = clusterMatch[1];
    const afterCluster = MONGODB_URI.split(clusterHost)[1];
    if (!afterCluster || afterCluster.startsWith('/?') || afterCluster === '/') {
      MONGODB_URI = MONGODB_URI.replace(clusterHost + '/', clusterHost + '/burnout-risk-prediction');
      MONGODB_URI = MONGODB_URI.replace(clusterHost + '?', clusterHost + '/burnout-risk-prediction?');
    } else if (afterCluster.startsWith('/') && !afterCluster.startsWith('/burnout-risk-prediction')) {
      const pathAndQuery = afterCluster.split('?');
      MONGODB_URI = MONGODB_URI.replace(clusterHost + pathAndQuery[0], clusterHost + '/burnout-risk-prediction');
    }
  }
}

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  firstName: String,
  lastName: String,
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { collection: 'users' });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function testLogin(email, password) {
  try {
    console.log(`\n🔍 Testing login for: ${email}`);
    console.log(`   Password: ${password}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Try different email variations
    const emailVariations = [
      email,
      email.toLowerCase(),
      email.trim()
    ];
    
    let user = null;
    for (const emailVar of emailVariations) {
      user = await User.findOne({ email: emailVar.toLowerCase() }).select('+password');
      if (user) {
        console.log(`✅ Found user with email: ${emailVar}`);
        break;
      }
    }
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('\n📋 Searching for similar emails...');
      const allUsers = await User.find().select('email firstName lastName role isActive').limit(10);
      console.log('   Sample users in database:');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) - ${u.firstName} ${u.lastName}`);
      });
      process.exit(1);
    }
    
    console.log(`\n📊 User Details:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    
    // Test password comparison
    console.log(`\n🔐 Testing password comparison...`);
    const isValid = await user.comparePassword(password);
    
    if (isValid) {
      console.log('✅ Password is VALID!');
      console.log('\n✅ Login should work!');
    } else {
      console.log('❌ Password is INVALID!');
      console.log('\n💡 Testing password hash...');
      
      // Try to hash the password and compare
      const testHash = await bcrypt.hash(password, 12);
      console.log(`   Test hash: ${testHash.substring(0, 20)}...`);
      console.log(`   Stored hash: ${user.password.substring(0, 20)}...`);
      
      // Try direct comparison
      const directCompare = await bcrypt.compare(password, user.password);
      console.log(`   Direct compare result: ${directCompare}`);
      
      if (!directCompare) {
        console.log('\n❌ Password mismatch!');
        console.log('   The password in database might be different.');
        console.log('   Try resetting the password for this user.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

// Test the specific user
const testEmail = process.argv[2] || 'johann.stracke@company.com';
const testPassword = process.argv[3] || 'password123';

testLogin(testEmail, testPassword);

