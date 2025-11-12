# Role-Based Access Control Implementation Summary

## Overview
This document explains the role-based access control (RBAC) system and how to use it.

## User Roles

### 1. **Employee (user)**
- **Access**: Can only view their own burnout data
- **Dashboard**: Employee Dashboard (personal view only)
- **Cannot**: View other employees' data or access admin features

### 2. **Manager**
- **Access**: Can view their own data + all direct reports (employees assigned to them)
- **Dashboard**: Manager Dashboard (shows department insights and team members)
- **Cannot**: View other managers' data or employees not under them
- **Can**: View individual employee dashboards for their team members

### 3. **Admin**
- **Access**: Can view ALL users (employees, managers, and admins)
- **Dashboard**: Admin Dashboard (full organization view)
- **Can**: View any employee's dashboard, see all departments, manage system settings

## Database Schema Changes

### User Model Updates
- Added `managerId` field: References the manager's ObjectId (for employees)
- Indexed `managerId` for faster team queries

## Access Control Logic

### Manager-Employee Relationship
- Employees are assigned to managers via the `managerId` field
- Managers can only see employees where `managerId === manager._id`
- Managers cannot see other managers or employees not assigned to them

### Admin Access
- Admins bypass all restrictions
- Admins can see all users regardless of department or manager assignment

## Setup Instructions

### 1. Import Users (including admins)
```bash
cd backend
node scripts/import-users-from-credentials.js
```

This will import:
- Admin users from `USER_CREDENTIALS.json` → `admins` array
- Manager and employee users from `USER_CREDENTIALS.json` → `employees` array

### 2. Assign Managers to Employees
```bash
cd backend
node scripts/assign-managers.js
```

This script:
- Assigns employees to managers in the same department
- Uses round-robin assignment if multiple managers in a department
- Falls back to any manager if no manager exists in the employee's department

### 3. Map Users to CSV Data (if needed)
```bash
cd backend
node scripts/map-users-to-csv.js
```

## Admin Users

Two admin users have been added to `USER_CREDENTIALS.json`:

1. **admin@company.com** / admin123
   - System Administrator
   - Department: IT

2. **hr.admin@company.com** / admin123
   - HR Administrator
   - Department: HR

## Testing Access Control

### Test as Employee
1. Login as: `lee.stoltenberg@company.com` / password123
2. Should see: Only their own dashboard data
3. Cannot access: Other employees' data

### Test as Manager
1. Login as: `johann.stracke@company.com` / password123
2. Should see: 
   - Their own dashboard
   - Department insights
   - Only employees assigned to them (via managerId)
3. Cannot access: Other managers or employees not under them

### Test as Admin
1. Login as: `admin@company.com` / admin123
2. Should see:
   - All users (employees, managers, admins)
   - All departments
   - Any employee's dashboard
   - System-wide statistics

## Dashboard Differences

### Employee Dashboard
- Personal burnout risk assessment
- Personal recommendations
- Personal simulation
- No access to other users

### Manager Dashboard
- Personal dashboard + team overview
- Department insights (for their department)
- View individual employee dashboards (only for direct reports)
- Cannot see other managers or employees not under them

### Admin Dashboard
- Full organization overview
- All departments and all users
- View any employee's dashboard
- System administration features
- Model training and EDA reports

## API Endpoints

### Get All Users
- **Endpoint**: `GET /api/users`
- **Employee**: Returns only themselves
- **Manager**: Returns themselves + direct reports
- **Admin**: Returns all users

### Get Employee Dashboard
- **Endpoint**: `GET /api/dashboard/employee?userId=<id>`
- **Employee**: Can only access their own userId
- **Manager**: Can access their own userId + direct reports' userIds
- **Admin**: Can access any userId

## Notes

- The `managerId` field must be set for employees to appear in their manager's view
- Managers are automatically excluded from being assigned to other managers
- Admins are excluded from manager assignment
- Department-based assignment is preferred, but falls back to round-robin if needed

