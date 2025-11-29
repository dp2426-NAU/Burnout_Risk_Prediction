// Script to generate new USER_CREDENTIALS.json with 120 users
// Proper hierarchical structure with realistic data

const fs = require('fs');
const path = require('path');

// All 120 names provided by user
const allNames = [
  // Admins (2)
  "Ethan Walker",
  "Olivia Hughes",
  
  // Managers (7)
  "Mason Carter",      // Product Manager
  "Ava Mitchell",      // Finance Manager
  "Noah Phillips",    // Operations Manager
  "Emma Brooks",      // Marketing Manager
  "Liam Parker",      // Sales Manager
  "Sophia Bennett",   // Engineering Manager
  "Benjamin Reed",    // HR Manager
  
  // Employees (111)
  "Mia Foster",
  "Elijah Turner",
  "Isabella Cooper",
  "James Peterson",
  "Harper Collins",
  "Lucas Rivera",
  "Charlotte Hayes",
  "Henry Murphy",
  "Amelia Rogers",
  "Alexander Gray",
  "Evelyn Ward",
  "Aarav Mehta",
  "Ananya Rao",
  "Rohan Patel",
  "Diya Sharma",
  "Arjun Nair",
  "Priya Iyer",
  "Karan Singh",
  "Kavya Reddy",
  "Aditya Joshi",
  "Sneha Pillai",
  "Ishaan Desai",
  "Neha Ghosh",
  "Raj Malhotra",
  "Aditi Chawla",
  "Manish Kapoor",
  "Tanvi Menon",
  "Sandeep Bhatia",
  "Pooja Krishnan",
  "Nikhil Verma",
  "Meera Das",
  "Luca Rossi",
  "Sofia Novak",
  "Adrian Müller",
  "Clara Schmidt",
  "Mateo García",
  "Elena López",
  "Julian Moreau",
  "Camille Dubois",
  "Niklas Johansson",
  "Freja Andersson",
  "Tomas Nowak",
  "Emilia Kowalska",
  "Marco Bianchi",
  "Giulia Conti",
  "Stefan Petrov",
  "Anya Ivanova",
  "Darius Popescu",
  "Alina Dumitrescu",
  "Erik Hansen",
  "Astrid Nielsen",
  "Kofi Mensah",
  "Ama Boateng",
  "Chinedu Okafor",
  "Ifeoma Nwosu",
  "Tunde Adebayo",
  "Zainab Bello",
  "Daniel Mwangi",
  "Aisha Kamau",
  "Samuel Banda",
  "Thandiwe Ndlovu",
  "Kwame Owusu",
  "Lindiwe Moyo",
  "Josephine Chika",
  "Adewale Ogunleye",
  "Nia Zulu",
  "Hassan Abebe",
  "Selam Tesfaye",
  "Blessing Omondi",
  "Peter Dlamini",
  "Grace Mthembu",
  "Hiroshi Tanaka",
  "Yuki Sato",
  "Minho Park",
  "Jiwoo Kim",
  "Chen Wei",
  "Li Na",
  "Nguyen Minh",
  "Tran Thi",
  "Aung Kyaw",
  "Thiri Hlaing",
  "Rizwan Khan",
  "Fatima Siddiqui",
  "Ahmed Al-Farsi",
  "Layla Hussain",
  "Omar Rahman",
  "Nabila Chowdhury",
  "Rajesh Karki",
  "Sita Gurung",
  "Javed Malik",
  "Hina Qureshi",
  "Diego Fernandez",
  "Valentina Morales",
  "Juan Perez",
  "Camila Torres",
  "Rodrigo Alvarez",
  "Lucia Romero",
  "Andres Silva",
  "Martina Delgado",
  "Pablo Herrera",
  "Sofia Cabrera",
  "Leonardo Vargas",
  "Beatriz Costa",
  "Rafael Sousa",
  "Gabriela Lima",
  "Esteban Cruz",
  "Mariana Ortiz",
  "Felipe Navarro",
  "Natalia Jimenez",
  "Carlos Vega",
  "Isabella Ramos"
];

// Department distribution
// Total: 2 admins + 7 managers + 111 employees = 120 users
const departmentDistribution = {
  Product: { manager: 1, employees: 16 },
  Finance: { manager: 1, employees: 12 },
  Operations: { manager: 1, employees: 16 },
  Marketing: { manager: 1, employees: 26 },
  Sales: { manager: 1, employees: 18 },
  Engineering: { manager: 1, employees: 8 },
  HR: { manager: 1, employees: 15 }, // Increased from 8 to 15 to reach 111 total (16+12+16+26+18+8+15=111)
  IT: { admins: 2, employees: 0 }
};

// Job titles by department
const jobTitlesByDept = {
  Product: {
    manager: "Product Manager",
    employees: ["Product Analyst", "Product Owner", "UX Designer", "Product Designer", "Product Researcher", "Product Strategist"]
  },
  Finance: {
    manager: "Finance Manager",
    employees: ["Financial Analyst", "Accountant", "Budget Analyst", "Financial Planner", "Accounts Payable Specialist", "Accounts Receivable Specialist"]
  },
  Operations: {
    manager: "Operations Manager",
    employees: ["Operations Analyst", "Operations Coordinator", "Supply Chain Specialist", "Process Analyst", "Operations Specialist", "Logistics Coordinator"]
  },
  Marketing: {
    manager: "Marketing Manager",
    employees: ["Marketing Specialist", "Content Creator", "Digital Marketing Specialist", "Brand Manager", "Marketing Analyst", "Social Media Manager", "SEO Specialist", "Marketing Coordinator"]
  },
  Sales: {
    manager: "Sales Manager",
    employees: ["Sales Representative", "Account Executive", "Sales Development Representative", "Inside Sales Specialist", "Sales Analyst", "Customer Success Manager"]
  },
  Engineering: {
    manager: "Engineering Manager",
    employees: ["Software Engineer", "Backend Developer", "Frontend Developer", "DevOps Engineer", "QA Engineer", "Technical Lead"]
  },
  HR: {
    manager: "HR Manager",
    employees: ["HR Specialist", "Recruiter", "Talent Acquisition Specialist", "HR Coordinator", "Benefits Administrator", "HR Generalist"]
  },
  IT: {
    admins: ["System Administrator", "IT Administrator"],
    employees: []
  }
};

// Helper function to parse name and remove country indicators
function parseName(fullName) {
  // Remove country indicators like "(Japan)", "(Italy)", etc.
  const cleaned = fullName.replace(/\s*\([^)]+\)\s*$/, '').trim();
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  const lastName = parts.pop();
  const firstName = parts.join(' ');
  
  return { firstName, lastName };
}

// Helper function to generate email
function generateEmail(firstName, lastName) {
  const first = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${first}.${last}@company.com`;
}

// Helper function to determine gender from name patterns
function determineGender(firstName) {
  const femaleNames = ['Olivia', 'Ava', 'Emma', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 
    'Ananya', 'Diya', 'Priya', 'Kavya', 'Sneha', 'Neha', 'Aditi', 'Tanvi', 'Pooja', 'Meera',
    'Sofia', 'Clara', 'Elena', 'Camille', 'Freja', 'Emilia', 'Giulia', 'Anya', 'Alina', 'Astrid',
    'Ama', 'Ifeoma', 'Zainab', 'Aisha', 'Thandiwe', 'Lindiwe', 'Josephine', 'Nia', 'Selam', 'Grace',
    'Yuki', 'Li', 'Tran', 'Thiri', 'Fatima', 'Layla', 'Nabila', 'Sita', 'Hina',
    'Valentina', 'Camila', 'Lucia', 'Martina', 'Sofia', 'Beatriz', 'Gabriela', 'Mariana', 'Natalia', 'Isabella'];
  
  const name = firstName.split(' ')[0];
  if (femaleNames.includes(name)) {
    return 'Female';
  }
  
  // Default to Male for most names, but could be enhanced
  return Math.random() > 0.5 ? 'Male' : 'Female';
}

// Helper function to generate date of birth (age between 22-65)
function generateDateOfBirth(age) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-end issues
  return `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper function to generate age (22-65)
function generateAge(role) {
  if (role === 'admin') {
    return Math.floor(Math.random() * 15) + 35; // 35-50 for admins
  } else if (role === 'manager') {
    return Math.floor(Math.random() * 20) + 30; // 30-50 for managers
  } else {
    return Math.floor(Math.random() * 20) + 22; // 22-42 for employees
  }
}

// Generate users
function generateUsers() {
  const users = {
    admins: [],
    managers: [],
    employees: []
  };
  
  let nameIndex = 0;
  let empIdCounter = 1024;
  let mgrIdCounter = 2001;
  let adminIdCounter = 1;
  
  // Generate Admins (2)
  const adminDepts = ['IT', 'IT'];
  adminDepts.forEach((dept, idx) => {
    const fullName = allNames[nameIndex++];
    const { firstName, lastName } = parseName(fullName);
    const age = generateAge('admin');
    const gender = determineGender(firstName);
    
    users.admins.push({
      id: `ADMIN${String(adminIdCounter++).padStart(3, '0')}`,
      name: fullName,
      email: generateEmail(firstName, lastName),
      password: "admin123",
      gender: gender,
      dateOfBirth: generateDateOfBirth(age),
      age: age,
      department: dept,
      position: jobTitlesByDept[dept].admins[idx],
      role: "admin",
      reportsTo: null,
      teamMembers: [],
      jobRole: jobTitlesByDept[dept].admins[idx],
      originalPosition: jobTitlesByDept[dept].admins[idx]
    });
  });
  
  // Generate Managers (7)
  const managerDepts = ['Product', 'Finance', 'Operations', 'Marketing', 'Sales', 'Engineering', 'HR'];
  const managerIds = {};
  
  managerDepts.forEach((dept) => {
    const fullName = allNames[nameIndex++];
    const { firstName, lastName } = parseName(fullName);
    const age = generateAge('manager');
    const gender = determineGender(firstName);
    const managerId = `MGR${String(mgrIdCounter++).padStart(4, '0')}`;
    managerIds[dept] = managerId;
    
    users.managers.push({
      id: managerId,
      name: fullName,
      email: generateEmail(firstName, lastName),
      password: "password123",
      gender: gender,
      dateOfBirth: generateDateOfBirth(age),
      age: age,
      department: dept,
      position: jobTitlesByDept[dept].manager,
      role: "manager",
      reportsTo: "ADMIN001",
      teamMembers: [], // Will be populated after employees are created
      jobRole: jobTitlesByDept[dept].manager,
      originalPosition: jobTitlesByDept[dept].manager
    });
  });
  
  // Generate Employees (111)
  const departments = ['Product', 'Finance', 'Operations', 'Marketing', 'Sales', 'Engineering', 'HR'];
  
  departments.forEach((dept) => {
    const employeeCount = departmentDistribution[dept].employees;
    const managerId = managerIds[dept];
    const jobTitles = jobTitlesByDept[dept].employees;
    
    for (let i = 0; i < employeeCount; i++) {
      const fullName = allNames[nameIndex++];
      const { firstName, lastName } = parseName(fullName);
      const age = generateAge('employee');
      const gender = determineGender(firstName);
      const jobTitle = jobTitles[i % jobTitles.length];
      
      const employeeId = `EMP${String(empIdCounter++).padStart(4, '0')}`;
      
      users.employees.push({
        id: employeeId,
        name: fullName,
        email: generateEmail(firstName, lastName),
        password: "password123",
        gender: gender,
        dateOfBirth: generateDateOfBirth(age),
        age: age,
        department: dept,
        position: jobTitle,
        role: "employee",
        reportsTo: managerId,
        teamMembers: [],
        jobRole: jobTitle,
        originalPosition: jobTitle
      });
      
      // Add employee ID to manager's teamMembers array
      const manager = users.managers.find(m => m.id === managerId);
      if (manager) {
        manager.teamMembers.push(employeeId);
      }
    }
  });
  
  // Add manager IDs to admin's teamMembers
  users.admins[0].teamMembers = users.managers.map(m => m.id);
  
  return users;
}

// Main execution
function main() {
  console.log('🚀 Generating new USER_CREDENTIALS.json structure...');
  
  const users = generateUsers();
  
  // Create summary
  const summary = {
    totalUsers: users.admins.length + users.managers.length + users.employees.length,
    admins: users.admins.length,
    managers: users.managers.length,
    employees: users.employees.length,
    updatedAt: new Date().toISOString()
  };
  
  const output = {
    ...users,
    summary
  };
  
  // Write to file
  const outputPath = path.join(__dirname, '..', 'USER_CREDENTIALS.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log('✅ Generated USER_CREDENTIALS.json');
  console.log(`   Admins: ${summary.admins}`);
  console.log(`   Managers: ${summary.managers}`);
  console.log(`   Employees: ${summary.employees}`);
  console.log(`   Total: ${summary.totalUsers}`);
  
  // Validate
  console.log('\n📊 Department Distribution:');
  const deptCounts = {};
  [...users.admins, ...users.managers, ...users.employees].forEach(user => {
    deptCounts[user.department] = (deptCounts[user.department] || 0) + 1;
  });
  Object.entries(deptCounts).forEach(([dept, count]) => {
    console.log(`   ${dept}: ${count}`);
  });
  
  // Validate relationships
  console.log('\n🔗 Validating Relationships:');
  let validRelationships = true;
  
  // Check all employees have reportsTo
  users.employees.forEach(emp => {
    if (!emp.reportsTo) {
      console.log(`   ❌ Employee ${emp.id} missing reportsTo`);
      validRelationships = false;
    }
  });
  
  // Check all managers have teamMembers
  users.managers.forEach(mgr => {
    if (!mgr.teamMembers || mgr.teamMembers.length === 0) {
      console.log(`   ❌ Manager ${mgr.id} has no teamMembers`);
      validRelationships = false;
    }
  });
  
  if (validRelationships) {
    console.log('   ✅ All relationships valid');
  }
  
  console.log('\n✅ Generation complete!');
}

if (require.main === module) {
  main();
}

module.exports = { generateUsers };

