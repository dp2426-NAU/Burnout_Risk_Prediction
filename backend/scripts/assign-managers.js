// Script to assign managers to employees based on department
// Employees are assigned to managers in the same department
require('dotenv').config();
const mongoose = require('mongoose');

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
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  employeeId: { type: String },
  employeeName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Main function to assign managers
 */
async function assignManagers() {
  try {
    console.log('🚀 Starting manager assignment...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all managers (excluding admins)
    const managers = await User.find({ role: 'manager', isActive: true }).sort({ createdAt: 1 });
    console.log(`   Found ${managers.length} managers`);
    
    // Get all employees (users with role 'user')
    const employees = await User.find({ role: 'user', isActive: true }).sort({ createdAt: 1 });
    console.log(`   Found ${employees.length} employees`);
    
    if (managers.length === 0) {
      console.log('⚠️  No managers found. Cannot assign managers.');
      process.exit(0);
    }
    
    if (employees.length === 0) {
      console.log('⚠️  No employees found. Nothing to assign.');
      process.exit(0);
    }
    
    // Group managers by department
    const managersByDept = {};
    managers.forEach(manager => {
      const dept = manager.department || 'Unknown';
      if (!managersByDept[dept]) {
        managersByDept[dept] = [];
      }
      managersByDept[dept].push(manager);
    });
    
    console.log('\n📊 Managers by department:');
    Object.entries(managersByDept).forEach(([dept, mgrs]) => {
      console.log(`   ${dept}: ${mgrs.length} manager(s)`);
    });
    
    // Assign employees to managers in the same department
    let assigned = 0;
    let unassigned = 0;
    
    console.log('\n👥 Assigning employees to managers...');
    
    for (const employee of employees) {
      const dept = employee.department || 'Unknown';
      const deptManagers = managersByDept[dept] || managersByDept['Unknown'] || [];
      
      if (deptManagers.length === 0) {
        // If no manager in same department, assign to any manager (round-robin)
        const managerIndex = unassigned % managers.length;
        employee.managerId = managers[managerIndex]._id;
        unassigned++;
      } else {
        // Assign to a manager in the same department (round-robin)
        const managerIndex = assigned % deptManagers.length;
        employee.managerId = deptManagers[managerIndex]._id;
        assigned++;
      }
      
      await employee.save();
      const manager = await User.findById(employee.managerId);
      console.log(`   ✅ ${employee.email} → ${manager?.email} (${dept})`);
    }
    
    console.log(`\n✅ Assignment completed!`);
    console.log(`   Assigned to department managers: ${assigned}`);
    console.log(`   Assigned to other managers: ${unassigned}`);
    
    // Show summary by department
    console.log(`\n📊 Assignment Summary by Department:`);
    const departments = await User.distinct('department');
    for (const dept of departments) {
      if (!dept) continue;
      const deptEmployees = await User.countDocuments({ department: dept, role: 'user' });
      const deptManagers = await User.countDocuments({ department: dept, role: 'manager' });
      console.log(`   ${dept}: ${deptEmployees} employees, ${deptManagers} managers`);
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
assignManagers();

