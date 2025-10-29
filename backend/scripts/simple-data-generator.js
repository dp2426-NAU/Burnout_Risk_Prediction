// Simple Data Generator - Created by Balaji Koneti
// This script generates basic synthetic data for testing

const bcrypt = require('bcryptjs');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/burnout_risk_prediction?authSource=admin';

// Generate users only first
async function generateUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('burnout_risk_prediction');
    
    console.log('🗑️  Clearing existing users...');
    await db.collection('users').deleteMany({});
    
    console.log('👥 Generating 50 employees...');
    const employees = [];
    
    for (let i = 0; i < 50; i++) {
      const firstName = `Employee${i + 1}`;
      const lastName = `Last${i + 1}`;
      const department = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][Math.floor(Math.random() * 5)];
      const jobTitle = ['Developer', 'Analyst', 'Specialist', 'Coordinator'][Math.floor(Math.random() * 4)];
      
      const employee = {
        email: `employee${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'user',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      employees.push(employee);
    }
    
    console.log('👨‍💼 Generating 10 managers...');
    const managers = [];
    
    for (let i = 0; i < 10; i++) {
      const firstName = `Manager${i + 1}`;
      const lastName = `Last${i + 1}`;
      const department = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][Math.floor(Math.random() * 5)];
      const jobTitle = ['Manager', 'Director', 'Lead'][Math.floor(Math.random() * 3)];
      
      const manager = {
        email: `manager${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'manager',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 10) + 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      managers.push(manager);
    }
    
    console.log('💾 Inserting users into database...');
    const allUsers = [...employees, ...managers];
    const userResult = await db.collection('users').insertMany(allUsers);
    console.log(`✅ Inserted ${userResult.insertedCount} users`);
    
    // Get user IDs for other collections
    const insertedUsers = await db.collection('users').find({}).toArray();
    console.log(`📊 Total users in database: ${insertedUsers.length}`);
    
    // Generate some basic prediction results
    console.log('🎯 Generating prediction results...');
    const predictions = [];
    
    for (const user of insertedUsers) {
      const riskScore = Math.random();
      const riskLevel = riskScore < 0.3 ? 'low' : 
                       riskScore < 0.6 ? 'medium' : 
                       riskScore < 0.8 ? 'high' : 'critical';
      
      predictions.push({
        userId: user._id,
        riskLevel: riskLevel,
        riskScore: riskScore,
        confidence: 0.7 + Math.random() * 0.2,
        factors: {
          workHours: riskScore > 0.5 ? 'excessive' : 'normal',
          stressLevel: riskScore > 0.6 ? 'high' : 'moderate',
          workload: riskScore > 0.7 ? 'heavy' : 'manageable',
          workLifeBalance: riskScore > 0.6 ? 'poor' : 'good'
        },
        recommendations: riskLevel === 'high' || riskLevel === 'critical' ? 
          ['Reduce workload', 'Take breaks', 'Seek support'] : 
          ['Maintain current habits', 'Monitor stress levels'],
        modelVersion: '1.0.0',
        predictionDate: new Date(),
        isActive: true
      });
    }
    
    // Clear and insert predictions
    await db.collection('predictionResults').deleteMany({});
    const predictionResult = await db.collection('predictionResults').insertMany(predictions);
    console.log(`✅ Inserted ${predictionResult.insertedCount} prediction results`);
    
    // Generate summary
    const userStats = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    
    const riskStats = await db.collection('predictionResults').aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📊 Data Generation Summary:');
    console.log('========================');
    userStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });
    
    console.log('\n🎯 Risk Level Distribution:');
    riskStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} predictions`);
    });
    
    console.log('\n✅ Synthetic data generation completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('===================');
    console.log('Admin: admin@burnout-prediction.com / admin123');
    console.log('Sample Employee: employee1@company.com / password123');
    console.log('Sample Manager: manager1@company.com / password123');
    
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error);
  } finally {
    await client.close();
  }
}

// Run the script
if (require.main === module) {
  generateUsers();
}

module.exports = { generateUsers };
