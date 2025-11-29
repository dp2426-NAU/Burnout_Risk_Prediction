// Realistic Data Generation Script - Created by Harish S & Team
// This script generates unique, realistic data for each user

const bcrypt = require('bcryptjs');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/burnout_risk_prediction?authSource=admin';

// Realistic names and data
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
  'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
  'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah',
  'Timothy', 'Dorothy', 'Ronald', 'Amy', 'Jason', 'Angela', 'Edward', 'Ashley',
  'Jeffrey', 'Brenda', 'Ryan', 'Emma', 'Jacob', 'Olivia', 'Gary', 'Cynthia',
  'Nicholas', 'Marie', 'Eric', 'Janet', 'Jonathan', 'Catherine', 'Stephen', 'Frances',
  'Larry', 'Christine', 'Justin', 'Samantha', 'Scott', 'Debra', 'Brandon', 'Rachel',
  'Benjamin', 'Carolyn', 'Samuel', 'Janet', 'Gregory', 'Virginia', 'Alexander', 'Maria',
  'Patrick', 'Heather', 'Jack', 'Diane', 'Dennis', 'Julie', 'Jerry', 'Joyce',
  'Tyler', 'Victoria', 'Aaron', 'Kelly', 'Jose', 'Christina', 'Henry', 'Joan',
  'Adam', 'Evelyn', 'Douglas', 'Judith', 'Nathan', 'Megan', 'Zachary', 'Cheryl',
  'Kyle', 'Andrea', 'Noah', 'Hannah', 'Alan', 'Jacqueline', 'Ethan', 'Martha'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell',
  'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher',
  'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
  'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant',
  'Herrera', 'Gibson', 'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray',
  'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison', 'Fernandez', 'McDonald', 'Woods',
  'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb',
  'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter',
  'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz',
  'Hunt', 'Hicks', 'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd',
  'Rose', 'Stone', 'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice',
  'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Wells'
];

const departments = [
  'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations',
  'Product Management', 'Customer Success', 'Data Science', 'Design', 'Quality Assurance',
  'Business Development', 'Legal', 'IT Support', 'Research & Development'
];

const employeeJobTitles = [
  'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Marketing Specialist',
  'Sales Representative', 'HR Specialist', 'Financial Analyst', 'Operations Coordinator',
  'UX Designer', 'Data Analyst', 'QA Engineer', 'Business Analyst', 'Legal Assistant',
  'IT Support Specialist', 'Research Assistant', 'Project Coordinator', 'Content Writer',
  'Account Manager', 'Customer Success Specialist', 'DevOps Engineer', 'Frontend Developer',
  'Backend Developer', 'Full Stack Developer', 'Mobile Developer', 'Data Scientist',
  'Machine Learning Engineer', 'Cloud Architect', 'Security Engineer', 'Scrum Master',
  'Technical Writer', 'Support Engineer', 'Sales Engineer', 'Marketing Coordinator',
  'HR Coordinator', 'Finance Coordinator', 'Operations Analyst', 'Product Analyst',
  'Design Researcher', 'UX Researcher', 'Visual Designer', 'Interaction Designer',
  'Brand Manager', 'Digital Marketing Specialist', 'Social Media Manager', 'Content Manager',
  'Account Executive', 'Sales Manager', 'Customer Success Manager', 'Partnership Manager'
];

const managerJobTitles = [
  'Engineering Manager', 'Senior Engineering Manager', 'VP of Engineering', 'CTO',
  'Product Director', 'VP of Product', 'Chief Product Officer', 'Marketing Director',
  'VP of Marketing', 'Chief Marketing Officer', 'Sales Director', 'VP of Sales',
  'Chief Revenue Officer', 'HR Director', 'VP of Human Resources', 'Chief People Officer',
  'Finance Director', 'CFO', 'Operations Director', 'COO', 'Data Science Manager',
  'VP of Data', 'Chief Data Officer', 'Design Director', 'VP of Design',
  'Chief Design Officer', 'QA Director', 'VP of Quality', 'Business Development Director',
  'VP of Business Development', 'General Counsel', 'Chief Legal Officer', 'IT Director',
  'VP of Technology', 'Research Director', 'VP of Research', 'Project Director',
  'Program Manager', 'VP of Operations', 'Chief Operating Officer', 'Regional Manager',
  'Department Head', 'Team Lead', 'Senior Manager', 'Principal Manager'
];

// Generate realistic work patterns based on role and department
function generateRealisticWorkPatterns(role, department, isManager = false, userId) {
  // Use userId as seed for consistent data
  const seed = userId.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  const random = (multiplier = 1) => Math.sin(seed * multiplier) * 0.5 + 0.5;
  
  // High-stress departments
  const highStressDepts = ['Engineering', 'Sales', 'Operations', 'Customer Success'];
  const isHighStress = highStressDepts.includes(department);
  
  // Manager-specific patterns
  const baseHours = isManager ? 45 + random(1) * 10 : 35 + random(2) * 15;
  const meetingHours = isManager ? 
    15 + random(3) * 20 : // 15-35 hours for managers
    5 + random(4) * 10;   // 5-15 hours for employees
  
  const workHours = Math.max(35, Math.min(70, baseHours));
  const overtimeHours = Math.max(0, workHours - 40);
  
  // Generate realistic email patterns
  const emailCount = isManager ? 
    20 + random(5) * 30 : // 20-50 for managers
    10 + random(6) * 20;  // 10-30 for employees
  
  // Generate stress and workload based on role and department
  const baseStress = isHighStress ? 6 : 4;
  const stressLevel = Math.max(1, Math.min(10, baseStress + random(7) * 3 + (isManager ? 1 : 0)));
  
  const baseWorkload = isHighStress ? 7 : 5;
  const workloadScore = Math.max(1, Math.min(10, baseWorkload + random(8) * 2 + (isManager ? 1 : 0)));
  
  // Work-life balance inversely related to stress and workload
  const workLifeBalance = Math.max(1, Math.min(10, 10 - stressLevel + random(9) * 2));
  
  // Team size for managers
  const teamSize = isManager ? Math.floor(3 + random(10) * 15) : 0; // 3-18 for managers
  
  // Remote work percentage
  const remoteWorkPercentage = Math.floor(random(11) * 100);
  
  // Deadline pressure
  const deadlinePressure = Math.max(1, Math.min(10, 
    (isHighStress ? 6 : 4) + random(12) * 3
  ));
  
  return {
    workHoursPerWeek: Math.round(workHours),
    meetingHoursPerWeek: Math.round(meetingHours),
    emailCountPerDay: Math.round(emailCount),
    stressLevel: Math.round(stressLevel * 10) / 10,
    workloadScore: Math.round(workloadScore * 10) / 10,
    workLifeBalance: Math.round(workLifeBalance * 10) / 10,
    teamSize: teamSize,
    remoteWorkPercentage: remoteWorkPercentage,
    overtimeHours: Math.round(overtimeHours),
    deadlinePressure: Math.round(deadlinePressure * 10) / 10,
    sleepQuality: Math.max(1, Math.min(10, 8 - random(13) * 3)),
    exerciseFrequency: Math.max(1, Math.min(10, 3 + random(14) * 5)),
    nutritionQuality: Math.max(1, Math.min(10, 5 + random(15) * 3)),
    socialSupport: Math.max(1, Math.min(10, 6 + random(16) * 3)),
    jobSatisfaction: Math.max(1, Math.min(10, 5 + random(17) * 4))
  };
}

// Calculate burnout risk based on work patterns
function calculateRealisticBurnoutRisk(workPatterns) {
  const {
    workHoursPerWeek,
    meetingHoursPerWeek,
    emailCountPerDay,
    stressLevel,
    workloadScore,
    workLifeBalance,
    overtimeHours,
    deadlinePressure,
    sleepQuality,
    exerciseFrequency,
    nutritionQuality,
    socialSupport,
    jobSatisfaction
  } = workPatterns;
  
  // Weighted risk calculation with more factors
  const riskFactors = [
    (workHoursPerWeek - 40) / 30 * 0.15, // Overtime factor
    (meetingHoursPerWeek - 10) / 20 * 0.1, // Meeting overload
    (emailCountPerDay - 15) / 30 * 0.05, // Email overload
    (stressLevel - 5) / 5 * 0.2, // Stress level
    (workloadScore - 5) / 5 * 0.15, // Workload
    (5 - workLifeBalance) / 5 * 0.1, // Poor work-life balance
    (overtimeHours) / 20 * 0.05, // Overtime hours
    (deadlinePressure - 5) / 5 * 0.1, // Deadline pressure
    (5 - sleepQuality) / 5 * 0.05, // Poor sleep
    (5 - exerciseFrequency) / 5 * 0.03, // Lack of exercise
    (5 - nutritionQuality) / 5 * 0.02, // Poor nutrition
    (5 - socialSupport) / 5 * 0.03, // Lack of social support
    (5 - jobSatisfaction) / 5 * 0.07 // Low job satisfaction
  ];
  
  const riskScore = Math.max(0, Math.min(1, riskFactors.reduce((sum, factor) => sum + factor, 0)));
  
  // Add some realistic variation
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

// Generate realistic prediction results for a user
function generateRealisticPredictionResults(userId, workPatterns, burnoutRisk, userRole) {
  const predictions = [];
  const daysInMonth = 30;
  
  // Use userId as seed for consistent data
  const seed = userId.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  const random = (multiplier = 1) => Math.sin(seed * multiplier) * 0.5 + 0.5;
  
  for (let day = 0; day < daysInMonth; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    // Add realistic daily variation
    const dailyVariation = (random(day + 1) - 0.5) * 0.15;
    const dailyRiskScore = Math.max(0, Math.min(1, burnoutRisk.riskScore + dailyVariation));
    
    const dailyRiskLevel = dailyRiskScore < 0.3 ? 'low' : 
                          dailyRiskScore < 0.6 ? 'medium' : 
                          dailyRiskScore < 0.8 ? 'high' : 'critical';
    
    // Generate realistic factors based on work patterns
    const factors = {
      workHours: workPatterns.workHoursPerWeek > 50 ? 'excessive' : 
                 workPatterns.workHoursPerWeek > 45 ? 'high' : 'normal',
      stressLevel: workPatterns.stressLevel > 7 ? 'high' : 
                  workPatterns.stressLevel > 5 ? 'moderate' : 'low',
      workload: workPatterns.workloadScore > 8 ? 'heavy' : 
                workPatterns.workloadScore > 6 ? 'moderate' : 'light',
      workLifeBalance: workPatterns.workLifeBalance < 4 ? 'poor' : 
                      workPatterns.workLifeBalance < 6 ? 'fair' : 'good',
      teamSize: userRole === 'manager' ? 
                (workPatterns.teamSize > 10 ? 'large' : 'small') : 'n/a',
      remoteWork: workPatterns.remoteWorkPercentage > 70 ? 'high' : 
                  workPatterns.remoteWorkPercentage > 30 ? 'moderate' : 'low'
    };
    
    // Generate role-specific recommendations
    const recommendations = generateRoleSpecificRecommendations(dailyRiskLevel, workPatterns, userRole);
    
    predictions.push({
      userId: userId,
      riskLevel: dailyRiskLevel,
      riskScore: Math.round(dailyRiskScore * 100) / 100,
      confidence: 0.7 + random(day + 2) * 0.2, // 0.7-0.9
      factors: factors,
      recommendations: recommendations,
      modelVersion: '1.0.0',
      predictionDate: date,
      isActive: true,
      workPatterns: workPatterns // Include work patterns for reference
    });
  }
  
  return predictions;
}

// Generate role-specific recommendations
function generateRoleSpecificRecommendations(riskLevel, workPatterns, userRole) {
  const recommendations = [];
  
  if (userRole === 'admin') {
    if (riskLevel === 'low') {
      recommendations.push('Continue monitoring system health');
      recommendations.push('Review team performance metrics');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor high-risk team members');
      recommendations.push('Review organizational policies');
    } else if (riskLevel === 'high') {
      recommendations.push('Implement organization-wide wellness programs');
      recommendations.push('Review workload distribution across teams');
    } else {
      recommendations.push('Immediate organizational intervention required');
      recommendations.push('Consider external consulting for burnout prevention');
    }
  } else if (userRole === 'manager') {
    if (riskLevel === 'low') {
      recommendations.push('Continue maintaining healthy team dynamics');
      recommendations.push('Regular team check-ins');
    } else if (riskLevel === 'medium') {
      recommendations.push('Reduce team meeting frequency');
      recommendations.push('Implement flexible work arrangements');
    } else if (riskLevel === 'high') {
      recommendations.push('Urgent: Redistribute team workload');
      recommendations.push('Schedule team wellness sessions');
    } else {
      recommendations.push('Immediate action: Reduce team pressure');
      recommendations.push('Consider temporary team restructuring');
    }
  } else { // employee
    if (riskLevel === 'low') {
      recommendations.push('Continue maintaining healthy work habits');
      recommendations.push('Regular stress monitoring');
    } else if (riskLevel === 'medium') {
      recommendations.push('Consider reducing work hours if possible');
      recommendations.push('Take regular breaks throughout the day');
    } else if (riskLevel === 'high') {
      recommendations.push('Urgent: Reduce workload and work hours');
      recommendations.push('Schedule regular time off');
    } else {
      recommendations.push('Immediate action required: Take time off');
      recommendations.push('Contact HR or management immediately');
    }
  }
  
  return recommendations;
}

// Main function to generate realistic data
async function generateRealisticData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('burnout_risk_prediction');
    
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('predictionResults').deleteMany({});
    
    console.log('👥 Generating 50 employees with unique data...');
    const employees = [];
    const employeePredictions = [];
    
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const department = departments[i % departments.length];
      const jobTitle = employeeJobTitles[i % employeeJobTitles.length];
      
      const userId = new ObjectId();
      const workPatterns = generateRealisticWorkPatterns('user', department, false, userId);
      const burnoutRisk = calculateRealisticBurnoutRisk(workPatterns);
      
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
        workPatterns: workPatterns, // Store work patterns
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      employees.push(employee);
      employeePredictions.push(...generateRealisticPredictionResults(userId, workPatterns, burnoutRisk, 'user'));
    }
    
    console.log('👨‍💼 Generating 10 managers with unique data...');
    const managers = [];
    const managerPredictions = [];
    
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[(i + 50) % firstNames.length];
      const lastName = lastNames[(i + 50) % lastNames.length];
      const department = departments[(i + 50) % departments.length];
      const jobTitle = managerJobTitles[i % managerJobTitles.length];
      
      const userId = new ObjectId();
      const workPatterns = generateRealisticWorkPatterns('manager', department, true, userId);
      const burnoutRisk = calculateRealisticBurnoutRisk(workPatterns);
      
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
        experienceYears: Math.floor(Math.random() * 10) + 10, // 10-20 years
        workPatterns: workPatterns, // Store work patterns
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      managers.push(manager);
      managerPredictions.push(...generateRealisticPredictionResults(userId, workPatterns, burnoutRisk, 'manager'));
    }
    
    console.log('👑 Generating admin user...');
    const adminUserId = new ObjectId();
    const adminWorkPatterns = generateRealisticWorkPatterns('admin', 'IT', true, adminUserId);
    const adminBurnoutRisk = calculateRealisticBurnoutRisk(adminWorkPatterns);
    
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
    
    const adminPredictions = generateRealisticPredictionResults(adminUserId, adminWorkPatterns, adminBurnoutRisk, 'admin');
    
    console.log('💾 Inserting data into database...');
    
    // Insert users
    const allUsers = [...employees, ...managers, admin];
    const userResult = await db.collection('users').insertMany(allUsers);
    console.log(`✅ Inserted ${userResult.insertedCount} users`);
    
    // Insert prediction results
    const allPredictions = [...employeePredictions, ...managerPredictions, ...adminPredictions];
    const predictionResult = await db.collection('predictionResults').insertMany(allPredictions);
    console.log(`✅ Inserted ${predictionResult.insertedCount} prediction results`);
    
    // Generate summary statistics
    const userStats = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    
    const riskStats = await db.collection('predictionResults').aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n📊 Realistic Data Generation Summary:');
    console.log('=====================================');
    userStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });
    
    console.log('\n🎯 Risk Level Distribution:');
    riskStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} predictions`);
    });
    
    // Show sample data
    console.log('\n👤 Sample Employee Data:');
    const sampleEmployee = employees[0];
    console.log(`Name: ${sampleEmployee.firstName} ${sampleEmployee.lastName}`);
    console.log(`Email: ${sampleEmployee.email}`);
    console.log(`Department: ${sampleEmployee.department}`);
    console.log(`Job Title: ${sampleEmployee.jobTitle}`);
    console.log(`Work Hours: ${sampleEmployee.workPatterns.workHoursPerWeek}/week`);
    console.log(`Stress Level: ${sampleEmployee.workPatterns.stressLevel}/10`);
    console.log(`Risk Level: ${employeePredictions[0].riskLevel}`);
    
    console.log('\n👨‍💼 Sample Manager Data:');
    const sampleManager = managers[0];
    console.log(`Name: ${sampleManager.firstName} ${sampleManager.lastName}`);
    console.log(`Email: ${sampleManager.email}`);
    console.log(`Department: ${sampleManager.department}`);
    console.log(`Job Title: ${sampleManager.jobTitle}`);
    console.log(`Team Size: ${sampleManager.workPatterns.teamSize} people`);
    console.log(`Work Hours: ${sampleManager.workPatterns.workHoursPerWeek}/week`);
    console.log(`Risk Level: ${managerPredictions[0].riskLevel}`);
    
    console.log('\n✅ Realistic data generation completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('===================');
    console.log('Admin: admin@burnout-prediction.com / admin123');
    console.log('Sample Employee: employee1@company.com / password123');
    console.log('Sample Manager: manager1@company.com / password123');
    
  } catch (error) {
    console.error('❌ Error generating realistic data:', error);
  } finally {
    await client.close();
  }
}

// Run the script
if (require.main === module) {
  generateRealisticData();
}

module.exports = { generateRealisticData };
