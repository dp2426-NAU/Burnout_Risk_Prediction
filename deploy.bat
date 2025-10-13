@echo off
REM 🚀 Burnout Prediction System - Production Deployment Script for Windows
REM Created by Balaji Koneti

echo 🚀 Starting Burnout Prediction System Deployment...
echo.

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/install/
    pause
    exit /b 1
)
echo [SUCCESS] Docker is installed

REM Check if Docker Compose is installed
echo [INFO] Checking Docker Compose installation...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)
echo [SUCCESS] Docker Compose is installed

REM Create environment file
echo [INFO] Creating environment configuration...
if not exist .env (
    (
        echo # Database Configuration
        echo MONGODB_URI=mongodb://mongodb:27017/burnout_prediction
        echo MONGODB_MAX_POOL_SIZE=10
        echo MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
        echo MONGODB_SOCKET_TIMEOUT_MS=45000
        echo.
        echo # Redis Configuration
        echo REDIS_HOST=redis
        echo REDIS_PORT=6379
        echo REDIS_PASSWORD=your-redis-password
        echo REDIS_DB=0
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
        echo JWT_EXPIRES_IN=15m
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo.
        echo # API Configuration
        echo PORT=3001
        echo CORS_ORIGIN=http://localhost:3000
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # ML Service
        echo ML_SERVICE_URL=http://ml-service:8000
        echo.
        echo # Security
        echo ENCRYPTION_KEY=your-encryption-key-change-this-in-production
        echo SESSION_SECRET=your-session-secret-change-this-in-production
        echo BCRYPT_ROUNDS=12
        echo.
        echo # External APIs (Optional - will use synthetic data if not provided)
        echo GOOGLE_CALENDAR_CLIENT_ID=
        echo GOOGLE_CALENDAR_CLIENT_SECRET=
        echo GMAIL_CLIENT_ID=
        echo GMAIL_CLIENT_SECRET=
        echo.
        echo # Monitoring
        echo SENTRY_DSN=
        echo ANALYTICS_ID=
    ) > .env
    echo [SUCCESS] Environment file created
) else (
    echo [WARNING] Environment file already exists
)

REM Deploy with Docker Compose
echo [INFO] Deploying application with Docker Compose...
docker-compose down >nul 2>&1
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to deploy application
    pause
    exit /b 1
)
echo [SUCCESS] Application deployed successfully

REM Wait for services
echo [INFO] Waiting for services to be ready...
echo [INFO] Waiting for MongoDB...
timeout /t 10 /nobreak >nul
echo [SUCCESS] MongoDB is ready

echo [INFO] Waiting for Redis...
timeout /t 5 /nobreak >nul
echo [SUCCESS] Redis is ready

echo [INFO] Waiting for Backend...
timeout /t 15 /nobreak >nul
echo [SUCCESS] Backend is ready

echo [INFO] Waiting for ML Service...
timeout /t 15 /nobreak >nul
echo [SUCCESS] ML Service is ready

echo [INFO] Waiting for Frontend...
timeout /t 10 /nobreak >nul
echo [SUCCESS] Frontend is ready

REM Generate user data
echo [INFO] Generating user data...
docker exec burnout-backend npm install
docker exec burnout-backend npm run generate-users
echo [SUCCESS] User data generated successfully

REM Display access information
echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo 📱 Access URLs:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:3001
echo   ML Service: http://localhost:8000
echo.
echo 🔐 Login Credentials:
echo   Admin: admin@company.com / AdminPass123!
echo   Manager: alex.thompson@company.com / MgrPass123!
echo   Employee: alice.johnson@company.com / EmpPass123!
echo.
echo 📊 System Status:
echo   MongoDB: http://localhost:27017
echo   Redis: http://localhost:6379
echo.
echo 📚 Documentation:
echo   API Docs: docs/API_DOCUMENTATION.md
echo   Deployment Guide: docs/DEPLOYMENT_GUIDE.md
echo   Security Guide: docs/SECURITY_GUIDE.md
echo   User Credentials: docs/USER_CREDENTIALS.md
echo.
echo 🔧 Management Commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Update services: docker-compose pull ^&^& docker-compose up -d
echo.
echo [SUCCESS] 🎉 System is now live and ready to use!
echo.
pause
