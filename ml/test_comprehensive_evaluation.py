#!/usr/bin/env python3
# Test Comprehensive Evaluation Framework - Created by Balaji Koneti
"""
Test script for the comprehensive evaluation framework.
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_comprehensive_evaluation():
    """Test the comprehensive evaluation framework."""
    try:
        logger.info("Starting comprehensive evaluation framework test...")
        
        # Import evaluation components
        from src.evaluation.comprehensive_evaluator import ComprehensiveEvaluator
        from src.evaluation.metrics import AdvancedMetrics
        from src.evaluation.shap_analysis import SHAPAnalyzer
        from src.evaluate import EvaluationService
        
        # Generate synthetic test data
        logger.info("Generating synthetic test data...")
        X, y = make_classification(
            n_samples=1000,
            n_features=10,
            n_informative=8,
            n_redundant=2,
            n_classes=2,
            random_state=42
        )
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train a simple model
        logger.info("Training test model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Test individual components
        logger.info("Testing individual evaluation components...")
        
        # Test AdvancedMetrics
        advanced_metrics = AdvancedMetrics()
        await advanced_metrics.initialize()
        
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        metrics = await advanced_metrics.calculate_metrics(
            y_test, y_pred, y_pred_proba, target_recall=0.85
        )
        
        logger.info(f"Advanced metrics calculated: {list(metrics.keys())}")
        
        # Test SHAPAnalyzer
        shap_analyzer = SHAPAnalyzer()
        await shap_analyzer.initialize()
        
        feature_names = [f"feature_{i}" for i in range(X_test.shape[1])]
        shap_results = await shap_analyzer.analyze_model(
            model, X_test[:100], feature_names  # Use subset for faster testing
        )
        
        logger.info(f"SHAP analysis completed: {list(shap_results.keys())}")
        
        # Test ComprehensiveEvaluator
        comprehensive_evaluator = ComprehensiveEvaluator()
        await comprehensive_evaluator.initialize()
        
        evaluation_results = await comprehensive_evaluator.evaluate_model(
            model=model,
            X_test=X_test,
            y_test=y_test,
            y_pred=y_pred,
            y_pred_proba=y_pred_proba,
            target_recall=0.85
        )
        
        logger.info(f"Comprehensive evaluation completed: {list(evaluation_results.keys())}")
        
        # Test EvaluationService
        evaluation_service = EvaluationService()
        await evaluation_service.initialize()
        
        # Save test data for evaluation service
        test_data_path = "test_data.csv"
        test_df = pd.DataFrame(X_test, columns=feature_names)
        test_df['burnout_risk'] = y_test
        test_df.to_csv(test_data_path, index=False)
        
        # Save model for evaluation service
        import joblib
        model_path = "models/test_model.joblib"
        import os
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, model_path)
        
        # Run comprehensive evaluation
        evaluation_result = await evaluation_service.evaluate(
            model_version="test_model",
            test_dataset_path=test_data_path,
            include_shap=True,
            target_recall=0.85
        )
        
        logger.info(f"Evaluation service test completed: {evaluation_result['evaluation_id']}")
        
        # Print summary
        print("\n" + "="*60)
        print("COMPREHENSIVE EVALUATION FRAMEWORK TEST RESULTS")
        print("="*60)
        
        print(f"\nModel Performance:")
        print(f"  Accuracy: {evaluation_result['metrics']['accuracy']:.3f}")
        print(f"  Recall: {evaluation_result['metrics']['recall']:.3f}")
        print(f"  F1 Score: {evaluation_result['metrics']['f1_score']:.3f}")
        print(f"  ROC AUC: {evaluation_result['metrics']['roc_auc']:.3f}")
        
        print(f"\nBusiness Metrics:")
        business_metrics = evaluation_result['business_metrics']
        print(f"  High Risk Percentage: {business_metrics['high_risk_percentage']:.1f}%")
        print(f"  Cost per Prediction: ${business_metrics['cost_per_prediction']:.2f}")
        
        print(f"\nEvaluation Summary:")
        summary = evaluation_result['evaluation_summary']
        print(f"  Performance Grade: {summary['performance_grade']}")
        print(f"  Recommendation: {summary['recommendation']}")
        print(f"  Target Recall Met: {summary['target_recall_met']}")
        
        if summary['strengths']:
            print(f"  Strengths: {', '.join(summary['strengths'])}")
        if summary['weaknesses']:
            print(f"  Weaknesses: {', '.join(summary['weaknesses'])}")
        
        print(f"\nSHAP Analysis:")
        if 'error' not in evaluation_result['shap_analysis']:
            print("  SHAP analysis completed successfully")
            print(f"  Feature importance calculated for {len(feature_names)} features")
        else:
            print(f"  SHAP analysis failed: {evaluation_result['shap_analysis']['error']}")
        
        print("\n" + "="*60)
        print("TEST COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        # Cleanup
        if os.path.exists(test_data_path):
            os.remove(test_data_path)
        if os.path.exists(model_path):
            os.remove(model_path)
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_comprehensive_evaluation())
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Tests failed!")
        exit(1)

