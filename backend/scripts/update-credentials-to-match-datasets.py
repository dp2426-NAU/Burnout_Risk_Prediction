#!/usr/bin/env python3
"""
Script to update USER_CREDENTIALS.json to match dataset roles and departments
Maps positions from credentials to actual JobRole values from datasets
"""

import json
import csv
import random
from pathlib import Path
from collections import defaultdict

# Get project root directory
project_root = Path(__file__).parent.parent.parent
datasets_dir = project_root / 'datasets' / 'raw'
credentials_file = project_root / 'backend' / 'USER_CREDENTIALS.json'

# Mapping from credentials positions to dataset JobRoles
POSITION_TO_JOBROLE = {
    # Manager positions -> Manager roles
    'VP Product': 'Product Manager',
    'VP Engineering': 'Project Manager',
    'VP Sales': 'Sales Manager',
    'VP Marketing': 'Marketing Manager',
    'CFO': 'Finance Manager',
    'COO': 'Operations Lead',
    'HR Director': 'HR Specialist',
    'Operations Director': 'Operations Lead',
    'Operations Manager': 'Operations Lead',
    'Finance Manager': 'Finance Manager',
    'Sales Manager': 'Sales Manager',
    'Marketing Manager': 'Marketing Manager',
    'Product Manager': 'Product Manager',
    'Senior Product Manager': 'Product Manager',
    'Design Manager': 'Design Manager',
    'Content Manager': 'Marketing Manager',
    'Customer Success Director': 'Customer Success',
    'Head of Data': 'Data Scientist',
    
    # Employee positions -> Employee roles
    'Senior Software Engineer': 'Software Engineer',
    'Software Engineer': 'Software Engineer',
    'Lead Engineer': 'Software Engineer',
    'UI Designer': 'Designer',
    'UX Designer': 'Designer',
    'Senior CSM': 'Customer Success',
    'Customer Success Manager': 'Customer Success',
    'Account Executive': 'Sales Executive',
    'Senior Sales Rep': 'Sales Associate',
    'Sales Rep': 'Sales Associate',
    'Marketing Specialist': 'Marketing Specialist',
    'Talent Acquisition': 'HR Specialist',
    'HR Manager': 'HR Specialist',
    'Data Analyst': 'Data Scientist',
    'IT Admin': 'IT Admin',
    'Project Coordinator': 'Project Manager',
}

# Department mapping
DEPT_MAPPING = {
    'Customer Success': 'Customer Support',
    'Data Science': 'IT',  # Map to IT or Engineering
    'Design': 'Marketing',  # Map to Marketing
}

# Dataset JobRoles available
DATASET_JOB_ROLES = [
    'Software Engineer',
    'Data Scientist',
    'Project Manager',
    'Marketing Manager',
    'Sales Associate',
    'Sales Executive',
    'HR Specialist',
    'IT Admin',
    'Customer Support',
    'Customer Success',
    'Operations Lead',
    'Product Manager',
    'Finance Manager',
]

# Dataset Departments
DATASET_DEPARTMENTS = [
    'Engineering',
    'IT',
    'Marketing',
    'Sales',
    'HR',
    'Support',
    'Operations',
    'Product',
    'Finance',
    'Customer Support',
]

def load_all_job_roles():
    """Load all job roles from datasets"""
    roles = set()
    csv_files = [
        datasets_dir / 'mental_health_workplace_survey.csv',
        datasets_dir / 'synthetic_employee_burnout.csv',
        datasets_dir / 'synthetic_generated_burnout.csv'
    ]
    
    for csv_file in csv_files:
        if not csv_file.exists():
            continue
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    job_role = row.get('JobRole') or row.get('jobRole')
                    if job_role:
                        roles.add(job_role)
        except Exception as e:
            print(f"Error reading {csv_file}: {e}")
    
    return sorted(roles)

def determine_role_from_position(position):
    """Determine if position is manager or employee"""
    position_lower = position.lower()
    manager_keywords = ['manager', 'director', 'lead', 'head', 'vp', 'cfo', 'coo', 'president']
    return 'manager' if any(kw in position_lower for kw in manager_keywords) else 'user'

def map_position_to_jobrole(position):
    """Map position to dataset JobRole"""
    return POSITION_TO_JOBROLE.get(position, random.choice(DATASET_JOB_ROLES))

def map_department(dept):
    """Map department to dataset department"""
    return DEPT_MAPPING.get(dept, dept)

def update_credentials():
    """Update USER_CREDENTIALS.json with dataset-aligned roles"""
    try:
        # Load existing credentials
        with open(credentials_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        users = data.get('employees', [])
        
        # Load actual job roles from datasets
        available_job_roles = load_all_job_roles()
        print(f"Found {len(available_job_roles)} unique job roles in datasets")
        
        # Update each user
        updated_users = []
        manager_count = 0
        employee_count = 0
        
        for user in users:
            position = user.get('position', '')
            dept = user.get('department', '')
            
            # Determine role (manager/user)
            role = determine_role_from_position(position)
            if role == 'manager':
                manager_count += 1
            else:
                employee_count += 1
            
            # Map position to JobRole
            job_role = map_position_to_jobrole(position)
            if job_role not in available_job_roles:
                # Find closest match
                position_lower = position.lower()
                for dataset_role in available_job_roles:
                    if any(word in dataset_role.lower() for word in position_lower.split()):
                        job_role = dataset_role
                        break
                else:
                    # Default fallback
                    job_role = 'Software Engineer' if 'engineer' in position_lower else 'Sales Associate'
            
            # Map department
            mapped_dept = map_department(dept)
            if mapped_dept not in DATASET_DEPARTMENTS:
                # Find closest match
                dept_lower = dept.lower()
                for dataset_dept in DATASET_DEPARTMENTS:
                    if dataset_dept.lower() in dept_lower or dept_lower in dataset_dept.lower():
                        mapped_dept = dataset_dept
                        break
                else:
                    mapped_dept = 'Engineering'  # Default
            
            updated_user = {
                **user,
                'role': role,
                'jobRole': job_role,  # Add dataset-aligned JobRole
                'department': mapped_dept,  # Update department
                'originalPosition': position,  # Keep original for reference
            }
            updated_users.append(updated_user)
        
        # Create updated structure
        updated_data = {
            'employees': updated_users,
            'summary': {
                'totalUsers': len(updated_users),
                'managers': manager_count,
                'employees': employee_count,
                'updatedAt': str(Path(__file__).stat().st_mtime),
            }
        }
        
        # Backup original file
        backup_file = credentials_file.with_suffix('.json.backup')
        import shutil
        shutil.copy(credentials_file, backup_file)
        print(f"Backed up original to {backup_file}")
        
        # Write updated file
        with open(credentials_file, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2)
        
        print(f"\nUpdated USER_CREDENTIALS.json:")
        print(f"  Total Users: {len(updated_users)}")
        print(f"  Managers: {manager_count}")
        print(f"  Employees: {employee_count}")
        print(f"\nSample updated users:")
        for user in updated_users[:3]:
            print(f"  - {user['name']}: {user['role']} -> {user['jobRole']} ({user['department']})")
        
        return updated_data
        
    except Exception as e:
        print(f"Error updating credentials: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    print("=" * 80)
    print("UPDATING USER_CREDENTIALS.json TO MATCH DATASET ROLES")
    print("=" * 80)
    update_credentials()

