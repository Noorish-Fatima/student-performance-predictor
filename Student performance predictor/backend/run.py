#!/usr/bin/env python3
import os
import sys
import subprocess
import webbrowser
import time

def check_requirements():
    """Check and install requirements"""
    print("Checking requirements...")
    
    requirements = [
        'flask', 'pandas', 'numpy', 'scikit-learn', 'joblib',
        'tensorflow-cpu', 'xgboost', 'lightgbm'
    ]
    
    for req in requirements:
        try:
            __import__(req.replace('-', '_'))
            print(f"✓ {req}")
        except ImportError:
            print(f"✗ {req} - Missing")
            return False
    
    return True

def setup_project():
    """Setup project structure"""
    print("\nSetting up project structure...")
    
    # Create directories
    directories = [
        'backend/model',
        'backend/data',
        'backend/database',
        'frontend/css',
        'frontend/js'
    ]
    
    for dir_path in directories:
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created: {dir_path}")
    
    print("\n✓ Project structure created")

def train_models():
    """Train ML models"""
    print("\nTraining ML models...")
    
    try:
        import subprocess
        result = subprocess.run(
            [sys.executable, 'backend/model/train_models.py'],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✓ Models trained successfully!")
            return True
        else:
            print("✗ Model training failed:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error training models: {e}")
        return False

def start_server():
    """Start the Flask server"""
    print("\nStarting Flask server...")
    
    try:
        import backend.app
        # The app will run from its __main__ block
        return True
    except Exception as e:
        print(f"✗ Error starting server: {e}")
        return False

def main():
    print("=" * 60)
    print("STUDENT PERFORMANCE PREDICTION SYSTEM - SETUP")
    print("=" * 60)
    
    # Check if in correct directory
    if not os.path.exists('backend'):
        print("Please run this script from the project root directory!")
        print("Expected: student-performance-prediction/")
        return
    
    # Setup project
    setup_project()
    
    # Check requirements
    if not check_requirements():
        print("\nPlease install missing requirements:")
        print("pip install -r backend/requirements.txt")
        return
    
    # Train models
    if not train_models():
        print("\n⚠ Using fallback models (demo mode)")
    
    # Instructions
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print("\nTo start the application:")
    print("1. Navigate to backend directory:")
    print("   cd backend")
    print("\n2. Start the Flask server:")
    print("   python app.py")
    print("\n3. Open your browser and go to:")
    print("   http://localhost:5000")
    print("\n4. For the frontend separately:")
    print("   cd frontend")
    print("   python -m http.server 8000")
    print("   http://localhost:8000")
    print("\n" + "=" * 60)
    
    # Ask to start server
    response = input("\nStart backend server now? (y/n): ")
    if response.lower() == 'y':
        os.chdir('backend')
        os.system('python app.py')

if __name__ == '__main__':
    main()