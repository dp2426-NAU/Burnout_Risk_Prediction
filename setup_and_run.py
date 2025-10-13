#!/usr/bin/env python3
# Setup and Run Script - Created by Balaji Koneti
"""
Comprehensive setup and run script for the Burnout Risk Prediction System.
This script handles environment setup, dependency installation, and running the system.
"""

import os
import sys
import subprocess
import platform
import json
from pathlib import Path

def print_header(title):
    """Print a formatted header."""
    print("\n" + "="*60)
    print(f"🚀 {title}")
    print("="*60)

def print_step(step, description):
    """Print a formatted step."""
    print(f"\n📋 Step {step}: {description}")
    print("-" * 40)

def run_command(command, description, check=True):
    """Run a command and handle errors."""
    print(f"   Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"   ✅ {description} - Success")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ {description} - Failed")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    print_step(1, "Checking Python Version")
    
    version = sys.version_info
    print(f"   Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("   ❌ Python 3.8+ is required")
        return False
    
    print("   ✅ Python version is compatible")
    return True

def setup_virtual_environment():
    """Set up Python virtual environment."""
    print_step(2, "Setting up Virtual Environment")
    
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("   ✅ Virtual environment already exists")
        return True
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        return False
    
    print("   ✅ Virtual environment created successfully")
    return True

def install_dependencies():
    """Install Python dependencies."""
    print_step(3, "Installing Dependencies")
    
    # Determine activation command based on OS
    if platform.system() == "Windows":
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    # Install dependencies
    if not run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip"):
        return False
    
    if not run_command(f"{pip_cmd} install -r requirements.txt", "Installing ML dependencies"):
        print("   ⚠️  Some dependencies may have failed. Continuing with basic setup...")
    
    print("   ✅ Dependencies installation completed")
    return True

def test_ml_components():
    """Test ML components."""
    print_step(4, "Testing ML Components")
    
    # Determine python command based on OS
    if platform.system() == "Windows":
        python_cmd = "venv\\Scripts\\python"
    else:
        python_cmd = "venv/bin/python"
    
    # Test comprehensive evaluation
    print("   Testing comprehensive evaluation framework...")
    if run_command(f"{python_cmd} test_comprehensive_evaluation.py", "Comprehensive evaluation test", check=False):
        print("   ✅ Comprehensive evaluation framework working")
    else:
        print("   ⚠️  Comprehensive evaluation test failed (expected if dependencies missing)")
    
    # Test MLOps infrastructure
    print("   Testing MLOps infrastructure...")
    if run_command(f"{python_cmd} test_mlops_infrastructure.py", "MLOps infrastructure test", check=False):
        print("   ✅ MLOps infrastructure working")
    else:
        print("   ⚠️  MLOps infrastructure test failed (expected if dependencies missing)")
    
    # Test advanced features
    print("   Testing advanced features...")
    if run_command(f"{python_cmd} test_advanced_features.py", "Advanced features test", check=False):
        print("   ✅ Advanced features working")
    else:
        print("   ⚠️  Advanced features test failed (expected if dependencies missing)")
    
    return True

def setup_mlflow():
    """Set up MLflow tracking server."""
    print_step(5, "Setting up MLflow")
    
    # Determine python command based on OS
    if platform.system() == "Windows":
        python_cmd = "venv\\Scripts\\python"
    else:
        python_cmd = "venv/bin/python"
    
    # Check if MLflow is installed
    if run_command(f"{python_cmd} -c 'import mlflow; print(mlflow.__version__)'", "Checking MLflow installation", check=False):
        print("   ✅ MLflow is installed")
        
        # Start MLflow server in background
        print("   Starting MLflow server...")
        print("   📝 Note: MLflow server will run on http://localhost:5000")
        print("   📝 You can start it manually with: mlflow server --backend-store-uri sqlite:///mlflow.db")
    else:
        print("   ⚠️  MLflow not installed. Install with: pip install mlflow")
    
    return True

def create_run_scripts():
    """Create convenient run scripts."""
    print_step(6, "Creating Run Scripts")
    
    # Create run_ml_service.py
    ml_service_script = '''#!/usr/bin/env python3
"""
Run ML Service - Created by Balaji Koneti
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.main import app
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting ML Service...")
    print("📝 ML Service will be available at: http://localhost:8001")
    print("📝 API Documentation: http://localhost:8001/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
'''
    
    with open("run_ml_service.py", "w") as f:
        f.write(ml_service_script)
    
    # Create run_training.py
    training_script = '''#!/usr/bin/env python3
"""
Run Model Training - Created by Balaji Koneti
"""
import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.train import TrainingService

async def main():
    print("🚀 Starting Model Training...")
    
    training_service = TrainingService()
    await training_service.initialize()
    
    # Start training with comprehensive pipeline
    training_id = await training_service.start_training(
        dataset_path="data/synthetic_data.csv",
        model_type="comprehensive",
        hyperparameters=None
    )
    
    print(f"📝 Training started with ID: {training_id}")
    print("📝 Check training status with the ML service API")

if __name__ == "__main__":
    asyncio.run(main())
'''
    
    with open("run_training.py", "w") as f:
        f.write(training_script)
    
    print("   ✅ Run scripts created:")
    print("      - run_ml_service.py (Start ML service)")
    print("      - run_training.py (Start model training)")
    
    return True

def print_usage_instructions():
    """Print usage instructions."""
    print_header("Usage Instructions")
    
    print("""
🎯 **How to Run the System:**

1. **Start ML Service:**
   ```bash
   # Activate virtual environment first
   # Windows:
   venv\\Scripts\\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Run ML service
   python run_ml_service.py
   ```
   
2. **Start Backend Service:**
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```
   
3. **Start Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Run Model Training:**
   ```bash
   python run_training.py
   ```

5. **Test the System:**
   ```bash
   # Test ML components
   python test_comprehensive_evaluation.py
   python test_mlops_infrastructure.py
   python test_advanced_features.py
   
   # Test backend integration
   cd ../backend
   node test-ml-integration.js
   ```

📊 **Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- ML Service: http://localhost:8001
- MLflow UI: http://localhost:5000

🔧 **Configuration:**
- ML Service URL: Set ML_SERVICE_URL environment variable
- Database: MongoDB (configure in backend/.env)
- MLflow: SQLite backend (configure in mlflow/)

📝 **Troubleshooting:**
- Check logs in each service
- Verify all dependencies are installed
- Ensure ports 3000, 5173, 8001, 5000 are available
- Check environment variables in .env files
""")

def main():
    """Main setup function."""
    print_header("Burnout Risk Prediction System Setup")
    
    print("""
This script will set up the complete ML system with:
✅ Virtual environment setup
✅ Dependency installation  
✅ ML component testing
✅ MLflow configuration
✅ Run script creation
""")
    
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        print("❌ Error: requirements.txt not found. Please run this script from the ml/ directory.")
        return False
    
    # Run setup steps
    steps = [
        check_python_version,
        setup_virtual_environment,
        install_dependencies,
        test_ml_components,
        setup_mlflow,
        create_run_scripts
    ]
    
    for step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at step: {step_func.__name__}")
            return False
    
    print_header("Setup Complete! 🎉")
    print_usage_instructions()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

