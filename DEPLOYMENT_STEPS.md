# 🚀 Complete Deployment & Integration Guide

## ✅ STEP 1: Update Backend CORS Configuration

### In Render.com (Backend Service):

1. Go to your **Backend Service** → **Environment Variables**
2. Find or add: `CORS_ORIGIN`
3. Set the value to:
   ```
   https://burnout-risk-prediction.vercel.app,http://localhost:5173,http://localhost:3000
   ```
   (Include your Vercel URL + localhost for development)

4. **Save** and **Redeploy** the backend service

### Why?
Your backend already has CORS configured in `backend/src/index.ts` (line 48), but it reads from `CORS_ORIGIN` environment variable. Adding your Vercel URL allows the frontend to make requests.

---

## ✅ STEP 2: Test Backend Auth Endpoints

### Test Login Endpoint

**Using Postman or curl:**

```bash
POST https://burnout-risk-prediction.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "AdminPass123!"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@company.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `token` value** - you'll need it for Step 3!

**If login fails:**
- Check if user exists in database
- Verify password is correct
- Check backend logs in Render dashboard

### Test Credentials (from README):
- **Admin**: `admin@company.com` / `AdminPass123!`
- **Manager**: `alex.thompson@company.com` / `MgrPass123!`
- **Employee**: `alice.johnson@company.com` / `EmpPass123!`

---

## ✅ STEP 3: Test Protected Route

### Test Without Token (Should Fail):

```bash
GET https://burnout-risk-prediction.onrender.com/api/users
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access token required"
}
```
✅ **This is correct!** It means authentication is working.

### Test With Token (Should Succeed):

```bash
GET https://burnout-risk-prediction.onrender.com/api/users
Authorization: Bearer YOUR_TOKEN_FROM_STEP_2
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [...]
  }
}
```

✅ **If you get user data, backend auth is working perfectly!**

---

## ✅ STEP 4: Frontend Login Integration

### Your Frontend Already Has This! ✅

Your frontend code is already set up correctly:

1. **API Client** (`frontend/src/services/apiClient.ts`):
   - Uses `VITE_API_URL` ✅
   - Automatically adds auth token from localStorage ✅
   - Handles 401 errors (redirects to login) ✅

2. **Auth Service** (`frontend/src/services/authService.ts`):
   - `login()` method calls `/auth/login` ✅
   - Saves token to localStorage ✅

### Verify Frontend Environment Variable:

**In Vercel Dashboard:**
1. Go to **Project** → **Settings** → **Environment Variables**
2. Verify: `VITE_API_URL = https://burnout-risk-prediction.onrender.com/api`
3. **Important:** Make sure it includes `/api` at the end!

### Test Frontend Login:

1. Go to: `https://burnout-risk-prediction.vercel.app/login`
2. Enter credentials: `admin@company.com` / `AdminPass123!`
3. Click Login
4. Should redirect to dashboard
5. Check browser console (F12) - should see no CORS errors

**If login fails:**
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check Network tab - is the request going to the right URL?

---

## ✅ STEP 5: ML Microservice Integration

### Check ML Service Endpoints

**Visit FastAPI Docs:**
```
https://burnout-ml-service.onrender.com/docs
```

**Expected Endpoints:**
- `GET /` - API info
- `GET /health` - Health check
- `POST /predict` - Get burnout prediction
- `POST /train/tabular` - Retrain models
- `GET /eda` - Get EDA report
- `GET /metrics` - Get model metrics

### Test ML Service Health:

```bash
GET https://burnout-ml-service.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok"
}
```

### Test ML Prediction:

```bash
POST https://burnout-ml-service.onrender.com/predict
Content-Type: application/json

{
  "employeeId": "user123",
  "features": {
    "meetingCount": 10,
    "meetingDuration": 8.5,
    "emailCount": 25,
    "avgEmailLength": 150,
    "workHours": 9.5
  }
}
```

**Expected Response:**
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

### Backend ML Integration

**Your backend already calls ML service!** ✅

Check: `backend/src/services/mlApiClient.service.ts`

**In Render (Backend Service):**
1. Go to **Environment Variables**
2. Verify: `ML_SERVICE_URL = https://burnout-ml-service.onrender.com`
3. **Important:** No trailing slash!

---

## ✅ STEP 6: Full Workflow Test

### Complete User Journey:

1. **User Logs In:**
   - Frontend → `POST /api/auth/login`
   - Backend validates credentials
   - Returns JWT token
   - Frontend saves token to localStorage
   - ✅ **Working if you can login**

2. **User Views Dashboard:**
   - Frontend → `GET /api/dashboard/stats` (with token)
   - Backend validates token
   - Returns dashboard data
   - ✅ **Working if dashboard loads**

3. **User Gets Prediction:**
   - Frontend → `POST /api/predictions` (with token)
   - Backend validates token
   - Backend → `POST /predict` to ML service
   - ML service returns prediction
   - Backend saves to database
   - Backend returns to frontend
   - Frontend displays result
   - ✅ **Working if prediction shows**

4. **Admin Retrains Models:**
   - Frontend → `POST /api/ml/retrain` (with admin token)
   - Backend validates admin role
   - Backend → `POST /train/tabular` to ML service
   - ML service trains models
   - Backend returns training summary
   - Frontend shows success message
   - ✅ **Working if retraining completes**

---

## 🔧 Troubleshooting

### CORS Errors:
- ✅ Check `CORS_ORIGIN` in backend includes Vercel URL
- ✅ Verify frontend URL matches exactly (https, no trailing slash)
- ✅ Check browser console for exact error message

### 401 Unauthorized:
- ✅ Check token is being sent in Authorization header
- ✅ Verify token format: `Bearer YOUR_TOKEN`
- ✅ Check token hasn't expired (default: 24h)

### ML Service Not Responding:
- ✅ Check ML service is running (visit `/health`)
- ✅ Verify `ML_SERVICE_URL` in backend environment variables
- ✅ Check backend logs for ML service connection errors

### Frontend Can't Connect:
- ✅ Verify `VITE_API_URL` includes `/api` at the end
- ✅ Check Network tab in browser - what URL is it calling?
- ✅ Verify backend is running and accessible

---

## 📋 Quick Checklist

- [ ] Backend `CORS_ORIGIN` includes Vercel URL
- [ ] Backend `ML_SERVICE_URL` points to ML service
- [ ] Frontend `VITE_API_URL` points to backend + `/api`
- [ ] Login endpoint works in Postman
- [ ] Protected route works with token
- [ ] Frontend login works
- [ ] ML service `/health` returns OK
- [ ] ML service `/predict` works
- [ ] Full workflow works end-to-end

---

## 🎉 Success Indicators

✅ **You're done when:**
1. Can login on Vercel frontend
2. Dashboard loads with data
3. Can generate predictions
4. No CORS errors in browser console
5. All API calls return 200/201 status codes

---

**Need help?** Check the logs:
- **Vercel**: Deployment logs
- **Render Backend**: Service logs
- **Render ML**: Service logs
- **Browser**: Console (F12) + Network tab

