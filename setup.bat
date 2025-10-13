@echo off
echo ========================================
echo 🚀 Burnout Risk Prediction System Setup
echo ========================================
echo.

echo 📋 Setting up Python virtual environment...
py -m venv venv
if errorlevel 1 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

echo 📋 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📋 Upgrading pip...
python -m pip install --upgrade pip

echo 📋 Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ⚠️  Some dependencies failed to install. Continuing...
)

echo 📋 Running setup script...
python setup_and_run.py

echo.
echo ✅ Setup complete! 
echo.
echo 🚀 To start the system:
echo 1. Activate virtual environment: venv\Scripts\activate.bat
echo 2. Start ML service: python run_ml_service.py
echo 3. Start backend: cd ..\backend && npm run dev
echo 4. Start frontend: cd ..\frontend && npm run dev
echo.
pause

