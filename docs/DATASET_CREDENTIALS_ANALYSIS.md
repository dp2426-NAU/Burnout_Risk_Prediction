# Dataset and User Credentials Analysis Summary

## Overview

This document answers questions about employees, managers, login credentials, and dataset usage.

## Dataset Summary

### Total People in Databases

**Total: ~6,000 rows** across 3 datasets:

1. **mental_health_workplace_survey.csv**: 3,000 rows
   - Has EmployeeID column
   - Estimated: 734 Managers, 2,266 Employees
   - Job Roles: Data Scientist, Software Engineer, Customer Support, Marketing Manager, Project Manager, HR Specialist, IT Admin, Sales Associate
   - Departments: HR, Sales, Marketing, Engineering, IT, Support

2. **synthetic_employee_burnout.csv**: 2,000 rows
   - Has Name column (no EmployeeID)
   - Estimated: 419 Managers, 1,581 Employees
   - Job Roles: Manager, Analyst, Sales, HR, Engineer

3. **synthetic_generated_burnout.csv**: 1,000 rows
   - Has EmployeeID column
   - Estimated: 375 Managers, 625 Employees
   - Job Roles: Product Manager, Sales Executive, Software Engineer, Data Scientist, Operations Lead, Customer Success, HR Specialist, Marketing Manager
   - Departments: Operations, Engineering, HR, Finance, Marketing, Sales, Customer Support, Product

### How to Determine Employee vs Manager

**Managers** are identified by JobRole containing:
- Manager
- Director
- Lead
- Head
- VP (Vice President)
- CFO, COO, CEO
- President

**Employees** are all other roles.

## USER_CREDENTIALS.json Analysis

### Current State

- **Total Users**: 100
- **Managers**: 70
- **Employees**: 30
- **All Passwords**: `password123`
- **Email Format**: `[name]@company.com`

### Issues Identified

1. **Position Mismatch**: 
   - USER_CREDENTIALS.json has 39 unique positions
   - Datasets have 17 unique JobRoles
   - Only 2 positions overlap between them

2. **Department Mismatch**:
   - Credentials: Customer Success, Data Science, Design (not in datasets)
   - Datasets: Customer Support, IT, Support (not in credentials)
   - Some departments exist in both but naming differs

3. **Role Assignment**:
   - Current credentials don't align with dataset JobRole values
   - Need to map positions to actual dataset roles

## Login Credentials

### Sample Credentials

```
Email: johann.stracke@company.com
Password: password123
Role: Manager
Position: Creative Director
Department: Design

Email: allison.beatty@company.com
Password: password123
Role: Manager
Position: Finance Manager
Department: Finance

Email: lee.stoltenberg@company.com
Password: password123
Role: Employee
Position: Talent Acquisition
Department: HR
```

### How to Access Login Details

1. **From USER_CREDENTIALS.json**: 
   - File location: `backend/USER_CREDENTIALS.json`
   - Contains all 100 users with email/password
   - Format: JSON with `employees` array

2. **From MongoDB** (after import):
   - Use `map-users-to-csv.js` script to import users
   - Query MongoDB User collection
   - Passwords are hashed (bcrypt) in MongoDB

## MongoDB Storage

### Do You Need to Store Credentials in MongoDB?

**YES, for production use:**

1. **USER_CREDENTIALS.json** is just a reference file
2. **MongoDB User collection** stores actual authentication data:
   - Email (unique)
   - Hashed password (bcrypt)
   - Role (user/manager/admin)
   - Department, JobTitle, EmployeeID
   - Other user metadata

3. **Security**: Passwords must be hashed in MongoDB, never stored as plain text

4. **Import Process**:
   - Use `backend/scripts/map-users-to-csv.js` to import users
   - Script maps users to CSV employee data
   - Assigns EmployeeID from datasets

## Which Dataset is Used?

**All three datasets are used:**

1. **Primary**: `mental_health_workplace_survey.csv` (3,000 rows)
   - Most comprehensive
   - Has EmployeeID
   - Used for ML model training

2. **Secondary**: `synthetic_employee_burnout.csv` (2,000 rows)
   - Has Name column
   - Used for additional training data

3. **Tertiary**: `synthetic_generated_burnout.csv` (1,000 rows)
   - Has EmployeeID
   - Used for validation/testing

The `map-users-to-csv.js` script loads all three datasets and merges them.

## Fixing USER_CREDENTIALS.json

### Issues to Fix

1. **Update Positions** to match dataset JobRole values
2. **Update Departments** to match dataset Department values
3. **Add JobRole field** aligned with datasets
4. **Ensure role assignment** (manager/user) matches JobRole

### Solution

Run the update script:
```bash
python backend/scripts/update-credentials-to-match-datasets.py
```

This will:
- Map positions to dataset JobRoles
- Map departments to dataset Departments
- Add `jobRole` field
- Keep original position as `originalPosition` for reference
- Create backup of original file

## Next Steps

1. **Run analysis script**: `python backend/scripts/analyze-datasets.py`
2. **Update credentials**: `python backend/scripts/update-credentials-to-match-datasets.py`
3. **Import to MongoDB**: `node backend/scripts/map-users-to-csv.js`
4. **Verify in MongoDB**: Check User collection has all users with correct roles

## Summary

- **Total people in datasets**: ~6,000 rows
- **Users in credentials**: 100 (70 managers, 30 employees)
- **Login format**: Email + password123
- **Storage**: MongoDB (hashed passwords)
- **Issue**: Positions/departments don't match datasets
- **Solution**: Run update script to align with datasets

