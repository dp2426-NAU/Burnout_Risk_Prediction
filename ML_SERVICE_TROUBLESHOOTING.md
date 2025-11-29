# 🔧 ML Service Troubleshooting Guide

## ✅ Good News: Your ML Service is Working!

From your logs:
- ✅ Service is running: `Uvicorn running on http://0.0.0.0:10000`
- ✅ Service is live: `Your service is live 🎉`
- ✅ Health endpoint works: `GET /health HTTP/1.1" 200 OK`
- ✅ Available at: `https://burnout-ml-service.onrender.com`

The 405 errors are just Render's health checks using HEAD method (I've fixed this).

---

## 🔍 Fixing the "Network Error" in Frontend

The "Network error. Please check your connection" message means the frontend can't reach the backend or ML service.

### Step 1: Verify Environment Variables

**In Render (Backend Service):**
```
ML_SERVICE_URL = https://burnout-ml-service.onrender.com
```
**Important:** No trailing slash!

**In Vercel (Frontend):**
```
VITE_API_URL = https://burnout-risk-prediction.onrender.com/api
```
**Important:** Must include `/api` at the end!

### Step 2: Test ML Service Directly

**Test Health Endpoint:**
```bash
curl https://burnout-ml-service.onrender.com/health
```

**Expected Response:**
```json
{"status": "ok"}
```

**Test API Docs:**
Visit: `https://burnout-ml-service.onrender.com/docs`

Should show FastAPI documentation with all endpoints.

### Step 3: Test Backend → ML Service Connection

**Test from Backend:**
```bash
curl https://burnout-risk-prediction.onrender.com/api/ml/eda
```

**If you get 401:**
- ✅ This is correct! You need to be logged in as admin
- The endpoint requires authentication

**If you get 500:**
- ❌ Backend can't reach ML service
- Check `ML_SERVICE_URL` in backend environment variables
- Check backend logs in Render

### Step 4: Test Frontend → Backend Connection

**Open Browser Console (F12):**
1. Go to: `https://burnout-risk-prediction.vercel.app`
2. Open Network tab
3. Try to trigger "Retrain Models"
4. Check what request fails

**Common Issues:**

#### CORS Error:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Fix:** Add Vercel URL to `CORS_ORIGIN` in backend:
```
CORS_ORIGIN = https://burnout-risk-prediction.vercel.app,http://localhost:5173
```

#### 401 Unauthorized:
```
401 Unauthorized
```
**Fix:** 
- Make sure you're logged in
- Check token is in localStorage: `localStorage.getItem('token')`
- Try logging in again

#### 500 Internal Server Error:
```
500 Internal Server Error
```
**Fix:**
- Check backend logs in Render
- Verify `ML_SERVICE_URL` is correct
- Check ML service is running

#### Network Error (No Response):
```
Network error. Please check your connection.
```
**Fix:**
- Check `VITE_API_URL` is correct in Vercel
- Verify backend is running
- Check browser console for exact error

---

## 🧪 Step-by-Step Testing

### 1. Test ML Service Health
```bash
curl https://burnout-ml-service.onrender.com/health
```
✅ Should return: `{"status": "ok"}`

### 2. Test Backend Health
```bash
curl https://burnout-risk-prediction.onrender.com/api/health
```
✅ Should return: `{"status": "OK", ...}`

### 3. Test Backend Login
```bash
curl -X POST https://burnout-risk-prediction.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"AdminPass123!"}'
```
✅ Should return token

### 4. Test ML Endpoint (with token)
```bash
curl https://burnout-risk-prediction.onrender.com/api/ml/eda \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Should return EDA report or 404 if not trained yet

### 5. Test Frontend
1. Login at: `https://burnout-risk-prediction.vercel.app/login`
2. Go to Admin section
3. Click "Retrain Models"
4. Check browser console for errors

---

## 🔧 Common Fixes

### Fix 1: ML Service Health Check (405 Errors)
**Status:** ✅ Fixed in code
**Action:** Commit and redeploy ML service

### Fix 2: Frontend Network Error
**Check:**
1. `VITE_API_URL` in Vercel includes `/api`
2. Backend is running
3. CORS is configured correctly

### Fix 3: Backend Can't Reach ML Service
**Check:**
1. `ML_SERVICE_URL` in backend (no trailing slash)
2. ML service is running
3. Backend logs for connection errors

### Fix 4: EDA Report Not Available
**This is normal if:**
- Models haven't been trained yet
- Training failed
- Report file doesn't exist

**Fix:**
1. Click "Retrain Models" button
2. Wait for training to complete
3. Refresh page

---

## 📋 Quick Checklist

- [ ] ML service is running: `https://burnout-ml-service.onrender.com/health`
- [ ] Backend has `ML_SERVICE_URL` set correctly
- [ ] Frontend has `VITE_API_URL` set correctly
- [ ] Backend has `CORS_ORIGIN` including Vercel URL
- [ ] You're logged in as admin
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful API calls

---

## 🎯 Next Steps

1. **Commit the health endpoint fix** (accepts HEAD requests)
2. **Redeploy ML service** (to fix 405 errors)
3. **Test ML service health** endpoint
4. **Test frontend connection** to backend
5. **Test "Retrain Models"** button as admin

---

## 💡 Debugging Tips

### Check Backend Logs (Render):
- Look for: `ML API Client initialized with base URL: ...`
- Look for: Connection errors to ML service
- Look for: Authentication errors

### Check ML Service Logs (Render):
- Look for: Request logs
- Look for: Error messages
- Look for: Training progress

### Check Browser Console:
- Network tab: See all API requests
- Console tab: See JavaScript errors
- Application tab: Check localStorage for token

---

**The service is working!** The network error is likely a configuration issue (CORS, environment variables, or authentication).

