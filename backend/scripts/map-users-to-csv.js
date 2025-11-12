// Script to map users to CSV employee data
// This ensures each user gets unique employee data from CSV files
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Database connection
// Note: For MongoDB Atlas, ensure your connection string includes the database name:
// mongodb+srv://user:pass@cluster.mongodb.net/burnout-risk-prediction
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

// Ensure database name is set for MongoDB Atlas connections
if (MONGODB_URI.includes('mongodb+srv://')) {
  // MongoDB Atlas format: mongodb+srv://user:pass@cluster.net/?params
  // We need to insert database name between .net/ and ?params
  const clusterMatch = MONGODB_URI.match(/mongodb\+srv:\/\/[^@]+@([^\/\?]+)/);
  
  if (clusterMatch) {
    const clusterHost = clusterMatch[1];
    // Check if there's already a database name (path between cluster and ?)
    const afterCluster = MONGODB_URI.split(clusterHost)[1];
    
    if (!afterCluster || afterCluster.startsWith('/?') || afterCluster === '/') {
      // No database name, add it
      MONGODB_URI = MONGODB_URI.replace(clusterHost + '/', clusterHost + '/burnout-risk-prediction');
      MONGODB_URI = MONGODB_URI.replace(clusterHost + '?', clusterHost + '/burnout-risk-prediction?');
    } else if (afterCluster.startsWith('/') && !afterCluster.startsWith('/burnout-risk-prediction')) {
      // Has a different database name, replace it
      const pathAndQuery = afterCluster.split('?');
      MONGODB_URI = MONGODB_URI.replace(clusterHost + pathAndQuery[0], clusterHost + '/burnout-risk-prediction');
    }
  }
}

console.log(`📊 Connecting to MongoDB...`);

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
  employeeId: { type: String },
  employeeName: { type: String },
  department: { type: String },
  jobTitle: { type: String },
  isActive: { type: Boolean, default: true }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

/**
 * Normalize ID for consistent matching
 */
function normalizeId(id) {
  if (!id) return '';
  return id.toString().trim().toLowerCase();
}

/**
 * Normalize name for consistent matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name.toString().trim().toLowerCase();
}

/**
 * Load CSV file and parse it
 */
function loadCSVFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`CSV file not found: ${filePath}`);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Loaded ${records.length} records from ${path.basename(filePath)}`);
    return records;
  } catch (error) {
    console.error(`Error loading CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Load all CSV files and merge employee data
 */
function loadAllCSVData() {
  const employeeMap = new Map();
  
  // Get the base directory
  let baseDir = process.cwd();
  const testPath = path.join(baseDir, 'datasets', 'raw');
  if (!fs.existsSync(testPath)) {
    baseDir = path.resolve(__dirname, '../..');
  }
  
  const datasetsDir = path.join(baseDir, 'datasets', 'raw');

  // Load all three CSV files
  const csvFiles = [
    'synthetic_employee_burnout.csv',
    'mental_health_workplace_survey.csv',
    'synthetic_generated_burnout.csv'
  ];

  for (const csvFile of csvFiles) {
    const filePath = path.join(datasetsDir, csvFile);
    const records = loadCSVFile(filePath);

    for (const record of records) {
      // Try to get employee ID (different column names in different CSVs)
      const employeeId = record.EmployeeID || record.employeeId || record.id;
      const name = record.Name || record.name;

      // Use ID as primary key, fallback to name
      const key = employeeId ? normalizeId(employeeId) : normalizeName(name);
      
      if (!key) continue; // Skip records without ID or name

      // Get existing employee data or create new
      let employee = employeeMap.get(key) || {};

      // Merge data from this CSV
      employee = {
        ...employee,
        employeeId: employeeId || employee.employeeId,
        name: name || employee.name,
        age: record.Age || record.age || employee.age,
        gender: record.Gender || record.gender || employee.gender,
        jobRole: record.JobRole || record.jobRole || employee.jobRole,
        department: record.Department || record.department || employee.department
      };

      employeeMap.set(key, employee);
    }
  }

  console.log(`Merged CSV data: ${employeeMap.size} unique employees`);
  return Array.from(employeeMap.values());
}

/**
 * Main function to map users to CSV employees
 */
async function mapUsersToCSV() {
  try {
    console.log('🚀 Starting user to CSV mapping...');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load all CSV employees
    console.log('📊 Loading CSV employee data...');
    const csvEmployees = loadAllCSVData();
    
    if (csvEmployees.length === 0) {
      console.error('❌ No CSV employees found!');
      process.exit(1);
    }
    
    // Get all users (excluding admin)
    console.log('👥 Fetching users from database...');
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: 1 });
    console.log(`Found ${users.length} users to map`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      process.exit(0);
    }
    
    // Map each user to a CSV employee (round-robin if more users than employees)
    let csvIndex = 0;
    let mappedCount = 0;
    let skippedCount = 0;
    
    console.log('\n📝 Mapping users to CSV employees...');
    
    for (const user of users) {
      // Get next CSV employee (round-robin)
      const csvEmployee = csvEmployees[csvIndex % csvEmployees.length];
      csvIndex++;
      
      // Update user with CSV employee data
      const updateData = {};
      
      if (csvEmployee.employeeId) {
        updateData.employeeId = csvEmployee.employeeId.toString();
      }
      
      if (csvEmployee.name) {
        updateData.employeeName = csvEmployee.name;
      }
      
      // Optionally update department and jobTitle if they're missing
      if (!user.department && csvEmployee.department) {
        updateData.department = csvEmployee.department;
      }
      
      if (!user.jobTitle && csvEmployee.jobRole) {
        updateData.jobTitle = csvEmployee.jobRole;
      }
      
      // Update user
      await User.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      
      console.log(`  ✓ ${user.email} → ${csvEmployee.name || csvEmployee.employeeId || 'Unknown'} (ID: ${csvEmployee.employeeId || 'N/A'})`);
      mappedCount++;
    }
    
    console.log(`\n✅ Mapping completed!`);
    console.log(`   Mapped: ${mappedCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    
    // Show sample mappings
    console.log('\n📋 Sample mappings:');
    const sampleUsers = await User.find({ role: { $ne: 'admin' } })
      .select('email firstName lastName employeeId employeeName')
      .limit(5);
    
    for (const user of sampleUsers) {
      console.log(`   ${user.email}:`);
      console.log(`     Name: ${user.firstName} ${user.lastName}`);
      console.log(`     Employee ID: ${user.employeeId || 'N/A'}`);
      console.log(`     Employee Name: ${user.employeeName || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error mapping users to CSV:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  mapUsersToCSV();
}

module.exports = { mapUsersToCSV };

