# MongoDB Setup Guide

## Problem
The `map-users-to-csv.js` script is trying to connect to MongoDB but getting:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

This means MongoDB is not running or not accessible.

## Solutions

### Option 1: Use MongoDB Atlas (Cloud - Recommended)

1. **Create a MongoDB Atlas account** (free tier available):
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free
   - Create a new cluster (free M0 tier)

2. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

3. **Create `.env` file**:
   ```bash
   cd backend
   cp env.example .env
   ```

4. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/burnout-risk-prediction?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

5. **Run the script again**:
   ```bash
   node backend/scripts/map-users-to-csv.js
   ```

### Option 2: Install MongoDB Locally (Windows)

1. **Download MongoDB Community Server**:
   - Go to https://www.mongodb.com/try/download/community
   - Download Windows installer
   - Run installer and follow setup wizard

2. **Start MongoDB Service**:
   ```powershell
   # MongoDB should start automatically as a Windows service
   # To check if it's running:
   Get-Service MongoDB
   
   # If not running, start it:
   Start-Service MongoDB
   ```

3. **Create `.env` file**:
   ```bash
   cd backend
   cp env.example .env
   ```

4. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/burnout-risk-prediction
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

5. **Run the script again**:
   ```bash
   node backend/scripts/map-users-to-csv.js
   ```

### Option 3: Use Docker (If you have Docker installed)

1. **Start MongoDB container**:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Create `.env` file**:
   ```bash
   cd backend
   cp env.example .env
   ```

3. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/burnout-risk-prediction
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Run the script**:
   ```bash
   node backend/scripts/map-users-to-csv.js
   ```

## Quick Check Script

Run this to check if MongoDB is accessible:

```bash
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test').then(() => { console.log('✅ MongoDB connected!'); process.exit(0); }).catch(err => { console.log('❌ MongoDB connection failed:', err.message); process.exit(1); });"
```

## After Setup

Once MongoDB is configured, you can:

1. **Import users from USER_CREDENTIALS.json**:
   ```bash
   node backend/scripts/map-users-to-csv.js
   ```

2. **Verify users in MongoDB**:
   ```bash
   node backend/scripts/verify-database.js
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

## Troubleshooting

### "ECONNREFUSED" Error
- MongoDB is not running
- Check if MongoDB service is started
- Verify connection string in `.env` file

### "Authentication failed" Error
- Wrong username/password in connection string
- Update MongoDB Atlas connection string with correct credentials

### "Database name not found"
- This is normal - MongoDB creates databases automatically
- The script will create the database when it runs

## Next Steps

After MongoDB is set up:
1. ✅ Run `node backend/scripts/map-users-to-csv.js` to import users
2. ✅ Verify with `node backend/scripts/verify-database.js`
3. ✅ Start backend: `cd backend && npm run dev`

