// Synthetic Data Generation Script - Created by Balaji Koneti
// This script generates realistic synthetic data for 50 employees and 10 managers

const bcrypt = require('bcryptjs');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/burnout_risk_prediction?authSource=admin';

// Realistic names for employees
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
  'Kyle', 'Andrea', 'Noah', 'Hannah', 'Alan', 'Jacqueline', 'Ethan', 'Martha',
  'Jeremy', 'Gloria', 'Carl', 'Teresa', 'Keith', 'Sara', 'Roger', 'Janice',
  'Gerald', 'Julia', 'Christian', 'Marie', 'Sean', 'Madison', 'Arthur', 'Grace',
  'Austin', 'Judy', 'Lawrence', 'Theresa', 'Joe', 'Beverly', 'Noah', 'Denise',
  'Wayne', 'Marilyn', 'Roy', 'Amber', 'Ralph', 'Danielle', 'Eugene', 'Rose',
  'Louis', 'Brittany', 'Philip', 'Diana', 'Bobby', 'Abigail', 'Johnny', 'Jane',
  'Willie', 'Lori', 'Harold', 'Mildred', 'Jordan', 'Lillian', 'Dylan', 'Jean',
  'Alan', 'Kathryn', 'Wayne', 'Shirley', 'Eugene', 'Tiffany', 'Ralph', 'Glenda',
  'Louis', 'Denise', 'Philip', 'Lori', 'Bobby', 'Lillian', 'Johnny', 'Jean',
  'Willie', 'Kathryn', 'Harold', 'Shirley', 'Jordan', 'Tiffany', 'Dylan', 'Glenda'
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
  'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Wells',
  'Silva', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds'
];

// Department names
const departments = [
  'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations',
  'Product Management', 'Customer Success', 'Data Science', 'Design', 'Quality Assurance',
  'Business Development', 'Legal', 'IT Support', 'Research & Development'
];

// Job titles
const jobTitles = [
  'Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Principal Engineer',
  'Product Manager', 'Senior Product Manager', 'Product Director', 'Marketing Manager',
  'Marketing Director', 'Sales Representative', 'Sales Manager', 'Sales Director',
  'HR Specialist', 'HR Manager', 'HR Director', 'Financial Analyst', 'Finance Manager',
  'Operations Manager', 'Operations Director', 'Data Scientist', 'Senior Data Scientist',
  'UX Designer', 'UI Designer', 'Design Director', 'QA Engineer', 'QA Manager',
  'Business Analyst', 'Business Development Manager', 'Legal Counsel', 'IT Support Specialist',
  'Research Scientist', 'Project Manager', 'Scrum Master', 'DevOps Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'Data Engineer', 'Machine Learning Engineer', 'Cloud Architect', 'Security Engineer'
];

// Manager job titles
const managerTitles = [
  'Engineering Manager', 'Senior Engineering Manager', 'VP of Engineering',
  'Product Director', 'VP of Product', 'Marketing Director', 'VP of Marketing',
  'Sales Director', 'VP of Sales', 'HR Director', 'VP of Human Resources',
  'Finance Director', 'CFO', 'Operations Director', 'COO', 'Data Science Manager',
  'VP of Data', 'Design Director', 'VP of Design', 'QA Director', 'VP of Quality',
  'Business Development Director', 'VP of Business Development', 'General Counsel',
  'IT Director', 'CTO', 'Research Director', 'VP of Research', 'Project Director',
  'Program Manager', 'VP of Operations', 'Chief Technology Officer', 'Chief Product Officer'
];

// Generate realistic work patterns based on role and department
function generateWorkPatterns(role, department, isManager = false) {
  const baseHours = isManager ? 45 : 40;
  const variation = isManager ? 15 : 10;
  
  // High-stress departments
  const highStressDepts = ['Engineering', 'Sales', 'Operations', 'Customer Success'];
  const isHighStress = highStressDepts.includes(department);
  
  // Manager-specific patterns
  const meetingHours = isManager ? 
    Math.floor(Math.random() * 20) + 15 : // 15-35 hours for managers
    Math.floor(Math.random() * 10) + 5;   // 5-15 hours for employees
  
  const workHours = Math.max(35, Math.min(60, 
    baseHours + Math.floor(Math.random() * variation) - Math.floor(variation / 2)
  ));
  
  const overtimeHours = Math.max(0, workHours - 40);
  
  return {
    workHoursPerWeek: workHours,
    meetingHoursPerWeek: meetingHours,
    emailCountPerDay: isManager ? 
      Math.floor(Math.random() * 30) + 20 : // 20-50 for managers
      Math.floor(Math.random() * 20) + 10,  // 10-30 for employees
    stressLevel: Math.max(1, Math.min(10, 
      (isHighStress ? 6 : 4) + Math.random() * 3 + (isManager ? 1 : 0)
    )),
    workloadScore: Math.max(1, Math.min(10, 
      (isHighStress ? 7 : 5) + Math.random() * 2 + (isManager ? 1 : 0)
    )),
    workLifeBalance: Math.max(1, Math.min(10, 
      8 - Math.random() * 3 - (isManager ? 1 : 0) - (isHighStress ? 1 : 0)
    )),
    teamSize: isManager ? Math.floor(Math.random() * 15) + 3 : 0, // 3-18 for managers
    remoteWorkPercentage: Math.floor(Math.random() * 100),
    overtimeHours: overtimeHours,
    deadlinePressure: Math.max(1, Math.min(10, 
      (isHighStress ? 6 : 4) + Math.random() * 3
    ))
  };
}

// Generate burnout risk based on work patterns
function calculateBurnoutRisk(workPatterns) {
  const {
    workHoursPerWeek,
    meetingHoursPerWeek,
    emailCountPerDay,
    stressLevel,
    workloadScore,
    workLifeBalance,
    overtimeHours,
    deadlinePressure
  } = workPatterns;
  
  // Weighted risk calculation
  const riskFactors = [
    (workHoursPerWeek - 40) / 20 * 0.2, // Overtime factor
    (meetingHoursPerWeek - 10) / 20 * 0.15, // Meeting overload
    (emailCountPerDay - 15) / 30 * 0.1, // Email overload
    (stressLevel - 5) / 5 * 0.25, // Stress level
    (workloadScore - 5) / 5 * 0.2, // Workload
    (5 - workLifeBalance) / 5 * 0.15, // Poor work-life balance
    (overtimeHours) / 20 * 0.1, // Overtime hours
    (deadlinePressure - 5) / 5 * 0.15 // Deadline pressure
  ];
  
  const riskScore = Math.max(0, Math.min(1, riskFactors.reduce((sum, factor) => sum + factor, 0)));
  
  // Add some randomness for realism
  const randomFactor = (Math.random() - 0.5) * 0.2;
  const finalRiskScore = Math.max(0, Math.min(1, riskScore + randomFactor));
  
  return {
    riskScore: finalRiskScore,
    riskLevel: finalRiskScore < 0.3 ? 'low' : 
               finalRiskScore < 0.6 ? 'medium' : 
               finalRiskScore < 0.8 ? 'high' : 'critical',
    burnoutRisk: finalRiskScore > 0.5 ? 1 : 0
  };
}

// Generate calendar events for a user
function generateCalendarEvents(userId, workPatterns, isManager = false) {
  const events = [];
  const daysInMonth = 30;
  const { workHoursPerWeek, meetingHoursPerWeek } = workPatterns;
  
  for (let day = 0; day < daysInMonth; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    // Work hours per day
    const dailyWorkHours = workHoursPerWeek / 5;
    const dailyMeetingHours = meetingHoursPerWeek / 5;
    
    // Morning work block
    events.push({
      userId: userId,
      title: 'Work Session',
      description: 'Focused work time',
      startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + Math.floor(dailyWorkHours), 0),
      eventType: 'work',
      isRecurring: false,
      stressLevel: Math.floor(Math.random() * 3) + 1,
      workload: Math.floor(Math.random() * 3) + 1
    });
    
    // Meetings
    const meetingCount = Math.floor(dailyMeetingHours);
    for (let i = 0; i < meetingCount; i++) {
      const meetingStart = 10 + i;
      events.push({
        userId: userId,
        title: isManager ? 'Team Meeting' : 'Project Meeting',
        description: isManager ? 'Team sync and planning' : 'Project discussion',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), meetingStart, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), meetingStart + 1, 0),
        eventType: 'meeting',
        isRecurring: false,
        stressLevel: Math.floor(Math.random() * 2) + 2,
        workload: Math.floor(Math.random() * 2) + 2
      });
    }
  }
  
  return events;
}

// Generate email messages for a user
function generateEmailMessages(userId, workPatterns, isManager = false) {
  const messages = [];
  const daysInMonth = 30;
  const { emailCountPerDay } = workPatterns;
  
  const emailTemplates = [
    { subject: 'Project Update', content: 'Here is the latest update on our project progress.', sentiment: 0.2 },
    { subject: 'Meeting Request', content: 'Can we schedule a meeting to discuss the upcoming deadline?', sentiment: -0.1 },
    { subject: 'Status Report', content: 'Please find attached the weekly status report.', sentiment: 0.1 },
    { subject: 'Urgent: Action Required', content: 'This requires immediate attention. Please review and respond.', sentiment: -0.5 },
    { subject: 'Team Collaboration', content: 'Great work on the recent deliverables!', sentiment: 0.6 },
    { subject: 'Deadline Reminder', content: 'Just a friendly reminder about the upcoming deadline.', sentiment: -0.2 },
    { subject: 'Feedback Request', content: 'I would appreciate your feedback on the proposal.', sentiment: 0.3 },
    { subject: 'Issue Escalation', content: 'We need to escalate this issue to management.', sentiment: -0.4 },
    { subject: 'Celebration', content: 'Congratulations on completing the project successfully!', sentiment: 0.8 },
    { subject: 'Resource Request', content: 'We need additional resources to meet the timeline.', sentiment: -0.3 }
  ];
  
  for (let day = 0; day < daysInMonth; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    const dailyEmails = Math.floor(emailCountPerDay + (Math.random() - 0.5) * 5);
    
    for (let i = 0; i < dailyEmails; i++) {
      const template = emailTemplates[Math.floor(Math.random() * emailTemplates.length)];
      const hour = 8 + Math.floor(Math.random() * 10); // 8 AM to 6 PM
      const minute = Math.floor(Math.random() * 60);
      
      messages.push({
        userId: userId,
        threadId: `thread_${userId}_${day}_${i}`,
        subject: template.subject,
        content: template.content,
        sender: `sender_${Math.floor(Math.random() * 10)}@company.com`,
        recipient: `user_${userId}@company.com`,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute),
        isImportant: Math.random() < 0.2,
        sentimentScore: template.sentiment + (Math.random() - 0.5) * 0.4,
        emotionTags: template.sentiment > 0.3 ? ['positive'] : template.sentiment < -0.3 ? ['negative', 'urgent'] : ['neutral']
      });
    }
  }
  
  return messages;
}

// Generate prediction results for a user
function generatePredictionResults(userId, workPatterns, burnoutRisk) {
  const predictions = [];
  const daysInMonth = 30;
  
  for (let day = 0; day < daysInMonth; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    // Add some variation to the risk score
    const variation = (Math.random() - 0.5) * 0.1;
    const dailyRiskScore = Math.max(0, Math.min(1, burnoutRisk.riskScore + variation));
    
    const dailyRiskLevel = dailyRiskScore < 0.3 ? 'low' : 
                          dailyRiskScore < 0.6 ? 'medium' : 
                          dailyRiskScore < 0.8 ? 'high' : 'critical';
    
    predictions.push({
      userId: userId,
      riskLevel: dailyRiskLevel,
      riskScore: dailyRiskScore,
      confidence: 0.7 + Math.random() * 0.2, // 0.7-0.9
      factors: {
        workHours: workPatterns.workHoursPerWeek > 50 ? 'excessive' : 'normal',
        stressLevel: workPatterns.stressLevel > 7 ? 'high' : 'moderate',
        workload: workPatterns.workloadScore > 8 ? 'heavy' : 'manageable',
        workLifeBalance: workPatterns.workLifeBalance < 4 ? 'poor' : 'good'
      },
      recommendations: generateRecommendations(dailyRiskLevel, workPatterns),
      modelVersion: '1.0.0',
      predictionDate: date,
      isActive: true
    });
  }
  
  return predictions;
}

// Generate recommendations based on risk level
function generateRecommendations(riskLevel, workPatterns) {
  const recommendations = [];
  
  if (riskLevel === 'low') {
    recommendations.push('Continue maintaining healthy work habits');
    recommendations.push('Regularly monitor your stress levels');
  } else if (riskLevel === 'medium') {
    recommendations.push('Consider reducing work hours if possible');
    recommendations.push('Take regular breaks throughout the day');
    recommendations.push('Practice stress management techniques');
  } else if (riskLevel === 'high') {
    recommendations.push('Urgent: Reduce workload and work hours');
    recommendations.push('Schedule regular time off');
    recommendations.push('Consider speaking with your manager about workload');
    recommendations.push('Seek professional help if needed');
  } else { // critical
    recommendations.push('Immediate action required: Take time off');
    recommendations.push('Contact HR or management immediately');
    recommendations.push('Consider professional counseling');
    recommendations.push('Review and adjust work responsibilities');
  }
  
  return recommendations;
}

// Main function to generate all synthetic data
async function generateSyntheticData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('burnout_risk_prediction');
    
    console.log('🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('calendarEvents').deleteMany({});
    await db.collection('emailMessages').deleteMany({});
    await db.collection('predictionResults').deleteMany({});
    
    console.log('👥 Generating 50 employees...');
    const employees = [];
    const employeeCalendarEvents = [];
    const employeeEmailMessages = [];
    const employeePredictions = [];
    
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const workPatterns = generateWorkPatterns(jobTitle, department, false);
      const burnoutRisk = calculateBurnoutRisk(workPatterns);
      
      const employee = {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'user',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 15) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      employees.push(employee);
      
      // Generate related data
      const userId = new ObjectId(); // Generate proper ObjectId
      employeeCalendarEvents.push(...generateCalendarEvents(userId, workPatterns, false));
      employeeEmailMessages.push(...generateEmailMessages(userId, workPatterns, false));
      employeePredictions.push(...generatePredictionResults(userId, workPatterns, burnoutRisk));
    }
    
    console.log('👨‍💼 Generating 10 managers...');
    const managers = [];
    const managerCalendarEvents = [];
    const managerEmailMessages = [];
    const managerPredictions = [];
    
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const jobTitle = managerTitles[Math.floor(Math.random() * managerTitles.length)];
      const workPatterns = generateWorkPatterns(jobTitle, department, true);
      const burnoutRisk = calculateBurnoutRisk(workPatterns);
      
      const manager = {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.mgr${i + 1}@company.com`,
        password: await bcrypt.hash('password123', 12),
        firstName: firstName,
        lastName: lastName,
        role: 'manager',
        isActive: true,
        department: department,
        jobTitle: jobTitle,
        experienceYears: Math.floor(Math.random() * 10) + 10, // 10-20 years
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      managers.push(manager);
      
      // Generate related data
      const userId = new ObjectId(); // Generate proper ObjectId
      managerCalendarEvents.push(...generateCalendarEvents(userId, workPatterns, true));
      managerEmailMessages.push(...generateEmailMessages(userId, workPatterns, true));
      managerPredictions.push(...generatePredictionResults(userId, workPatterns, burnoutRisk));
    }
    
    console.log('💾 Inserting data into database...');
    
    // Insert users
    const allUsers = [...employees, ...managers];
    const userResult = await db.collection('users').insertMany(allUsers);
    console.log(`✅ Inserted ${userResult.insertedCount} users`);
    
    // Insert calendar events
    const allCalendarEvents = [...employeeCalendarEvents, ...managerCalendarEvents];
    const calendarResult = await db.collection('calendarEvents').insertMany(allCalendarEvents);
    console.log(`✅ Inserted ${calendarResult.insertedCount} calendar events`);
    
    // Insert email messages
    const allEmailMessages = [...employeeEmailMessages, ...managerEmailMessages];
    const emailResult = await db.collection('emailMessages').insertMany(allEmailMessages);
    console.log(`✅ Inserted ${emailResult.insertedCount} email messages`);
    
    // Insert prediction results
    const allPredictions = [...employeePredictions, ...managerPredictions];
    const predictionResult = await db.collection('predictionResults').insertMany(allPredictions);
    console.log(`✅ Inserted ${predictionResult.insertedCount} prediction results`);
    
    // Generate summary statistics
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
    
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error);
  } finally {
    await client.close();
  }
}

// Run the script
if (require.main === module) {
  generateSyntheticData();
}

module.exports = { generateSyntheticData };
