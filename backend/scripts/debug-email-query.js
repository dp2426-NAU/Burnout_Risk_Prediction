// Debug script to check exact email matching issue
require('dotenv').config();
const mongoose = require('mongoose');

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

// User schema matching backend model
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

async function debugEmailQuery() {
  try {
    console.log('🔍 Debugging email query issue...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testEmail = 'johann.stracke@company.com';
    const normalizedEmail = testEmail.toLowerCase().trim();
    
    console.log(`Test email: "${testEmail}"`);
    console.log(`Normalized: "${normalizedEmail}"\n`);
    
    // Try different query methods
    console.log('1. Query with exact match:');
    let user = await User.findOne({ email: normalizedEmail }).select('+password');
    console.log(`   Result: ${user ? '✅ Found' : '❌ Not found'}`);
    if (user) {
      console.log(`   Email in DB: "${user.email}"`);
      console.log(`   Match: ${user.email === normalizedEmail ? '✅' : '❌'}`);
    }
    
    console.log('\n2. Query with case-insensitive regex:');
    user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }).select('+password');
    console.log(`   Result: ${user ? '✅ Found' : '❌ Not found'}`);
    if (user) {
      console.log(`   Email in DB: "${user.email}"`);
    }
    
    console.log('\n3. Query all users and check emails:');
    const allUsers = await User.find().select('email firstName lastName').limit(5);
    console.log('   First 5 users:');
    allUsers.forEach(u => {
      const match = u.email === normalizedEmail;
      console.log(`   - "${u.email}" ${match ? '← MATCH!' : ''}`);
    });
    
    console.log('\n4. Direct MongoDB query (bypassing Mongoose):');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const directUser = await usersCollection.findOne({ email: normalizedEmail });
    console.log(`   Result: ${directUser ? '✅ Found' : '❌ Not found'}`);
    if (directUser) {
      console.log(`   Email in DB: "${directUser.email}"`);
      console.log(`   Email type: ${typeof directUser.email}`);
      console.log(`   Email length: ${directUser.email.length}`);
      console.log(`   Email bytes: ${Buffer.from(directUser.email).toString('hex')}`);
    }
    
    console.log('\n5. Check for similar emails:');
    const similarUsers = await usersCollection.find({ 
      email: { $regex: 'johann', $options: 'i' } 
    }).toArray();
    console.log(`   Found ${similarUsers.length} users with "johann" in email:`);
    similarUsers.forEach(u => {
      console.log(`   - "${u.email}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugEmailQuery();

