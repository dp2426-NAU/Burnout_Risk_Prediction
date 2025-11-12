// Script to verify and fix email normalization in MongoDB
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

const User = mongoose.model('User', userSchema);

async function verifyAndFixEmails() {
  try {
    console.log('🔍 Checking email normalization in database...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users
    const users = await User.find().select('email firstName lastName');
    console.log(`Found ${users.length} users\n`);
    
    // Check for non-lowercase emails
    let needsFix = 0;
    const issues = [];
    
    for (const user of users) {
      const email = user.email;
      const normalized = email.toLowerCase().trim();
      
      if (email !== normalized) {
        issues.push({
          id: user._id,
          current: email,
          normalized: normalized,
          name: `${user.firstName} ${user.lastName}`
        });
        needsFix++;
      }
    }
    
    if (issues.length > 0) {
      console.log(`⚠️  Found ${issues.length} users with non-normalized emails:\n`);
      issues.forEach(issue => {
        console.log(`   - ${issue.name}: "${issue.current}" → "${issue.normalized}"`);
      });
      
      console.log('\n🔧 Fixing emails...');
      for (const issue of issues) {
        try {
          // Check if normalized email already exists
          const existing = await User.findOne({ email: issue.normalized });
          if (existing && existing._id.toString() !== issue.id.toString()) {
            console.log(`   ⚠️  Skipped ${issue.current}: normalized email already exists`);
            continue;
          }
          
          await User.updateOne(
            { _id: issue.id },
            { $set: { email: issue.normalized } }
          );
          console.log(`   ✅ Fixed: ${issue.current} → ${issue.normalized}`);
        } catch (error) {
          console.log(`   ❌ Error fixing ${issue.current}: ${error.message}`);
        }
      }
      console.log('\n✅ Email normalization complete!');
    } else {
      console.log('✅ All emails are properly normalized!');
    }
    
    // Test specific user
    console.log('\n🔍 Testing login for johann.stracke@company.com...');
    const testUser = await User.findOne({ email: 'johann.stracke@company.com' }).select('+password');
    
    if (testUser) {
      console.log(`   ✅ User found: ${testUser.email}`);
      console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Active: ${testUser.isActive}`);
      
      const isValid = await bcrypt.compare('password123', testUser.password);
      console.log(`   Password valid: ${isValid ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ User not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyAndFixEmails();

