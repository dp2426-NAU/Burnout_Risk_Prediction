#!/usr/bin/env python3
"""
Script to analyze datasets and USER_CREDENTIALS.json
Answers questions about:
- How many employees and managers in datasets
- What login credentials exist
- Which dataset is used
- How many total people
- Role/position mismatches
"""

import json
import csv
import os
from collections import Counter, defaultdict
from pathlib import Path

# Get project root directory
project_root = Path(__file__).parent.parent.parent
datasets_dir = project_root / 'datasets' / 'raw'
credentials_file = project_root / 'backend' / 'USER_CREDENTIALS.json'

def count_csv_rows(file_path):
    """Count rows in a CSV file (excluding header)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            return sum(1 for row in reader) - 1  # Exclude header
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def analyze_csv(file_path):
    """Analyze a CSV file and extract job roles and departments"""
    data = {
        'rows': 0,
        'job_roles': Counter(),
        'departments': Counter(),
        'managers': 0,
        'employees': 0,
        'has_employee_id': False,
        'has_name': False
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            data['rows'] = len(rows)
            
            if not rows:
                return data
            
            # Check available columns
            first_row = rows[0]
            data['has_employee_id'] = 'EmployeeID' in first_row or 'employeeId' in first_row
            data['has_name'] = 'Name' in first_row or 'name' in first_row
            
            # Manager keywords
            manager_keywords = ['manager', 'director', 'lead', 'head', 'vp', 'cfo', 'coo', 'ceo', 'president']
            
            for row in rows:
                # Get job role (try different column names)
                job_role = (
                    row.get('JobRole') or 
                    row.get('jobRole') or 
                    row.get('Position') or 
                    row.get('position') or 
                    ''
                ).lower()
                
                # Get department
                dept = (
                    row.get('Department') or 
                    row.get('department') or 
                    ''
                )
                
                if job_role:
                    data['job_roles'][job_role] += 1
                    
                    # Check if manager
                    is_manager = any(keyword in job_role for keyword in manager_keywords)
                    if is_manager:
                        data['managers'] += 1
                    else:
                        data['employees'] += 1
                
                if dept:
                    data['departments'][dept] += 1
                    
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")
    
    return data

def analyze_credentials():
    """Analyze USER_CREDENTIALS.json"""
    data = {
        'total_users': 0,
        'managers': 0,
        'employees': 0,
        'departments': Counter(),
        'positions': Counter(),
        'users': []
    }
    
    try:
        with open(credentials_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
            
            users = content.get('employees', [])
            data['total_users'] = len(users)
            
            manager_keywords = ['manager', 'director', 'lead', 'head', 'vp', 'cfo', 'coo', 'ceo', 'president']
            
            for user in users:
                position = (user.get('position') or '').lower()
                dept = user.get('department', '')
                
                data['positions'][user.get('position', 'Unknown')] += 1
                if dept:
                    data['departments'][dept] += 1
                
                is_manager = any(keyword in position for keyword in manager_keywords)
                if is_manager:
                    data['managers'] += 1
                else:
                    data['employees'] += 1
                
                data['users'].append({
                    'email': user.get('email'),
                    'name': user.get('name'),
                    'position': user.get('position'),
                    'department': user.get('department'),
                    'is_manager': is_manager
                })
                
    except Exception as e:
        print(f"Error reading credentials file: {e}")
    
    return data

def main():
    print("=" * 80)
    print("DATASET AND USER CREDENTIALS ANALYSIS")
    print("=" * 80)
    print()
    
    # Analyze CSV files
    csv_files = {
        'mental_health_workplace_survey.csv': datasets_dir / 'mental_health_workplace_survey.csv',
        'synthetic_employee_burnout.csv': datasets_dir / 'synthetic_employee_burnout.csv',
        'synthetic_generated_burnout.csv': datasets_dir / 'synthetic_generated_burnout.csv'
    }
    
    csv_results = {}
    total_rows = 0
    
    print("CSV DATASET ANALYSIS")
    print("-" * 80)
    for name, path in csv_files.items():
        if path.exists():
            print(f"\n{name}:")
            result = analyze_csv(path)
            csv_results[name] = result
            total_rows += result['rows']
            
            print(f"  Total Rows: {result['rows']:,}")
            print(f"  Has EmployeeID: {result['has_employee_id']}")
            print(f"  Has Name: {result['has_name']}")
            print(f"  Managers (estimated): {result['managers']}")
            print(f"  Employees (estimated): {result['employees']}")
            
            print(f"\n  Top 10 Job Roles:")
            for role, count in result['job_roles'].most_common(10):
                print(f"    - {role}: {count}")
            
            print(f"\n  Departments:")
            for dept, count in result['departments'].most_common():
                print(f"    - {dept}: {count}")
        else:
            print(f"\n{name}: FILE NOT FOUND")
    
    print("\n" + "=" * 80)
    print(f"TOTAL ROWS ACROSS ALL DATASETS: {total_rows:,}")
    print("=" * 80)
    
    # Analyze credentials
    print("\n\nUSER CREDENTIALS ANALYSIS")
    print("-" * 80)
    creds_data = analyze_credentials()
    
    print(f"\nTotal Users in USER_CREDENTIALS.json: {creds_data['total_users']}")
    print(f"Managers: {creds_data['managers']}")
    print(f"Employees: {creds_data['employees']}")
    
    print(f"\nTop 10 Positions:")
    for pos, count in creds_data['positions'].most_common(10):
        print(f"  - {pos}: {count}")
    
    print(f"\nDepartments:")
    for dept, count in creds_data['departments'].most_common():
        print(f"  - {dept}: {count}")
    
    # Compare datasets vs credentials
    print("\n\nCOMPARISON: DATASETS vs USER_CREDENTIALS.json")
    print("-" * 80)
    
    # Get all unique job roles from datasets
    all_dataset_roles = set()
    all_dataset_depts = set()
    
    for result in csv_results.values():
        all_dataset_roles.update(result['job_roles'].keys())
        all_dataset_depts.update(result['departments'].keys())
    
    # Get positions from credentials
    creds_positions = set(p.lower() for p in creds_data['positions'].keys())
    creds_depts = set(creds_data['departments'].keys())
    
    print(f"\nDataset Job Roles: {len(all_dataset_roles)} unique roles")
    print(f"Credentials Positions: {len(creds_positions)} unique positions")
    
    print(f"\nMISMATCHES:")
    print(f"  - Dataset has {len(all_dataset_roles)} job roles")
    print(f"  - Credentials has {len(creds_positions)} positions")
    print(f"  - Overlap: {len(set(r.lower() for r in all_dataset_roles) & creds_positions)}")
    
    print(f"\nDataset Departments: {sorted(all_dataset_depts)}")
    print(f"Credentials Departments: {sorted(creds_depts)}")
    
    # Recommendations
    print("\n\nRECOMMENDATIONS")
    print("-" * 80)
    print("""
1. YES, you should store login credentials in MongoDB for production use
   - USER_CREDENTIALS.json is just a reference file
   - Actual authentication should use MongoDB User collection
   - Passwords should be hashed (bcrypt) in MongoDB

2. USER_CREDENTIALS.json needs to be updated to match dataset roles:
   - Current positions don't match dataset JobRole values
   - Need to map positions to actual JobRole values from datasets
   - Departments should match dataset Department values

3. To determine employee vs manager:
   - Check JobRole column in datasets
   - Roles containing: Manager, Director, Lead, Head, VP, CFO, COO = Managers
   - All other roles = Employees

4. Total people in datasets: ~6,000 rows (may have duplicates)
   - mental_health_workplace_survey.csv: ~3,000 rows
   - synthetic_employee_burnout.csv: ~2,000 rows  
   - synthetic_generated_burnout.csv: ~1,000 rows

5. Login credentials:
   - All passwords in USER_CREDENTIALS.json: "password123"
   - Email format: [name]@company.com
   - Should be imported into MongoDB using the map-users-to-csv.js script
    """)
    
    # Sample login credentials
    print("\n\nSAMPLE LOGIN CREDENTIALS")
    print("-" * 80)
    print("\nFirst 5 users:")
    for i, user in enumerate(creds_data['users'][:5], 1):
        print(f"\n{i}. {user['name']}")
        print(f"   Email: {user['email']}")
        print(f"   Password: password123")
        print(f"   Role: {'Manager' if user['is_manager'] else 'Employee'}")
        print(f"   Position: {user['position']}")
        print(f"   Department: {user['department']}")

if __name__ == '__main__':
    main()

