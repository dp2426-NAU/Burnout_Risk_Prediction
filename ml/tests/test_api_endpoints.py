# API endpoint tests - Created by Balaji Koneti
import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json

from src.main import app
from src.predict import PredictionService
from src.train import TrainingService
from src.evaluate import EvaluationService


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Burnout Risk Prediction ML Service"
        assert data["version"] == "1.0.0"
        assert data["author"] == "Balaji Koneti"
        assert data["status"] == "running"
    
    def test_health_check(self):
        """Test health check endpoint."""
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ml-service"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data


class TestPredictionEndpoints:
    """Test prediction endpoints."""
    
    def test_predict_burnout_risk_success(self, sample_prediction_request, sample_prediction_response):
        """Test successful burnout risk prediction."""
        client = TestClient(app)
        
        with patch.object(PredictionService, 'predict', return_value=sample_prediction_response):
            response = client.post("/predict", json=sample_prediction_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["prediction_id"] == "pred_123"
            assert data["user_id"] == "test_user_123"
            assert data["risk_level"] == "medium"
            assert data["risk_score"] == 0.65
            assert data["confidence"] == 0.85
    
    def test_predict_burnout_risk_invalid_data(self):
        """Test prediction with invalid data."""
        client = TestClient(app)
        
        invalid_request = {
            "user_id": "",  # Empty user ID
            "features": {},  # Empty features
        }
        
        response = client.post("/predict", json=invalid_request)
        assert response.status_code == 422  # Validation error
    
    def test_predict_burnout_risk_missing_features(self):
        """Test prediction with missing required features."""
        client = TestClient(app)
        
        incomplete_request = {
            "user_id": "test_user_123",
            # Missing features
        }
        
        response = client.post("/predict", json=incomplete_request)
        assert response.status_code == 422  # Validation error
    
    def test_predict_burnout_risk_service_error(self, sample_prediction_request):
        """Test prediction when service fails."""
        client = TestClient(app)
        
        with patch.object(PredictionService, 'predict', side_effect=Exception("Service error")):
            response = client.post("/predict", json=sample_prediction_request)
            
            assert response.status_code == 500
            data = response.json()
            assert "Prediction failed" in data["detail"]
    
    def test_get_user_predictions(self):
        """Test getting user prediction history."""
        client = TestClient(app)
        
        mock_predictions = [
            {
                "prediction_id": "pred_1",
                "risk_level": "low",
                "risk_score": 0.3,
                "prediction_date": "2024-01-01T10:00:00Z"
            },
            {
                "prediction_id": "pred_2", 
                "risk_level": "medium",
                "risk_score": 0.6,
                "prediction_date": "2024-01-02T10:00:00Z"
            }
        ]
        
        with patch.object(PredictionService, 'get_user_predictions', return_value=mock_predictions):
            response = client.get("/predictions/test_user_123?limit=10")
            
            assert response.status_code == 200
            data = response.json()
            assert "predictions" in data
            assert len(data["predictions"]) == 2
    
    def test_get_user_predictions_invalid_limit(self):
        """Test getting predictions with invalid limit."""
        client = TestClient(app)
        
        response = client.get("/predictions/test_user_123?limit=1000")  # Too high
        assert response.status_code == 422  # Validation error


class TestTrainingEndpoints:
    """Test training endpoints."""
    
    def test_start_training_success(self):
        """Test successful training start."""
        client = TestClient(app)
        
        training_request = {
            "dataset_path": "data/training_data.csv",
            "model_type": "comprehensive",
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 10
            }
        }
        
        with patch.object(TrainingService, 'start_training', return_value="training_123"):
            response = client.post("/train", json=training_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["training_id"] == "training_123"
            assert data["status"] == "started"
            assert "model_version" in data
            assert "metrics" in data
    
    def test_start_training_invalid_dataset(self):
        """Test training with invalid dataset path."""
        client = TestClient(app)
        
        invalid_request = {
            "dataset_path": "",  # Empty path
            "model_type": "baseline"
        }
        
        response = client.post("/train", json=invalid_request)
        assert response.status_code == 422  # Validation error
    
    def test_start_training_service_error(self):
        """Test training when service fails."""
        client = TestClient(app)
        
        training_request = {
            "dataset_path": "data/training_data.csv",
            "model_type": "baseline"
        }
        
        with patch.object(TrainingService, 'start_training', side_effect=Exception("Training error")):
            response = client.post("/train", json=training_request)
            
            assert response.status_code == 500
            data = response.json()
            assert "Training failed to start" in data["detail"]
    
    def test_get_training_status_success(self):
        """Test getting training status."""
        client = TestClient(app)
        
        mock_status = {
            "training_id": "training_123",
            "status": "completed",
            "progress": 100,
            "metrics": {"accuracy": 0.85, "f1_score": 0.82},
            "model_version": "1.0.0",
            "start_time": "2024-01-01T10:00:00Z",
            "end_time": "2024-01-01T10:30:00Z"
        }
        
        with patch.object(TrainingService, 'get_training_status', return_value=mock_status):
            response = client.get("/training/training_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            assert data["progress"] == 100
            assert "accuracy" in data["metrics"]
    
    def test_get_training_status_not_found(self):
        """Test getting status for non-existent training."""
        client = TestClient(app)
        
        with patch.object(TrainingService, 'get_training_status', side_effect=ValueError("Training job not found")):
            response = client.get("/training/non_existent_id")
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to retrieve training status" in data["detail"]


class TestEvaluationEndpoints:
    """Test evaluation endpoints."""
    
    def test_evaluate_model_success(self):
        """Test successful model evaluation."""
        client = TestClient(app)
        
        evaluation_request = {
            "model_version": "1.0.0",
            "test_dataset_path": "data/test_data.csv"
        }
        
        mock_evaluation = {
            "evaluation_id": "eval_123",
            "model_version": "1.0.0",
            "metrics": {
                "accuracy": 0.85,
                "precision": 0.82,
                "recall": 0.88,
                "f1_score": 0.85
            },
            "evaluation_date": "2024-01-01T10:00:00Z"
        }
        
        with patch.object(EvaluationService, 'evaluate', return_value=mock_evaluation):
            response = client.post("/evaluate", json=evaluation_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["evaluation_id"] == "eval_123"
            assert data["model_version"] == "1.0.0"
            assert "accuracy" in data["metrics"]
    
    def test_evaluate_model_invalid_version(self):
        """Test evaluation with invalid model version."""
        client = TestClient(app)
        
        invalid_request = {
            "model_version": "",  # Empty version
            "test_dataset_path": "data/test_data.csv"
        }
        
        response = client.post("/evaluate", json=invalid_request)
        assert response.status_code == 422  # Validation error
    
    def test_evaluate_model_service_error(self):
        """Test evaluation when service fails."""
        client = TestClient(app)
        
        evaluation_request = {
            "model_version": "1.0.0",
            "test_dataset_path": "data/test_data.csv"
        }
        
        with patch.object(EvaluationService, 'evaluate', side_effect=Exception("Evaluation error")):
            response = client.post("/evaluate", json=evaluation_request)
            
            assert response.status_code == 500
            data = response.json()
            assert "Evaluation failed" in data["detail"]


class TestModelManagementEndpoints:
    """Test model management endpoints."""
    
    def test_list_models_success(self):
        """Test listing available models."""
        client = TestClient(app)
        
        mock_models = [
            {"version": "1.0.0", "status": "active", "accuracy": 0.85},
            {"version": "0.9.0", "status": "archived", "accuracy": 0.82}
        ]
        
        with patch.object(PredictionService, 'list_models', return_value=mock_models):
            response = client.get("/models")
            
            assert response.status_code == 200
            data = response.json()
            assert "models" in data
            assert len(data["models"]) == 2
    
    def test_get_model_info_success(self):
        """Test getting specific model information."""
        client = TestClient(app)
        
        mock_model_info = {
            "version": "1.0.0",
            "status": "active",
            "accuracy": 0.85,
            "created_at": "2024-01-01T10:00:00Z",
            "features": ["work_hours", "stress_level", "workload"]
        }
        
        with patch.object(PredictionService, 'get_model_info', return_value=mock_model_info):
            response = client.get("/models/1.0.0")
            
            assert response.status_code == 200
            data = response.json()
            assert data["version"] == "1.0.0"
            assert data["status"] == "active"
            assert data["accuracy"] == 0.85
    
    def test_get_model_info_not_found(self):
        """Test getting info for non-existent model."""
        client = TestClient(app)
        
        with patch.object(PredictionService, 'get_model_info', side_effect=ValueError("Model not found")):
            response = client.get("/models/non_existent")
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to retrieve model info" in data["detail"]


class TestDataPipelineEndpoints:
    """Test data pipeline endpoints."""
    
    def test_collect_user_data_success(self):
        """Test successful user data collection."""
        client = TestClient(app)
        
        collection_request = {
            "user_id": "test_user_123",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "data_types": ["calendar", "email"],
            "validate_data": True
        }
        
        mock_result = {
            "success": True,
            "message": "Data collection completed",
            "results": {
                "calendar": {"events_collected": 25, "version_id": "cal_v1"},
                "email": {"messages_collected": 150, "version_id": "email_v1"}
            }
        }
        
        with patch('src.data_pipeline.orchestrator.DataPipelineOrchestrator.run_user_data_pipeline', return_value=mock_result):
            response = client.post("/data-pipeline/collect-user-data", json=collection_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "calendar" in data["results"]
            assert "email" in data["results"]
    
    def test_collect_batch_data_success(self):
        """Test successful batch data collection."""
        client = TestClient(app)
        
        batch_request = {
            "user_ids": ["user1", "user2", "user3"],
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "data_types": ["calendar", "email"],
            "validate_data": True,
            "max_concurrent": 3
        }
        
        mock_result = {
            "success": True,
            "batch_id": "batch_123",
            "user_results": {
                "user1": {"success": True, "events_collected": 20},
                "user2": {"success": True, "events_collected": 25},
                "user3": {"success": True, "events_collected": 18}
            },
            "summary": {
                "successful": 3,
                "failed": 0,
                "total_duration_seconds": 45
            }
        }
        
        with patch('src.data_pipeline.orchestrator.DataPipelineOrchestrator.run_batch_data_pipeline', return_value=mock_result):
            response = client.post("/data-pipeline/collect-batch-data", json=batch_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["batch_id"] == "batch_123"
            assert data["summary"]["successful"] == 3
    
    def test_scheduled_collection_success(self):
        """Test successful scheduled data collection."""
        client = TestClient(app)
        
        scheduled_request = {
            "days_back": 7,
            "user_ids": ["user1", "user2"]
        }
        
        mock_result = {
            "success": True,
            "message": "Scheduled collection completed",
            "users_processed": 2,
            "total_records": 500
        }
        
        with patch('src.data_pipeline.orchestrator.DataPipelineOrchestrator.run_scheduled_pipeline', return_value=mock_result):
            response = client.post("/data-pipeline/scheduled-collection", json=scheduled_request)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["users_processed"] == 2
    
    def test_get_pipeline_status(self):
        """Test getting pipeline status."""
        client = TestClient(app)
        
        mock_status = {
            "status": "running",
            "active_jobs": 2,
            "completed_jobs": 15,
            "failed_jobs": 1,
            "last_run": "2024-01-01T10:00:00Z"
        }
        
        with patch('src.data_pipeline.orchestrator.DataPipelineOrchestrator.get_pipeline_status', return_value=mock_status):
            response = client.get("/data-pipeline/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "running"
            assert data["active_jobs"] == 2
    
    def test_cleanup_old_data(self):
        """Test data cleanup."""
        client = TestClient(app)
        
        with patch('src.data_pipeline.orchestrator.DataPipelineOrchestrator.cleanup_old_data', return_value=None):
            response = client.post("/data-pipeline/cleanup?keep_days=30")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["keep_days"] == 30


class TestErrorHandling:
    """Test error handling across endpoints."""
    
    def test_invalid_json(self):
        """Test handling of invalid JSON."""
        client = TestClient(app)
        
        response = client.post("/predict", data="invalid json")
        assert response.status_code == 422
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        client = TestClient(app)
        
        incomplete_request = {
            "user_id": "test_user"
            # Missing features
        }
        
        response = client.post("/predict", json=incomplete_request)
        assert response.status_code == 422
    
    def test_large_request_handling(self):
        """Test handling of large requests."""
        client = TestClient(app)
        
        large_request = {
            "user_id": "test_user",
            "features": {f"feature_{i}": i for i in range(1000)}  # Large feature set
        }
        
        # Should handle large requests gracefully
        response = client.post("/predict", json=large_request)
        assert response.status_code in [200, 413, 422]  # Success, too large, or validation error


@pytest.mark.integration
class TestAPIIntegration:
    """Integration tests for API endpoints."""
    
    def test_prediction_workflow(self, sample_prediction_request, sample_prediction_response):
        """Test complete prediction workflow."""
        client = TestClient(app)
        
        with patch.object(PredictionService, 'predict', return_value=sample_prediction_response):
            # Make prediction
            response = client.post("/predict", json=sample_prediction_request)
            assert response.status_code == 200
            
            # Get prediction history
            response = client.get(f"/predictions/{sample_prediction_request['user_id']}")
            assert response.status_code == 200
    
    def test_training_evaluation_workflow(self):
        """Test complete training and evaluation workflow."""
        client = TestClient(app)
        
        # Start training
        training_request = {
            "dataset_path": "data/training_data.csv",
            "model_type": "comprehensive"
        }
        
        with patch.object(TrainingService, 'start_training', return_value="training_123"):
            response = client.post("/train", json=training_request)
            assert response.status_code == 200
            training_id = response.json()["training_id"]
        
        # Check training status
        with patch.object(TrainingService, 'get_training_status', return_value={
            "status": "completed",
            "model_version": "1.0.0",
            "metrics": {"accuracy": 0.85}
        }):
            response = client.get(f"/training/{training_id}")
            assert response.status_code == 200
        
        # Evaluate model
        evaluation_request = {
            "model_version": "1.0.0",
            "test_dataset_path": "data/test_data.csv"
        }
        
        with patch.object(EvaluationService, 'evaluate', return_value={
            "evaluation_id": "eval_123",
            "model_version": "1.0.0",
            "metrics": {"accuracy": 0.85}
        }):
            response = client.post("/evaluate", json=evaluation_request)
            assert response.status_code == 200
