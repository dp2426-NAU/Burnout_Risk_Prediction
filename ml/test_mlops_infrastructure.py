#!/usr/bin/env python3
# Test MLOps Infrastructure - Created by Balaji Koneti
"""
Test script for the MLOps infrastructure components.
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification
import tempfile
import os
import json
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_experiment_tracking():
    """Test MLflow experiment tracking."""
    try:
        logger.info("Testing MLflow experiment tracking...")
        
        from src.mlops.experiment_tracking import MLflowExperimentTracker
        
        # Initialize tracker
        tracker = MLflowExperimentTracker("test-burnout-experiment")
        experiment_id = tracker.initialize_experiment()
        
        # Start a run
        run_id = tracker.start_run("test-run", {"test": "true"})
        
        # Generate test data
        X, y = make_classification(n_samples=1000, n_features=10, random_state=42)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train a model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Log parameters
        tracker.log_parameters({
            "n_estimators": 100,
            "max_depth": None,
            "random_state": 42
        })
        
        # Calculate metrics
        y_pred = model.predict(X_test)
        from sklearn.metrics import accuracy_score, f1_score, recall_score
        
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred)
        }
        
        # Log metrics
        tracker.log_metrics(metrics)
        
        # Log model
        tracker.log_model(model, "test_model")
        
        # Log dataset info
        dataset_info = {
            "size": len(X),
            "n_features": X.shape[1],
            "n_classes": len(np.unique(y)),
            "train_size": len(X_train),
            "test_size": len(X_test)
        }
        tracker.log_dataset_info(dataset_info)
        
        # Log feature importance
        feature_names = [f"feature_{i}" for i in range(X.shape[1])]
        importance_scores = model.feature_importances_
        tracker.log_feature_importance(feature_names, importance_scores)
        
        # End run
        tracker.end_run("FINISHED")
        
        logger.info("✅ MLflow experiment tracking test completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ MLflow experiment tracking test failed: {str(e)}")
        return False

async def test_model_monitoring():
    """Test model monitoring and drift detection."""
    try:
        logger.info("Testing model monitoring and drift detection...")
        
        from src.mlops.model_monitoring import ModelMonitor
        
        # Generate test data
        X, y = make_classification(n_samples=1000, n_features=10, random_state=42)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train a model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Save model and reference data
        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = os.path.join(temp_dir, "test_model.pkl")
            reference_data_path = os.path.join(temp_dir, "reference_data.csv")
            
            import joblib
            joblib.dump(model, model_path)
            
            # Create reference data
            reference_df = pd.DataFrame(X_train, columns=[f"feature_{i}" for i in range(X_train.shape[1])])
            reference_df.to_csv(reference_data_path, index=False)
            
            # Initialize monitor
            monitor = ModelMonitor(model_path, reference_data_path)
            monitor.initialize()
            
            # Generate new data with slight drift
            X_new, _ = make_classification(n_samples=200, n_features=10, random_state=123)
            new_df = pd.DataFrame(X_new, columns=[f"feature_{i}" for i in range(X_new.shape[1])])
            
            # Test drift detection
            statistical_drift = monitor.detect_statistical_drift(new_df)
            data_drift = monitor.detect_data_drift(new_df)
            
            # Test performance drift
            reference_metrics = {
                "accuracy": 0.85,
                "f1_score": 0.82,
                "recall": 0.80
            }
            performance_drift = monitor.detect_performance_drift(X_test, y_test, reference_metrics)
            
            # Test concept drift
            concept_drift = monitor.detect_concept_drift(X_test, y_test)
            
            # Test comprehensive drift detection
            comprehensive_drift = monitor.comprehensive_drift_detection(
                new_df, X_test, y_test, reference_metrics
            )
            
            # Test monitoring summary
            summary = monitor.get_monitoring_summary(days=7)
            
            logger.info("✅ Model monitoring test completed successfully")
            logger.info(f"   Statistical drift detected: {statistical_drift['drift_detected']}")
            logger.info(f"   Data drift detected: {data_drift['drift_detected']}")
            logger.info(f"   Performance drift detected: {performance_drift['drift_detected']}")
            logger.info(f"   Concept drift detected: {concept_drift['drift_detected']}")
            logger.info(f"   Overall drift detected: {comprehensive_drift['overall_drift_detected']}")
            
            return True
        
    except Exception as e:
        logger.error(f"❌ Model monitoring test failed: {str(e)}")
        return False

async def test_automated_retraining():
    """Test automated retraining pipeline."""
    try:
        logger.info("Testing automated retraining pipeline...")
        
        from src.mlops.automated_retraining import AutomatedRetrainingPipeline
        
        # Configuration for testing
        config = {
            "retraining_triggers": {
                "performance_threshold": 0.1,
                "drift_threshold": 0.15,
                "time_interval_days": 1,  # Short interval for testing
                "data_size_threshold": 100
            },
            "deployment": {
                "auto_deploy": False,  # Disable auto-deployment for testing
                "performance_threshold": 0.80,
                "recall_threshold": 0.85,
                "staging_period_hours": 1
            },
            "models_dir": "test_models",
            "data_dir": "test_data",
            "backup_dir": "test_backups"
        }
        
        # Create test directories
        for dir_path in [config["models_dir"], config["data_dir"], config["backup_dir"]]:
            Path(dir_path).mkdir(exist_ok=True)
        
        # Initialize pipeline
        pipeline = AutomatedRetrainingPipeline(config)
        await pipeline.initialize()
        
        # Test retraining triggers
        trigger_info = await pipeline.check_retraining_triggers()
        logger.info(f"Retraining triggers checked: {trigger_info['retraining_required']}")
        
        # Test monitoring cycle
        cycle_result = await pipeline.run_monitoring_cycle()
        logger.info(f"Monitoring cycle completed: {cycle_result['cycle_type']}")
        
        # Cleanup test directories
        import shutil
        for dir_path in [config["models_dir"], config["data_dir"], config["backup_dir"]]:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
        
        logger.info("✅ Automated retraining pipeline test completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Automated retraining pipeline test failed: {str(e)}")
        return False

async def test_mlops_integration():
    """Test integration of all MLOps components."""
    try:
        logger.info("Testing MLOps integration...")
        
        # Test individual components
        experiment_tracking_ok = await test_experiment_tracking()
        model_monitoring_ok = await test_model_monitoring()
        retraining_pipeline_ok = await test_automated_retraining()
        
        # Integration test
        if experiment_tracking_ok and model_monitoring_ok and retraining_pipeline_ok:
            logger.info("✅ All MLOps components working correctly")
            
            # Test configuration loading
            config_path = "config/mlops_config.yml"
            if os.path.exists(config_path):
                import yaml
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                logger.info("✅ MLOps configuration loaded successfully")
            else:
                logger.warning("⚠️  MLOps configuration file not found")
            
            return True
        else:
            logger.error("❌ Some MLOps components failed")
            return False
        
    except Exception as e:
        logger.error(f"❌ MLOps integration test failed: {str(e)}")
        return False

async def main():
    """Run all MLOps tests."""
    print("🚀 Starting MLOps Infrastructure Tests...\n")
    
    results = {
        "experiment_tracking": await test_experiment_tracking(),
        "model_monitoring": await test_model_monitoring(),
        "automated_retraining": await test_automated_retraining(),
        "integration": await test_mlops_integration()
    }
    
    print("\n📊 MLOps Test Results Summary:")
    print("==============================")
    print(f"Experiment Tracking: {'✅ PASS' if results['experiment_tracking'] else '❌ FAIL'}")
    print(f"Model Monitoring: {'✅ PASS' if results['model_monitoring'] else '❌ FAIL'}")
    print(f"Automated Retraining: {'✅ PASS' if results['automated_retraining'] else '❌ FAIL'}")
    print(f"Integration: {'✅ PASS' if results['integration'] else '❌ FAIL'}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All MLOps tests passed! Infrastructure is ready for production.")
        print("\n📋 Next Steps:")
        print("1. Set up MLflow server: mlflow server --backend-store-uri sqlite:///mlflow.db")
        print("2. Configure environment variables for ML_SERVICE_URL, MLFLOW_TRACKING_URI")
        print("3. Set up CI/CD pipeline with GitHub Actions")
        print("4. Configure monitoring alerts and notifications")
        print("5. Deploy to production environment")
    else:
        print("\n⚠️  Some tests failed. Please check the MLOps configuration and dependencies.")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)

