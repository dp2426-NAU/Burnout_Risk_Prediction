// Production user generation script - Created by Balaji Koneti
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  department: { type: String, required: true },
  position: { type: String, required: true },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Departments and positions
const departments = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 
  'HR', 'Finance', 'Operations', 'Customer Success', 'Data Science'
];

const positions = {
  'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Principal Engineer', 'Engineering Manager'],
  'Product': ['Product Manager', 'Senior Product Manager', 'Product Director', 'VP Product'],
  'Design': ['UX Designer', 'UI Designer', 'Senior Designer', 'Design Manager', 'Creative Director'],
  'Marketing': ['Marketing Specialist', 'Marketing Manager', 'Content Manager', 'Growth Manager', 'Marketing Director'],
  'Sales': ['Sales Representative', 'Senior Sales Rep', 'Sales Manager', 'Account Executive', 'Sales Director'],
  'HR': ['HR Specialist', 'HR Manager', 'Talent Acquisition', 'HR Director'],
  'Finance': ['Financial Analyst', 'Senior Financial Analyst', 'Finance Manager', 'CFO'],
  'Operations': ['Operations Specialist', 'Operations Manager', 'Operations Director', 'COO'],
  'Customer Success': ['Customer Success Manager', 'Senior CSM', 'Customer Success Director'],
  'Data Science': ['Data Analyst', 'Senior Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'Head of Data']
};

// Generate realistic user data
function generateUser(role = 'user', department = null) {
  const selectedDepartment = department || faker.helpers.arrayElement(departments);
  const availablePositions = positions[selectedDepartment];
  const position = faker.helpers.arrayElement(availablePositions);
  
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
  
  return {
    email,
    password: 'password123', // Will be hashed
    firstName,
    lastName,
    role,
    department: selectedDepartment,
    position,
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: 'United States'
    },
    isActive: true,
    createdAt: faker.date.between({ from: '2023-01-01', to: '2024-01-01' }),
    lastLogin: faker.date.recent({ days: 30 })
  };
}

// Generate team assignments for managers
function assignTeamMembers(managers, employees) {
  const teamAssignments = [];
  const employeesPerManager = Math.floor(employees.length / managers.length);
  
  managers.forEach((manager, index) => {
    const startIndex = index * employeesPerManager;
    const endIndex = index === managers.length - 1 ? employees.length : startIndex + employeesPerManager;
    
    for (let i = startIndex; i < endIndex; i++) {
      teamAssignments.push({
        managerId: manager._id,
        employeeId: employees[i]._id,
        department: manager.department
      });
    }
  });
  
  return teamAssignments;
}

// Main generation function
async function generateProductionUsers() {
  try {
    console.log('🚀 Starting production user generation...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing users (except admin)
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('🧹 Cleared existing users');
    
    // Generate 100 employees
    console.log('👥 Generating 100 employees...');
    const employees = [];
    
    for (let i = 0; i < 100; i++) {
      const userData = generateUser('user');
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      employees.push(await user.save());
    }
    
    console.log(`✅ Generated ${employees.length} employees`);
    
    // Generate 20 managers
    console.log('👨‍💼 Generating 20 managers...');
    const managers = [];
    
    for (let i = 0; i < 20; i++) {
      const userData = generateUser('manager');
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      managers.push(await user.save());
    }
    
    console.log(`✅ Generated ${managers.length} managers`);
    
    // Create team assignments
    const teamAssignments = assignTeamMembers(managers, employees);
    
    // Generate login credentials file
    const credentials = {
      employees: employees.map(emp => ({
        email: emp.email,
        password: 'password123',
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        position: emp.position
      })),
      managers: managers.map(mgr => ({
        email: mgr.email,
        password: 'password123',
        name: `${mgr.firstName} ${mgr.lastName}`,
        department: mgr.department,
        position: mgr.position
      })),
      teamAssignments: teamAssignments.map(assignment => ({
        managerEmail: managers.find(m => m._id.equals(assignment.managerId))?.email,
        employeeEmail: employees.find(e => e._id.equals(assignment.employeeId))?.email,
        department: assignment.department
      }))
    };
    
    // Save credentials to file
    const fs = require('fs');
    const path = require('path');
    
    const credentialsPath = path.join(__dirname, '..', 'USER_CREDENTIALS.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    
    console.log('📄 User credentials saved to USER_CREDENTIALS.json');
    
    // Generate summary
    const summary = {
      totalUsers: employees.length + managers.length,
      employees: employees.length,
      managers: managers.length,
      departments: [...new Set([...employees, ...managers].map(u => u.department))],
      teamAssignments: teamAssignments.length,
      generatedAt: new Date().toISOString(),
      author: 'Balaji Koneti'
    };
    
    console.log('\n📊 Generation Summary:');
    console.log(`Total Users: ${summary.totalUsers}`);
    console.log(`Employees: ${summary.employees}`);
    console.log(`Managers: ${summary.managers}`);
    console.log(`Departments: ${summary.departments.join(', ')}`);
    console.log(`Team Assignments: ${summary.teamAssignments}`);
    
    // Generate sample login credentials for testing
    console.log('\n🔑 Sample Login Credentials:');
    console.log('Employees:');
    employees.slice(0, 5).forEach(emp => {
      console.log(`  ${emp.email} / password123 (${emp.firstName} ${emp.lastName})`);
    });
    
    console.log('\nManagers:');
    managers.slice(0, 5).forEach(mgr => {
      console.log(`  ${mgr.email} / password123 (${mgr.firstName} ${mgr.lastName})`);
    });
    
    console.log('\n✅ Production user generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  generateProductionUsers();
}

module.exports = { generateProductionUsers };
