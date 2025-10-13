# 🚀 How to Run the Burnout Risk Prediction System

## Quick Start (Windows)

### Option 1: Automated Setup
```bash
# Run the automated setup script
setup.bat
```

### Option 2: Manual Setup
```bash
# 1. Create and activate virtual environment
py -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run setup script
python setup_and_run.py
```

## Quick Start (macOS/Linux)

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run setup script
python setup_and_run.py
```

---

## 🎯 **Complete System Startup**

### **Step 1: Start ML Service**
```bash
# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start ML service
python run_ml_service.py
```
**Access:** http://localhost:8001 (API docs at /docs)

### **Step 2: Start Backend Service**
```bash
# In a new terminal
cd backend
npm install
npm run dev
```
**Access:** http://localhost:3000

### **Step 3: Start Frontend**
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```
**Access:** http://localhost:5173

### **Step 4: Start MLflow (Optional)**
```bash
# In a new terminal
mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./mlruns
```
**Access:** http://localhost:5000

---

## 🧪 **Testing the System**

### **Test ML Components**
```bash
# Test comprehensive evaluation framework
python test_comprehensive_evaluation.py

# Test MLOps infrastructure
python test_mlops_infrastructure.py

# Test advanced features
python test_advanced_features.py
```

### **Test Backend Integration**
```bash
cd backend
node test-ml-integration.js
```

### **Test Full System**
```bash
# Run the complete system test
cd ..
node test-system.js
```

---

## 🎮 **Using the System**

### **1. Web Interface**
- Open http://localhost:5173
- Login with admin credentials
- Navigate to Dashboard → Generate Prediction
- View real-time burnout risk predictions

### **2. API Usage**
```bash
# Generate prediction via API
curl -X POST http://localhost:3000/api/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### **3. ML Service Direct**
```bash
# Direct ML service call
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "features": {
      "work_hours_per_week": 45,
      "stress_level": 7,
      "workload_score": 8
    }
  }'
```

---

## 🔧 **Configuration**

### **Environment Variables**

#### **Backend (.env)**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/burnout-risk-prediction
JWT_SECRET=your-super-secret-jwt-key-here
ML_SERVICE_URL=http://localhost:8001
ML_API_TIMEOUT=10000
```

#### **ML Service**
```env
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_REGISTRY_URI=sqlite:///mlflow.db
```

### **Database Setup**
```bash
# Start MongoDB (if not running)
# Windows: Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 📊 **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (FastAPI)     │
│   Port: 5173    │    │   Port: 3000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │   MLflow        │
                       │   Port: 27017   │    │   Port: 5000    │
                       └─────────────────┘    └─────────────────┘
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8001
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID_NUMBER> /F
```

#### **2. Python Dependencies Issues**
```bash
# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Or use conda
conda create -n burnout_ml python=3.9
conda activate burnout_ml
pip install -r requirements.txt
```

#### **3. MongoDB Connection Issues**
```bash
# Check if MongoDB is running
# Windows: services.msc → MongoDB
# macOS: brew services list | grep mongo
# Linux: sudo systemctl status mongod

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### **4. ML Service Not Responding**
```bash
# Check ML service logs
python run_ml_service.py

# Test ML service directly
curl http://localhost:8001/health

# Check if model files exist
ls models/
```

### **Logs and Debugging**

#### **Enable Debug Logging**
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in .env file
LOG_LEVEL=debug
```

#### **Check Service Health**
```bash
# Backend health
curl http://localhost:3000/health

# ML service health
curl http://localhost:8001/health

# Frontend (check browser console)
```

---

## 📈 **Performance Monitoring**

### **MLflow Dashboard**
- Access: http://localhost:5000
- View experiment results
- Compare model performance
- Monitor model versions

### **System Metrics**
```bash
# Check system resources
# Windows: Task Manager
# macOS: Activity Monitor
# Linux: htop

# Check service status
curl http://localhost:3000/api/status
curl http://localhost:8001/health
```

---

## 🔄 **Development Workflow**

### **1. Making Changes**
```bash
# 1. Make code changes
# 2. Test changes
python test_comprehensive_evaluation.py

# 3. Restart services
# ML service will auto-reload
# Backend: Ctrl+C and npm run dev
# Frontend: Ctrl+C and npm run dev
```

### **2. Model Training**
```bash
# Train new model
python run_training.py

# Evaluate model
python -c "
from src.evaluate import EvaluationService
import asyncio

async def evaluate():
    service = EvaluationService()
    await service.initialize()
    result = await service.evaluate('latest', 'data/test_data.csv')
    print(result)

asyncio.run(evaluate())
"
```

### **3. Deploy Changes**
```bash
# Build for production
cd frontend && npm run build
cd ../backend && npm run build

# Use Docker (if configured)
docker-compose up --build
```

---

## 📚 **Additional Resources**

### **API Documentation**
- Backend API: http://localhost:3000/api-docs
- ML Service API: http://localhost:8001/docs

### **Configuration Files**
- `ml/config/mlops_config.yml` - MLOps configuration
- `backend/.env` - Backend environment variables
- `ml/requirements.txt` - Python dependencies
- `backend/package.json` - Node.js dependencies

### **Test Files**
- `test_comprehensive_evaluation.py` - ML evaluation tests
- `test_mlops_infrastructure.py` - MLOps tests
- `test_advanced_features.py` - Advanced features tests
- `backend/test-ml-integration.js` - Backend integration tests

---

## 🎉 **Success Indicators**

When everything is working correctly, you should see:

✅ **ML Service**: "ML Service started successfully" at http://localhost:8001
✅ **Backend**: "Server running on port 3000" at http://localhost:3000  
✅ **Frontend**: "Local: http://localhost:5173" in browser
✅ **MLflow**: Dashboard accessible at http://localhost:5000
✅ **Predictions**: Working burnout risk predictions in the web interface

---

## 🆘 **Getting Help**

If you encounter issues:

1. **Check the logs** in each service terminal
2. **Verify all services are running** on correct ports
3. **Check environment variables** in .env files
4. **Run the test scripts** to identify specific issues
5. **Check the troubleshooting section** above

**Happy coding! 🚀**

