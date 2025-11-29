// Script to import users from USER_CREDENTIALS.json into MongoDB
// This creates users in MongoDB with hashed passwords
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Database connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

// Ensure database name is set for MongoDB Atlas connections
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

// User schema (matches backend model)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  department: { type: String },
  jobTitle: { type: String },
  employeeId: { type: String },
  employeeName: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  gender: { type: String },
  dateOfBirth: { type: Date },
  age: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Load USER_CREDENTIALS.json
 */
function loadCredentials() {
  const credentialsPath = path.join(__dirname, '..', 'USER_CREDENTIALS.json');
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`USER_CREDENTIALS.json not found at ${credentialsPath}`);
  }
  
  const fileContent = fs.readFileSync(credentialsPath, 'utf-8');
  const data = JSON.parse(fileContent);
  
  // Combine admins, managers, and employees
  const admins = data.admins || [];
  const managers = data.managers || [];
  const employees = data.employees || [];
  
  return [...admins, ...managers, ...employees];
}

/**
 * Parse name into firstName and lastName
 */
function parseName(name) {
  if (!name) return { firstName: 'Unknown', lastName: 'User' };
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  const lastName = parts.pop();
  const firstName = parts.join(' ');
  
  return { firstName, lastName };
}

/**
 * Main function to import users
 */
async function importUsers() {
  try {
    console.log('🚀 Starting user import from USER_CREDENTIALS.json...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load credentials
    console.log('📄 Loading USER_CREDENTIALS.json...');
    const usersData = loadCredentials();
    console.log(`   Found ${usersData.length} users to import`);
    
    if (usersData.length === 0) {
      console.log('⚠️  No users found in USER_CREDENTIALS.json');
      process.exit(0);
    }
    
    // Step 1: Import all users first (without managerId)
    console.log('\n👥 Step 1: Importing users...');
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const idToObjectIdMap = {}; // Map userData.id -> MongoDB ObjectId
    
    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`   ⏭️  Skipped ${userData.email} (already exists)`);
          skipped++;
          idToObjectIdMap[userData.id] = existingUser._id;
          continue;
        }
        
        // Parse name
        const { firstName, lastName } = parseName(userData.name);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password || 'password123', 12);
        
        // Determine role - use 'user' for 'employee' role
        let role = userData.role;
        if (role === 'employee') {
          role = 'user';
        } else if (!role) {
          role = (userData.position?.toLowerCase().includes('manager') || 
                  userData.position?.toLowerCase().includes('director') ||
                  userData.position?.toLowerCase().includes('vp') ||
                  userData.position?.toLowerCase().includes('cfo') ||
                  userData.position?.toLowerCase().includes('coo') ? 'manager' : 'user');
        }
        
        // Parse dateOfBirth if provided
        let dateOfBirth = null;
        if (userData.dateOfBirth) {
          dateOfBirth = new Date(userData.dateOfBirth);
        }
        
        // Create user (without managerId for now)
        const user = new User({
          email: userData.email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          department: userData.department,
          jobTitle: userData.jobRole || userData.position,
          employeeId: userData.id,
          employeeName: userData.name,
          gender: userData.gender,
          dateOfBirth: dateOfBirth,
          age: userData.age,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await user.save();
        idToObjectIdMap[userData.id] = user._id;
        console.log(`   ✅ Imported ${userData.email} (${role})`);
        imported++;
        
      } catch (error) {
        console.error(`   ❌ Error importing ${userData.email}:`, error.message);
        errors++;
      }
    }
    
    // Step 2: Update managerId references
    console.log('\n🔗 Step 2: Setting up manager relationships...');
    let relationshipsUpdated = 0;
    
    for (const userData of usersData) {
      try {
        if (!userData.reportsTo) continue; // Skip if no manager
        
        const userObjectId = idToObjectIdMap[userData.id];
        const managerObjectId = idToObjectIdMap[userData.reportsTo];
        
        if (!userObjectId || !managerObjectId) {
          console.log(`   ⚠️  Skipped relationship for ${userData.id} -> ${userData.reportsTo} (user or manager not found)`);
          continue;
        }
        
        await User.updateOne(
          { _id: userObjectId },
          { $set: { managerId: managerObjectId } }
        );
        relationshipsUpdated++;
        
      } catch (error) {
        console.error(`   ❌ Error updating relationship for ${userData.id}:`, error.message);
      }
    }
    
    console.log(`   ✅ Updated ${relationshipsUpdated} manager relationships`);
    
    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported} users`);
    console.log(`   Skipped: ${skipped} users`);
    console.log(`   Errors: ${errors} users`);
    
    // Show summary
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const managers = await User.countDocuments({ role: 'manager' });
    const employees = await User.countDocuments({ role: 'user' });
    const withManagers = await User.countDocuments({ managerId: { $ne: null } });
    
    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admins: ${admins}`);
    console.log(`   Managers: ${managers}`);
    console.log(`   Employees: ${employees}`);
    console.log(`   Users with Managers: ${withManagers}`);
    
    // Show department distribution
    console.log(`\n📊 Department Distribution:`);
    const deptStats = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    deptStats.forEach(stat => {
      console.log(`   ${stat._id || 'N/A'}: ${stat.count}`);
    });
    
    // Show sample users
    console.log(`\n📋 Sample imported users:`);
    const sampleUsers = await User.find().limit(5).select('email firstName lastName role department jobTitle managerId');
    for (const user of sampleUsers) {
      const managerInfo = user.managerId ? ' (has manager)' : ' (no manager)';
      console.log(`   - ${user.email}: ${user.firstName} ${user.lastName} (${user.role}) - ${user.department}${managerInfo}`);
    }
    
  } catch (error) {
    console.error('❌ Error importing users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  importUsers();
}

module.exports = { importUsers };

