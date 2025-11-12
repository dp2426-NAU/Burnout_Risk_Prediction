# Answers to Your Questions

## 1. How many employees and managers?

### In the Datasets:
- **Total: ~6,000 people** across all datasets
- **Managers: ~1,528** (estimated based on JobRole)
- **Employees: ~4,472** (estimated based on JobRole)

Breakdown by dataset:
- `mental_health_workplace_survey.csv`: 734 managers, 2,266 employees
- `synthetic_employee_burnout.csv`: 419 managers, 1,581 employees  
- `synthetic_generated_burnout.csv`: 375 managers, 625 employees

### In USER_CREDENTIALS.json:
- **Total: 100 users**
- **Managers: 70**
- **Employees: 30**

## 2. Login Password Details

### All users have the same password:
- **Password**: `password123`
- **Email format**: `[firstname].[lastname]@company.com`

### Example credentials:
```
Email: johann.stracke@company.com
Password: password123
Role: manager
JobRole: Project Manager
Department: Marketing

Email: allison.beatty@company.com
Password: password123
Role: manager
JobRole: Manager
Department: Finance
```

### How to view all credentials:
1. Open `backend/USER_CREDENTIALS.json`
2. Each user has: `email`, `password`, `name`, `role`, `jobRole`, `department`

## 3. Which dataset is used?

**All three datasets are used:**

1. **mental_health_workplace_survey.csv** (3,000 rows)
   - Primary dataset for ML model
   - Has EmployeeID column
   - Most comprehensive data

2. **synthetic_employee_burnout.csv** (2,000 rows)
   - Secondary dataset
   - Has Name column (no EmployeeID)
   - Additional training data

3. **synthetic_generated_burnout.csv** (1,000 rows)
   - Tertiary dataset
   - Has EmployeeID column
   - Used for validation/testing

The `map-users-to-csv.js` script loads and merges all three datasets.

## 4. Do I need to store login credentials in MongoDB?

**YES, absolutely!**

### Why MongoDB?
- **USER_CREDENTIALS.json** is just a reference file
- **MongoDB** stores actual authentication data for the application
- Passwords are **hashed** (bcrypt) in MongoDB for security
- The application authenticates against MongoDB, not the JSON file

### How to import:
```bash
node backend/scripts/map-users-to-csv.js
```

This script:
- Reads USER_CREDENTIALS.json
- Hashes passwords with bcrypt
- Maps users to CSV employee data
- Stores everything in MongoDB User collection

## 5. How many people in the database?

### Total: ~6,000 rows
- mental_health_workplace_survey.csv: **3,000 rows**
- synthetic_employee_burnout.csv: **2,000 rows**
- synthetic_generated_burnout.csv: **1,000 rows**

**Note**: There may be some duplicates across datasets (same EmployeeID or Name), so unique count might be slightly less.

## 6. USER_CREDENTIALS.json Issues - FIXED!

### Problems Found:
1. ✅ **Positions didn't match dataset JobRoles**
   - Credentials had: "Creative Director", "VP Product", "CFO"
   - Datasets have: "Project Manager", "Product Manager", "Marketing Manager", etc.

2. ✅ **Departments didn't match**
   - Credentials had: "Design", "Data Science", "Customer Success"
   - Datasets have: "Marketing", "IT", "Customer Support", etc.

3. ✅ **No role field** aligned with dataset structure

### Solution Applied:
✅ **Updated USER_CREDENTIALS.json** with:
- `role`: "manager" or "user" (based on position)
- `jobRole`: Mapped to actual dataset JobRole values
- `department`: Mapped to dataset Department values
- `originalPosition`: Kept for reference

### Backup Created:
- Original file saved as: `backend/USER_CREDENTIALS.json.backup`

## Summary

| Question | Answer |
|----------|--------|
| **Total people in datasets** | ~6,000 rows |
| **Managers in datasets** | ~1,528 |
| **Employees in datasets** | ~4,472 |
| **Users in credentials** | 100 (70 managers, 30 employees) |
| **Password** | `password123` for all |
| **Store in MongoDB?** | YES - required for production |
| **Which dataset?** | All 3 datasets are used |
| **Credentials fixed?** | YES - updated to match datasets |

## Next Steps

1. ✅ **Analysis complete** - Run `python backend/scripts/analyze-datasets.py` anytime
2. ✅ **Credentials updated** - USER_CREDENTIALS.json now matches datasets
3. ⏭️ **Import to MongoDB** - Run `node backend/scripts/map-users-to-csv.js`
4. ⏭️ **Verify** - Check MongoDB User collection has all users

## Files Created

1. `backend/scripts/analyze-datasets.py` - Analysis script
2. `backend/scripts/update-credentials-to-match-datasets.py` - Update script
3. `docs/DATASET_CREDENTIALS_ANALYSIS.md` - Detailed documentation
4. `backend/USER_CREDENTIALS.json.backup` - Backup of original file

