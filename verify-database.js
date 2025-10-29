// Database Verification Script - Created by Balaji Koneti
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/burnout_risk_prediction?authSource=admin';

async function verifyDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('burnout_risk_prediction');
    
    console.log('🔍 Verifying Database Contents...\n');
    
    // Get user counts by role
    const userCounts = await db.collection('users').aggregate([
      { 
        $group: { 
          _id: '$role', 
          count: { $sum: 1 },
          users: { 
            $push: { 
              email: '$email', 
              firstName: '$firstName', 
              lastName: '$lastName', 
              department: '$department', 
              jobTitle: '$jobTitle',
              experienceYears: '$experienceYears'
            } 
          } 
        } 
      }
    ]).toArray();
    
    console.log('📊 User Count by Role:');
    console.log('=====================');
    
    let totalUsers = 0;
    userCounts.forEach(role => {
      console.log(`\n${role._id.toUpperCase()}: ${role.count} users`);
      totalUsers += role.count;
      
      console.log('Sample users:');
      role.users.slice(0, 3).forEach(user => {
        console.log(`  - ${user.email}`);
        console.log(`    Name: ${user.firstName} ${user.lastName}`);
        console.log(`    Role: ${user.department}/${user.jobTitle}`);
        console.log(`    Experience: ${user.experienceYears} years`);
        console.log('');
      });
      
      if (role.users.length > 3) {
        console.log(`  ... and ${role.users.length - 3} more ${role._id}s`);
      }
    });
    
    console.log(`\n📈 Total Users in Database: ${totalUsers}`);
    
    // Check if we have exactly 50 employees and 10 managers
    const employeeCount = userCounts.find(r => r._id === 'user')?.count || 0;
    const managerCount = userCounts.find(r => r._id === 'manager')?.count || 0;
    const adminCount = userCounts.find(r => r._id === 'admin')?.count || 0;
    
    console.log('\n✅ Verification Results:');
    console.log('========================');
    console.log(`Employees (expected 50): ${employeeCount} ${employeeCount === 50 ? '✅' : '❌'}`);
    console.log(`Managers (expected 10): ${managerCount} ${managerCount === 10 ? '✅' : '❌'}`);
    console.log(`Admins (expected 1): ${adminCount} ${adminCount === 1 ? '✅' : '❌'}`);
    
    if (employeeCount === 50 && managerCount === 10 && adminCount === 1) {
      console.log('\n🎉 Database verification PASSED! All users are correctly saved.');
    } else {
      console.log('\n⚠️  Database verification FAILED! Missing some users.');
    }
    
    // Check prediction results
    const predictionCount = await db.collection('predictionResults').countDocuments();
    console.log(`\n📊 Prediction Results: ${predictionCount} predictions generated`);
    
    // Get risk level distribution
    const riskDistribution = await db.collection('predictionResults').aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n🎯 Risk Level Distribution:');
    riskDistribution.forEach(risk => {
      console.log(`  ${risk._id}: ${risk.count} predictions`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await client.close();
  }
}

// Run verification
if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
