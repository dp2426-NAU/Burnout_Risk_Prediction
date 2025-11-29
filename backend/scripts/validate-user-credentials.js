// Script to validate USER_CREDENTIALS.json structure
// Checks for proper relationships, unique emails, correct counts, etc.

const fs = require('fs');
const path = require('path');

function validateCredentials() {
  console.log('🔍 Validating USER_CREDENTIALS.json structure...\n');
  
  const credentialsPath = path.join(__dirname, '..', 'USER_CREDENTIALS.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ USER_CREDENTIALS.json not found!');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const admins = data.admins || [];
  const managers = data.managers || [];
  const employees = data.employees || [];
  const summary = data.summary || {};
  
  let errors = [];
  let warnings = [];
  
  // Check total count
  const totalUsers = admins.length + managers.length + employees.length;
  if (totalUsers !== 120) {
    errors.push(`Expected 120 users, found ${totalUsers}`);
  }
  
  if (admins.length !== 2) {
    errors.push(`Expected 2 admins, found ${admins.length}`);
  }
  
  if (managers.length !== 7) {
    errors.push(`Expected 7 managers, found ${managers.length}`);
  }
  
  if (employees.length !== 111) {
    errors.push(`Expected 111 employees, found ${employees.length}`);
  }
  
  // Check for unique emails
  const allUsers = [...admins, ...managers, ...employees];
  const emails = allUsers.map(u => u.email);
  const uniqueEmails = new Set(emails);
  if (emails.length !== uniqueEmails.size) {
    errors.push(`Duplicate emails found: ${emails.length - uniqueEmails.size} duplicates`);
  }
  
  // Check for required fields
  allUsers.forEach((user, index) => {
    if (!user.id) errors.push(`User at index ${index} missing 'id' field`);
    if (!user.name) errors.push(`User ${user.id || index} missing 'name' field`);
    if (!user.email) errors.push(`User ${user.id || index} missing 'email' field`);
    if (!user.password) errors.push(`User ${user.id || index} missing 'password' field`);
    if (!user.department) warnings.push(`User ${user.id || index} missing 'department' field`);
    if (!user.role) errors.push(`User ${user.id || index} missing 'role' field`);
    if (!user.position) warnings.push(`User ${user.id || index} missing 'position' field`);
  });
  
  // Check manager-employee relationships
  const idMap = {};
  allUsers.forEach(user => {
    idMap[user.id] = user;
  });
  
  // Check all employees have reportsTo pointing to a manager
  employees.forEach(emp => {
    if (!emp.reportsTo) {
      errors.push(`Employee ${emp.id} (${emp.email}) missing 'reportsTo' field`);
    } else if (!idMap[emp.reportsTo]) {
      errors.push(`Employee ${emp.id} reportsTo '${emp.reportsTo}' not found`);
    } else if (idMap[emp.reportsTo].role !== 'manager') {
      errors.push(`Employee ${emp.id} reportsTo '${emp.reportsTo}' is not a manager`);
    }
  });
  
  // Check all managers have teamMembers arrays
  managers.forEach(mgr => {
    if (!mgr.teamMembers || !Array.isArray(mgr.teamMembers)) {
      errors.push(`Manager ${mgr.id} missing or invalid 'teamMembers' array`);
    } else {
      mgr.teamMembers.forEach(empId => {
        if (!idMap[empId]) {
          errors.push(`Manager ${mgr.id} has teamMember '${empId}' that doesn't exist`);
        } else if (idMap[empId].role !== 'employee') {
          errors.push(`Manager ${mgr.id} has teamMember '${empId}' that is not an employee`);
        } else if (idMap[empId].reportsTo !== mgr.id) {
          errors.push(`Manager ${mgr.id} has teamMember '${empId}' but employee reportsTo '${idMap[empId].reportsTo}'`);
        }
      });
    }
  });
  
  // Check admins
  admins.forEach(admin => {
    if (admin.reportsTo !== null) {
      warnings.push(`Admin ${admin.id} has reportsTo set (should be null)`);
    }
  });
  
  // Check managers report to admin
  managers.forEach(mgr => {
    if (!mgr.reportsTo) {
      warnings.push(`Manager ${mgr.id} missing reportsTo (should report to admin)`);
    } else if (idMap[mgr.reportsTo] && idMap[mgr.reportsTo].role !== 'admin') {
      errors.push(`Manager ${mgr.id} reportsTo '${mgr.reportsTo}' is not an admin`);
    }
  });
  
  // Check department distribution
  const deptCounts = {};
  allUsers.forEach(user => {
    const dept = user.department || 'Unknown';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  
  console.log('📊 Department Distribution:');
  Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
    console.log(`   ${dept}: ${count}`);
  });
  
  // Report results
  console.log('\n📋 Validation Results:');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('   ✅ All validations passed!');
  } else {
    if (errors.length > 0) {
      console.log(`\n   ❌ Errors (${errors.length}):`);
      errors.forEach(err => console.log(`      - ${err}`));
    }
    if (warnings.length > 0) {
      console.log(`\n   ⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(warn => console.log(`      - ${warn}`));
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   Admins: ${admins.length}`);
  console.log(`   Managers: ${managers.length}`);
  console.log(`   Employees: ${employees.length}`);
  console.log(`   Unique Emails: ${uniqueEmails.size}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Validation failed! Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed!');
  }
}

if (require.main === module) {
  validateCredentials();
}

module.exports = { validateCredentials };





