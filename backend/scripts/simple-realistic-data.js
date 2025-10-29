// Simple Realistic Data Generation - Created by Balaji Koneti
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/burnout_risk_prediction?authSource=admin';

// Generate realistic work patterns
function generateWorkPatterns(role, department, isManager = false, userId) {
  const seed = userId.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  const random = (multiplier = 1) => Math.sin(seed * multiplier) * 0.5 + 0.5;
  
  const highStressDepts = ['Engineering', 'Sales', 'Operations', 'Customer Success'];
  const isHighStress = highStressDepts.includes(department);
  
  const baseHours = isManager ? 45 + random(1) * 10 : 35 + random(2) * 15;
  const workHours = Math.max(35, Math.min(70, baseHours));
  const meetingHours = isManager ? 15 + random(3) * 20 : 5 + random(4) * 10;
  const emailCount = isManager ? 20 + random(5) * 30 : 10 + random(6) * 20;
  
  const baseStress = isHighStress ? 6 : 4;
  const stressLevel = Math.max(1, Math.min(10, baseStress + random(7) * 3 + (isManager ? 1 : 0)));
  const workloadScore = Math.max(1, Math.min(10, stressLevel + random(8) * 2));
  const workLifeBalance = Math.max(1, Math.min(10, 10 - stressLevel + random(9) * 2));
  
  return {
    workHoursPerWeek: Math.round(workHours),
    meetingHoursPerWeek: Math.round(meetingHours),
    emailCountPerDay: Math.round(emailCount),
    stressLevel: Math.round(stressLevel * 10) / 10,
    workloadScore: Math.round(workloadScore * 10) / 10,
    workLifeBalance: Math.round(workLifeBalance * 10) / 10,
    teamSize: isManager ? Math.floor(3 + random(10) * 15) : 0,
    remoteWorkPercentage: Math.floor(random(11) * 100),
    overtimeHours: Math.max(0, workHours - 40),
    deadlinePressure: Math.round((isHighStress ? 6 : 4) + random(12) * 3 * 10) / 10,
    sleepQuality: Math.round((8 - random(13) * 3) * 10) / 10,
    exerciseFrequency: Math.round((3 + random(14) * 5) * 10) / 10,
    nutritionQuality: Math.round((5 + random(15) * 3) * 10) / 10,
    socialSupport: Math.round((6 + random(16) * 3) * 10) / 10,
    jobSatisfaction: Math.round((5 + random(17) * 4) * 10) / 10
  };
}

// Calculate burnout risk
function calculateBurnoutRisk(workPatterns) {
  const {
    workHoursPerWeek, stressLevel, workloadScore, workLifeBalance,
    overtimeHours, deadlinePressure, sleepQuality, exerciseFrequency,
    nutritionQuality, socialSupport, jobSatisfaction
  } = workPatterns;
  
  const riskFactors = [
    (workHoursPerWeek - 40) / 30 * 0.15,
    (stressLevel - 5) / 5 * 0.2,
    (workloadScore - 5) / 5 * 0.15,
    (5 - workLifeBalance) / 5 * 0.1,
    (overtimeHours) / 20 * 0.05,
    (deadlinePressure - 5) / 5 * 0.1,
    (5 - sleepQuality) / 5 * 0.05,
    (5 - exerciseFrequency) / 5 * 0.03,
    (5 - nutritionQuality) / 5 * 0.02,
    (5 - socialSupport) / 5 * 0.03,
    (5 - jobSatisfaction) / 5 * 0.07
  ];
  
  const riskScore = Math.max(0, Math.min(1, riskFactors.reduce((sum, factor) => sum + factor, 0)));
  const randomFactor = (Math.random() - 0.5) * 0.1;
  const finalRiskScore = Math.max(0, Math.min(1, riskScore + randomFactor));
  
  return {
    riskScore: finalRiskScore,
    riskLevel: finalRiskScore < 0.3 ? 'low' : 
               finalRiskScore < 0.6 ? 'medium' : 
               finalRiskScore < 0.8 ? 'high' : 'critical',
    burnoutRisk: finalRiskScore > 0.5 ? 1 : 0
  };
}

async function generateSimpleRealisticData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('burnout_risk_prediction');
    
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('predictionResults').deleteMany({});
    
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design', 'Data', 'Support'];
    const employeeTitles = ['Engineer', 'Analyst', 'Specialist', 'Coordinator', 'Developer', 'Designer', 'Manager', 'Director'];
    const managerTitles = ['Manager', 'Director', 'VP', 'Lead', 'Head', 'Principal'];
    
    console.log('👥 Generating 50 employees...');
    const employees = [];
    
    for (let i = 0; i < 50; i++) {
      const userId = new ObjectId();
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const department = departments[i % departments.length];
      const jobTitle = employeeTitles[i % employeeTitles.length];
      
      const workPatterns = generateWorkPatterns('user', department, false, userId);
      const burnoutRisk = calculateBurnoutRisk(workPatterns);
      
      const employee = {
        _id: userId,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'user',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 15) + 1,
        workPatterns: workPatterns,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      employees.push(employee);
    }
    
    console.log('👨‍💼 Generating 10 managers...');
    const managers = [];
    
    for (let i = 0; i < 10; i++) {
      const userId = new ObjectId();
      const firstName = firstNames[(i + 10) % firstNames.length];
      const lastName = lastNames[(i + 10) % lastNames.length];
      const department = departments[(i + 10) % departments.length];
      const jobTitle = managerTitles[i % managerTitles.length];
      
      const workPatterns = generateWorkPatterns('manager', department, true, userId);
      const burnoutRisk = calculateBurnoutRisk(workPatterns);
      
      const manager = {
        _id: userId,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.mgr${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'manager',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 10) + 10,
        workPatterns: workPatterns,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      managers.push(manager);
    }
    
    console.log('👑 Generating admin...');
    const adminUserId = new ObjectId();
    const adminWorkPatterns = generateWorkPatterns('admin', 'IT', true, adminUserId);
    const adminBurnoutRisk = calculateBurnoutRisk(adminWorkPatterns);
    
    const admin = {
      _id: adminUserId,
      email: 'admin@burnout-prediction.com',
      password: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      department: 'IT',
      jobTitle: 'System Administrator',
      experienceYears: 15,
      workPatterns: adminWorkPatterns,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Inserting users...');
    const allUsers = [...employees, ...managers, admin];
    const userResult = await db.collection('users').insertMany(allUsers);
    console.log(`✅ Inserted ${userResult.insertedCount} users`);
    
    // Generate simple predictions
    console.log('🎯 Generating predictions...');
    const predictions = [];
    
    for (const user of allUsers) {
      const workPatterns = user.workPatterns;
      const burnoutRisk = calculateBurnoutRisk(workPatterns);
      
      // Generate 5 predictions per user
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dailyVariation = (Math.random() - 0.5) * 0.1;
        const dailyRiskScore = Math.max(0, Math.min(1, burnoutRisk.riskScore + dailyVariation));
        const dailyRiskLevel = dailyRiskScore < 0.3 ? 'low' : 
                              dailyRiskScore < 0.6 ? 'medium' : 
                              dailyRiskScore < 0.8 ? 'high' : 'critical';
        
        predictions.push({
          userId: user._id,
          riskLevel: dailyRiskLevel,
          riskScore: Math.round(dailyRiskScore * 100) / 100,
          confidence: 0.7 + Math.random() * 0.2,
          factors: {
            workHours: workPatterns.workHoursPerWeek > 50 ? 'excessive' : 'normal',
            stressLevel: workPatterns.stressLevel > 7 ? 'high' : 'moderate',
            workload: workPatterns.workloadScore > 8 ? 'heavy' : 'manageable',
            workLifeBalance: workPatterns.workLifeBalance < 4 ? 'poor' : 'good'
          },
          recommendations: dailyRiskLevel === 'high' || dailyRiskLevel === 'critical' ? 
            ['Reduce workload', 'Take breaks', 'Seek support'] : 
            ['Maintain current habits', 'Monitor stress levels'],
          modelVersion: '1.0.0',
          predictionDate: date,
          isActive: true
        });
      }
    }
    
    const predictionResult = await db.collection('predictionResults').insertMany(predictions);
    console.log(`✅ Inserted ${predictionResult.insertedCount} predictions`);
    
    // Show sample data
    console.log('\n📊 Sample Data:');
    console.log('===============');
    
    const sampleEmployee = employees[0];
    console.log(`Employee: ${sampleEmployee.firstName} ${sampleEmployee.lastName}`);
    console.log(`Email: ${sampleEmployee.email}`);
    console.log(`Department: ${sampleEmployee.department}`);
    console.log(`Job Title: ${sampleEmployee.jobTitle}`);
    console.log(`Work Hours: ${sampleEmployee.workPatterns.workHoursPerWeek}/week`);
    console.log(`Stress Level: ${sampleEmployee.workPatterns.stressLevel}/10`);
    console.log(`Risk Level: ${predictions.find(p => p.userId.equals(sampleEmployee._id))?.riskLevel}`);
    
    const sampleManager = managers[0];
    console.log(`\nManager: ${sampleManager.firstName} ${sampleManager.lastName}`);
    console.log(`Email: ${sampleManager.email}`);
    console.log(`Department: ${sampleManager.department}`);
    console.log(`Job Title: ${sampleManager.jobTitle}`);
    console.log(`Team Size: ${sampleManager.workPatterns.teamSize} people`);
    console.log(`Work Hours: ${sampleManager.workPatterns.workHoursPerWeek}/week`);
    console.log(`Risk Level: ${predictions.find(p => p.userId.equals(sampleManager._id))?.riskLevel}`);
    
    // Get statistics
    const userStats = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    
    const riskStats = await db.collection('predictionResults').aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📈 Statistics:');
    console.log('==============');
    userStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });
    
    console.log('\n🎯 Risk Distribution:');
    riskStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} predictions`);
    });
    
    console.log('\n✅ Realistic data generation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  generateSimpleRealisticData();
}

module.exports = { generateSimpleRealisticData };
