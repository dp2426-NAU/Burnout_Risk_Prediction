# User Data Setup Scripts

This directory contains scripts to set up and manage user data with realistic organizational hierarchy and burnout risk predictions.

## Overview

The system now supports 120 users with proper hierarchical relationships:
- **2 Admins** (IT department)
- **7 Managers** (one per department: Product, Finance, Operations, Marketing, Sales, Engineering, HR)
- **111 Employees** (distributed across departments)

## Scripts

### 1. `generate-new-user-credentials.js`
Generates a new `USER_CREDENTIALS.json` file with 120 users, proper relationships, and all required fields.

**Usage:**
```bash
node backend/scripts/generate-new-user-credentials.js
```

**What it does:**
- Creates 120 users with provided names
- Assigns proper roles (admin, manager, employee)
- Sets up hierarchical relationships (reportsTo, teamMembers)
- Generates realistic demographics (age, gender, dateOfBirth)
- Creates proper email addresses (firstname.lastname@company.com)

### 2. `validate-user-credentials.js`
Validates the structure of `USER_CREDENTIALS.json` to ensure:
- Correct user counts (2 admins, 7 managers, 111 employees)
- Unique emails
- Proper manager-employee relationships
- All required fields present

**Usage:**
```bash
node backend/scripts/validate-user-credentials.js
```

### 3. `import-users-from-credentials.js`
Imports users from `USER_CREDENTIALS.json` into MongoDB with:
- Hashed passwords
- Proper managerId relationships (maps reportsTo to MongoDB ObjectIds)
- All user fields including gender, dateOfBirth, age

**Usage:**
```bash
node backend/scripts/import-users-from-credentials.js
```

**Note:** This script handles the two-step process:
1. First imports all users
2. Then sets up managerId relationships

### 4. `generate-realistic-predictions-from-csv.js`
Generates realistic burnout risk predictions for all users based on patterns from CSV datasets:
- `datasets/raw/synthetic_employee_burnout.csv`
- `datasets/raw/synthetic_generated_burnout.csv`
- `datasets/raw/mental_health_workplace_survey.csv`

**Usage:**
```bash
node backend/scripts/generate-realistic-predictions-from-csv.js
```

**What it does:**
- Analyzes CSV data patterns by department and role
- Matches users to similar CSV records
- Generates realistic work patterns (hours, stress levels)
- Calculates risk scores based on CSV burnout patterns
- Creates predictions with factors and recommendations

### 5. `setup-complete-user-data.js` (Master Script)
Runs all setup steps in sequence:
1. Generates USER_CREDENTIALS.json
2. Imports users to MongoDB
3. Generates predictions from CSV data

**Usage:**
```bash
node backend/scripts/setup-complete-user-data.js
```

## Complete Setup Process

To set up everything from scratch:

```bash
# Option 1: Run master script (recommended)
node backend/scripts/setup-complete-user-data.js

# Option 2: Run steps individually
node backend/scripts/generate-new-user-credentials.js
node backend/scripts/validate-user-credentials.js
node backend/scripts/import-users-from-credentials.js
node backend/scripts/generate-realistic-predictions-from-csv.js
```

## Data Structure

### USER_CREDENTIALS.json Structure

```json
{
  "admins": [
    {
      "id": "ADMIN001",
      "name": "Ethan Walker",
      "email": "ethan.walker@company.com",
      "password": "admin123",
      "gender": "Male",
      "dateOfBirth": "1980-01-15",
      "age": 45,
      "department": "IT",
      "position": "System Administrator",
      "role": "admin",
      "reportsTo": null,
      "teamMembers": ["MGR2001", "MGR2002", ...],
      "jobRole": "System Administrator",
      "originalPosition": "System Administrator"
    }
  ],
  "managers": [...],
  "employees": [...],
  "summary": {
    "totalUsers": 120,
    "admins": 2,
    "managers": 7,
    "employees": 111
  }
}
```

### Department Distribution

- **Product**: 17 total (1 manager + 16 employees)
- **Finance**: 13 total (1 manager + 12 employees)
- **Operations**: 17 total (1 manager + 16 employees)
- **Marketing**: 27 total (1 manager + 26 employees)
- **Sales**: 19 total (1 manager + 18 employees)
- **Engineering**: 9 total (1 manager + 8 employees)
- **HR**: 16 total (1 manager + 15 employees)
- **IT**: 2 total (2 admins)

## Relationship Model

- **Employees** → report to their department **Manager** (reportsTo field)
- **Managers** → report to **Admin** (ADMIN001)
- **Admins** → report to no one (reportsTo: null)
- Each **Manager** has a `teamMembers` array with all employee IDs in their department

## Access Control

- **Employees**: Can view only their own burnout data
- **Managers**: Can view their own data + all employees in their department
- **Admins**: Can view all data across the organization

## Notes

- All predictions are generated from actual CSV dataset patterns
- Risk scores are calculated based on work hours, stress levels, and CSV burnout patterns
- Department-specific patterns are preserved in predictions
- Manager predictions typically show slightly higher risk due to responsibility





