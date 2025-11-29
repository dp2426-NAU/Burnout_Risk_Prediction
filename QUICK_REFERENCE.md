# 🚀 Quick Reference - Environment Variables & URLs

## 📍 Environment Variables Summary

### Vercel (Frontend)
```
VITE_API_URL = https://burnout-risk-prediction.onrender.com/api
```
**Important:** Must include `/api` at the end!

---

### Render (Backend Service)
```
CORS_ORIGIN = https://burnout-risk-prediction.vercel.app,http://localhost:5173,http://localhost:3000
ML_SERVICE_URL = https://burnout-ml-service.onrender.com
MONGODB_URI = (your MongoDB connection string)
JWT_SECRET = (your JWT secret)
```

**Important:** 
- `CORS_ORIGIN` should include your Vercel URL
- `ML_SERVICE_URL` should NOT have trailing slash

---

### Render (ML Service)
```
PORT = (auto-set by Render, use $PORT in start command)
```

**Start Command:**
```bash
uvicorn src.api.server:app --host 0.0.0.0 --port $PORT
```

---

## 🔗 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://burnout-risk-prediction.vercel.app` | React app |
| **Backend API** | `https://burnout-risk-prediction.onrender.com` | Node.js/Express API |
| **ML Service** | `https://burnout-ml-service.onrender.com` | Python/FastAPI ML service |

---

## 🧪 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@company.com` | `AdminPass123!` |
| Manager | `alex.thompson@company.com` | `MgrPass123!` |
| Employee | `alice.johnson@company.com` | `EmpPass123!` |

---

## 📡 API Endpoints

### Backend (Node.js)
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (requires token)
- `GET /api/users` - List users (requires token)
- `POST /api/predictions` - Create prediction (requires token)
- `POST /api/ml/retrain` - Retrain models (requires admin token)
- `GET /api/ml/eda` - Get EDA report (requires token)

### ML Service (Python/FastAPI)
- `GET /health` - Health check
- `POST /predict` - Get prediction
- `POST /train/tabular` - Retrain models
- `GET /eda` - Get EDA report
- `GET /metrics` - Get model metrics
- `GET /docs` - API documentation

---

## ✅ Quick Test Commands

### Test Backend Health
```bash
curl https://burnout-risk-prediction.onrender.com/api/health
```

### Test Backend Login
```bash
curl -X POST https://burnout-risk-prediction.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"AdminPass123!"}'
```

### Test ML Service Health
```bash
curl https://burnout-ml-service.onrender.com/health
```

### Test ML Prediction
```bash
curl -X POST https://burnout-ml-service.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "user123",
    "features": {
      "meetingCount": 10,
      "workHours": 9.5
    }
  }'
```

---

## 🔍 Troubleshooting Quick Fixes

### CORS Error
- ✅ Add Vercel URL to `CORS_ORIGIN` in backend
- ✅ Redeploy backend

### 401 Unauthorized
- ✅ Check token is in Authorization header: `Bearer TOKEN`
- ✅ Verify token hasn't expired

### Frontend Can't Connect
- ✅ Check `VITE_API_URL` includes `/api`
- ✅ Verify backend is running
- ✅ Check browser console for exact error

### ML Service Not Working
- ✅ Check `ML_SERVICE_URL` in backend (no trailing slash)
- ✅ Verify ML service is running: `/health` endpoint
- ✅ Check ML service logs in Render

---

## 📝 Response Formats

### Login Success
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Prediction Response
```json
{
  "riskLevel": "high",
  "riskScore": 0.75,
  "confidence": 0.85,
  "probabilities": {
    "low": 0.1,
    "medium": 0.15,
    "high": 0.6,
    "critical": 0.15
  },
  "features": {...},
  "recommendations": [...]
}
```

---

**For detailed steps, see `DEPLOYMENT_STEPS.md`**

