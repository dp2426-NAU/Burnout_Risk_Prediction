// Script to generate realistic predictions from CSV datasets
// Analyzes CSV patterns and generates predictions for all users

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

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

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  department: String,
  jobTitle: String,
  employeeId: String,
  employeeName: String,
  managerId: mongoose.Schema.Types.ObjectId
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Prediction schema
const predictionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  riskLevel: String,
  riskScore: Number,
  confidence: Number,
  factors: mongoose.Schema.Types.Mixed,
  recommendations: [String],
  modelVersion: String,
  predictionDate: Date,
  isActive: Boolean
}, { collection: 'predictionResults' });

const Prediction = mongoose.model('Prediction', predictionSchema);

/**
 * Load and parse CSV files
 */
function loadCSVData() {
  const baseDir = path.resolve(__dirname, '../..');
  const datasetsDir = path.join(baseDir, 'datasets', 'raw');
  
  const csvFiles = [
    'synthetic_employee_burnout.csv',
    'synthetic_generated_burnout.csv',
    'mental_health_workplace_survey.csv'
  ];
  
  const allRecords = [];
  
  csvFiles.forEach(file => {
    const filePath = path.join(datasetsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Warning: ${file} not found, skipping...`);
      return;
    }
    
    console.log(`📄 Loading ${file}...`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        cast: true
      });
      
      console.log(`   Loaded ${records.length} records`);
      allRecords.push(...records);
    } catch (error) {
      console.error(`   ❌ Error parsing ${file}:`, error.message);
    }
  });
  
  console.log(`✅ Total CSV records loaded: ${allRecords.length}\n`);
  return allRecords;
}

/**
 * Analyze CSV patterns by department and role
 */
function analyzeCSVPatterns(csvRecords) {
  const patterns = {
    byDepartment: {},
    byRole: {},
    overall: {
      workHours: [],
      stressLevels: [],
      burnoutRisks: []
    }
  };
  
  csvRecords.forEach(record => {
    // Extract department (handle different column names across CSV files)
    const dept = (record.Department || record.department || 'Unknown').trim();
    const jobRole = (record.JobRole || record.jobRole || 'Unknown').trim();
    
    // WorkHoursPerWeek - handle different column names
    let workHours = 0;
    const workHoursVal = record.WorkHoursPerWeek || record.WorkHours || record['Work Hours Per Week'] || 0;
    if (workHoursVal !== null && workHoursVal !== undefined && workHoursVal !== '') {
      workHours = parseFloat(workHoursVal);
      if (isNaN(workHours)) workHours = 0;
    }
    
    // StressLevel - handle different column names and scales
    let stressLevel = 0;
    const stressVal = record.StressLevel || record.Stress || record['Stress Level'] || 0;
    if (stressVal !== null && stressVal !== undefined && stressVal !== '') {
      stressLevel = parseFloat(stressVal);
      if (isNaN(stressLevel)) stressLevel = 0;
      // Normalize to 0-10 scale if needed (some CSVs use 0-100)
      if (stressLevel > 10) stressLevel = stressLevel / 10;
    }
    
    // Burnout - handle different formats:
    // CSV1: Burnout (0 or 1) 
    // CSV2: BurnoutLevel (0-10 scale, sometimes higher)
    // CSV3: BurnoutRisk (0 or 1)
    let burnout = 0;
    if (record.Burnout !== undefined && record.Burnout !== null && record.Burnout !== '') {
      const burnVal = parseFloat(record.Burnout);
      if (!isNaN(burnVal)) {
        // If 0 or 1, convert to 0-5 scale; if already scaled, use as is
        burnout = burnVal <= 1 ? burnVal * 5 : (burnVal > 10 ? burnVal / 10 : burnVal);
      }
    } else if (record.BurnoutLevel !== undefined && record.BurnoutLevel !== null && record.BurnoutLevel !== '') {
      const burnVal = parseFloat(record.BurnoutLevel);
      if (!isNaN(burnVal)) {
        burnout = burnVal;
        if (burnout > 10) burnout = burnout / 10; // Normalize if > 10
      }
    } else if (record.BurnoutRisk !== undefined && record.BurnoutRisk !== null && record.BurnoutRisk !== '') {
      const burnVal = parseFloat(record.BurnoutRisk);
      if (!isNaN(burnVal)) {
        // Convert 0/1 to 0-5 scale
        burnout = burnVal <= 1 ? burnVal * 5 : (burnVal > 10 ? burnVal / 10 : burnVal);
      }
    }
    
    // Normalize burnout to 0-10 scale for consistency
    burnout = Math.max(0, Math.min(10, burnout));
    
    // Department patterns
    if (!patterns.byDepartment[dept]) {
      patterns.byDepartment[dept] = {
        workHours: [],
        stressLevels: [],
        burnoutRisks: [],
        count: 0
      };
    }
    
    if (workHours > 0) patterns.byDepartment[dept].workHours.push(workHours);
    if (stressLevel > 0) patterns.byDepartment[dept].stressLevels.push(stressLevel);
    if (burnout > 0) patterns.byDepartment[dept].burnoutRisks.push(burnout);
    patterns.byDepartment[dept].count++;
    
    // Role patterns (Manager vs Employee)
    const isManager = jobRole.toLowerCase().includes('manager') || 
                     jobRole.toLowerCase().includes('director') ||
                     jobRole.toLowerCase().includes('lead');
    const roleKey = isManager ? 'manager' : 'employee';
    
    if (!patterns.byRole[roleKey]) {
      patterns.byRole[roleKey] = {
        workHours: [],
        stressLevels: [],
        burnoutRisks: [],
        count: 0
      };
    }
    
    if (workHours > 0) patterns.byRole[roleKey].workHours.push(workHours);
    if (stressLevel > 0) patterns.byRole[roleKey].stressLevels.push(stressLevel);
    if (burnout > 0) patterns.byRole[roleKey].burnoutRisks.push(burnout);
    patterns.byRole[roleKey].count++;
    
    // Overall patterns
    if (workHours > 0) patterns.overall.workHours.push(workHours);
    if (stressLevel > 0) patterns.overall.stressLevels.push(stressLevel);
    if (burnout > 0) patterns.overall.burnoutRisks.push(burnout);
  });
  
  // Calculate statistics
  function calculateStats(arr) {
    if (arr.length === 0) return { mean: 0, min: 0, max: 0, std: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    const std = Math.sqrt(variance);
    return { mean, min, max, std };
  }
  
  // Calculate stats for each pattern
  Object.keys(patterns.byDepartment).forEach(dept => {
    const deptPattern = patterns.byDepartment[dept];
    deptPattern.workHoursStats = calculateStats(deptPattern.workHours);
    deptPattern.stressLevelStats = calculateStats(deptPattern.stressLevels);
    deptPattern.burnoutRiskStats = calculateStats(deptPattern.burnoutRisks);
  });
  
  Object.keys(patterns.byRole).forEach(role => {
    const rolePattern = patterns.byRole[role];
    rolePattern.workHoursStats = calculateStats(rolePattern.workHours);
    rolePattern.stressLevelStats = calculateStats(rolePattern.stressLevels);
    rolePattern.burnoutRiskStats = calculateStats(rolePattern.burnoutRisks);
  });
  
  patterns.overall.workHoursStats = calculateStats(patterns.overall.workHours);
  patterns.overall.stressLevelStats = calculateStats(patterns.overall.stressLevels);
  patterns.overall.burnoutRiskStats = calculateStats(patterns.overall.burnoutRisks);
  
  return patterns;
}

/**
 * Map department names from USER_CREDENTIALS to CSV departments
 */
function mapDepartment(userDept) {
  const deptMap = {
    'Product': ['Product', 'Product Management', 'Product Development'],
    'Finance': ['Finance', 'Financial', 'Accounting'],
    'Operations': ['Operations', 'Operations Management'],
    'Marketing': ['Marketing', 'Sales', 'Business Development'],
    'Sales': ['Sales', 'Business Development', 'Account Management'],
    'Engineering': ['Engineering', 'IT', 'Software', 'Technology', 'Tech'],
    'HR': ['HR', 'Human Resources', 'People'],
    'IT': ['IT', 'Technology', 'Tech', 'Information Technology']
  };
  
  for (const [key, values] of Object.entries(deptMap)) {
    if (values.some(v => userDept.toLowerCase().includes(v.toLowerCase()))) {
      return key;
    }
  }
  
  return userDept; // Return original if no match
}

/**
 * Generate realistic work patterns from CSV data
 */
function generateWorkPatterns(user, patterns) {
  const userDept = mapDepartment(user.department);
  const userRole = user.role === 'manager' ? 'manager' : 'employee';
  
  // Get department-specific patterns or fallback to role patterns or overall
  let deptPattern = patterns.byDepartment[userDept];
  if (!deptPattern || deptPattern.count === 0) {
    deptPattern = patterns.byRole[userRole];
  }
  if (!deptPattern || deptPattern.count === 0) {
    deptPattern = patterns.overall;
  }
  
  // Generate work hours (normal distribution around mean)
  const workHoursMean = deptPattern.workHoursStats?.mean || 45;
  const workHoursStd = deptPattern.workHoursStats?.std || 10;
  const workHours = Math.max(30, Math.min(70, 
    Math.round(workHoursMean + (Math.random() - 0.5) * 2 * workHoursStd)
  ));
  
  // Generate stress level (0-10 scale)
  const stressMean = deptPattern.stressLevelStats?.mean || 5;
  const stressStd = deptPattern.stressLevelStats?.std || 2;
  const stressLevel = Math.max(1, Math.min(10, 
    Math.round(stressMean + (Math.random() - 0.5) * 2 * stressStd)
  ));
  
  // Generate burnout risk score (0-100) based on CSV patterns
  // Convert CSV burnout (0-10 scale) to risk score (0-100)
  const burnoutMean = deptPattern.burnoutRiskStats?.mean || 5;
  const burnoutStd = deptPattern.burnoutRiskStats?.std || 2;
  
  // Generate burnout value from CSV distribution
  let burnoutValue = burnoutMean + (Math.random() - 0.5) * 2 * burnoutStd;
  burnoutValue = Math.max(0, Math.min(10, burnoutValue));
  
  // Convert burnout (0-10) to risk score (0-100)
  let riskScore = burnoutValue * 10;
  
  // Adjust risk score based on work hours and stress (realistic multipliers)
  if (workHours > 55) riskScore += 8;
  if (workHours > 60) riskScore += 7;
  if (workHours > 65) riskScore += 5;
  
  if (stressLevel > 7) riskScore += 12;
  if (stressLevel > 8) riskScore += 8;
  if (stressLevel > 9) riskScore += 5;
  
  // Managers typically have slightly higher risk due to responsibility
  if (userRole === 'manager') {
    riskScore += 5;
  }
  
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Determine risk level
  let riskLevel;
  if (riskScore < 25) {
    riskLevel = 'low';
  } else if (riskScore < 50) {
    riskLevel = 'medium';
  } else if (riskScore < 75) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  return {
    workHours,
    stressLevel,
    riskScore: Math.round(riskScore),
    riskLevel
  };
}

/**
 * Generate factors based on work patterns
 */
function generateFactors(workPatterns) {
  const factors = {};
  
  if (workPatterns.workHours > 50) {
    factors.workHours = 'excessive';
  } else if (workPatterns.workHours > 40) {
    factors.workHours = 'moderate';
  } else {
    factors.workHours = 'normal';
  }
  
  if (workPatterns.stressLevel > 7) {
    factors.stressLevel = 'high';
  } else if (workPatterns.stressLevel > 5) {
    factors.stressLevel = 'moderate';
  } else {
    factors.stressLevel = 'low';
  }
  
  if (workPatterns.riskScore > 70) {
    factors.workload = 'heavy';
  } else if (workPatterns.riskScore > 40) {
    factors.workload = 'moderate';
  } else {
    factors.workload = 'manageable';
  }
  
  const workLifeBalance = 10 - Math.min(10, Math.round(workPatterns.stressLevel * 0.8));
  if (workLifeBalance < 4) {
    factors.workLifeBalance = 'poor';
  } else if (workLifeBalance < 7) {
    factors.workLifeBalance = 'moderate';
  } else {
    factors.workLifeBalance = 'good';
  }
  
  return factors;
}

/**
 * Generate recommendations based on risk level
 */
function generateRecommendations(riskLevel, factors) {
  const recommendations = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Reduce workload immediately');
    recommendations.push('Take regular breaks throughout the day');
    recommendations.push('Seek support from manager or HR');
    if (factors.workHours === 'excessive') {
      recommendations.push('Consider reducing work hours');
    }
    if (factors.stressLevel === 'high') {
      recommendations.push('Practice stress management techniques');
    }
  } else if (riskLevel === 'medium') {
    recommendations.push('Monitor stress levels closely');
    recommendations.push('Maintain work-life balance');
    recommendations.push('Take breaks when needed');
  } else {
    recommendations.push('Maintain current healthy habits');
    recommendations.push('Continue monitoring stress levels');
  }
  
  return recommendations;
}

/**
 * Main function to generate predictions
 */
async function generatePredictions() {
  try {
    console.log('🚀 Starting realistic prediction generation from CSV data...\n');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Load CSV data
    const csvRecords = loadCSVData();
    
    if (csvRecords.length === 0) {
      console.log('❌ No CSV data loaded. Cannot generate predictions.');
      process.exit(1);
    }
    
    // Analyze patterns
    console.log('📊 Analyzing CSV patterns...');
    const patterns = analyzeCSVPatterns(csvRecords);
    console.log('✅ Pattern analysis complete\n');
    
    // Get all users
    console.log('👥 Loading users from database...');
    const users = await User.find({ isActive: { $ne: false } });
    console.log(`   Found ${users.length} users\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Please import users first.');
      process.exit(1);
    }
    
    // Clear existing predictions
    console.log('🗑️  Clearing existing predictions...');
    await Prediction.deleteMany({});
    console.log('✅ Cleared existing predictions\n');
    
    // Generate predictions for each user
    console.log('🎯 Generating predictions...');
    const predictions = [];
    let generated = 0;
    
    for (const user of users) {
      try {
        // Generate work patterns from CSV data
        const workPatterns = generateWorkPatterns(user, patterns);
        
        // Generate factors
        const factors = generateFactors(workPatterns);
        
        // Generate recommendations
        const recommendations = generateRecommendations(workPatterns.riskLevel, factors);
        
        // Generate confidence (0.7-0.95)
        const confidence = 0.7 + Math.random() * 0.25;
        
        // Create prediction
        const prediction = {
          userId: user._id,
          riskLevel: workPatterns.riskLevel,
          riskScore: workPatterns.riskScore,
          confidence: Math.round(confidence * 100) / 100,
          factors: factors,
          recommendations: recommendations,
          modelVersion: '1.0.0',
          predictionDate: new Date(),
          isActive: true
        };
        
        predictions.push(prediction);
        generated++;
        
        if (generated % 20 === 0) {
          console.log(`   Generated ${generated}/${users.length} predictions...`);
        }
      } catch (error) {
        console.error(`   ❌ Error generating prediction for ${user.email}:`, error.message);
      }
    }
    
    // Insert predictions in batches
    console.log(`\n💾 Inserting ${predictions.length} predictions into database...`);
    const batchSize = 100;
    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      await Prediction.insertMany(batch);
    }
    console.log('✅ All predictions inserted\n');
    
    // Show statistics
    console.log('📊 Prediction Statistics:');
    const riskStats = await Prediction.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    riskStats.forEach(stat => {
      const percentage = ((stat.count / predictions.length) * 100).toFixed(1);
      console.log(`   ${stat._id}: ${stat.count} (${percentage}%)`);
    });
    
    // Show department distribution
    console.log('\n📊 Risk Distribution by Department:');
    const deptRiskStats = await Prediction.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: { dept: '$user.department', risk: '$riskLevel' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.dept': 1, '_id.risk': 1 } }
    ]);
    
    const deptMap = {};
    deptRiskStats.forEach(stat => {
      const dept = stat._id.dept || 'Unknown';
      const risk = stat._id.risk;
      if (!deptMap[dept]) deptMap[dept] = {};
      deptMap[dept][risk] = stat.count;
    });
    
    Object.keys(deptMap).sort().forEach(dept => {
      const risks = deptMap[dept];
      const total = Object.values(risks).reduce((a, b) => a + b, 0);
      console.log(`   ${dept}:`);
      ['low', 'medium', 'high', 'critical'].forEach(risk => {
        const count = risks[risk] || 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        console.log(`      ${risk}: ${count} (${pct}%)`);
      });
    });
    
    console.log('\n✅ Prediction generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  generatePredictions();
}

module.exports = { generatePredictions };

