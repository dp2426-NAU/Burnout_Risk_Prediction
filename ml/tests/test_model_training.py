# Model training tests - Created by Balaji Koneti
import pytest
import numpy as np
import pandas as pd
from unittest.mock import Mock, patch
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import tempfile
import os

from src.train import TrainingService
from src.simple_model import BurnoutPredictionModel
from src.training.advanced_training_pipeline import AdvancedTrainingPipeline


class TestBurnoutPredictionModel:
    """Test the simple burnout prediction model."""
    
    def test_model_initialization(self):
        """Test model initialization."""
        model = BurnoutPredictionModel()
        assert model is not None
        assert hasattr(model, 'model')
        assert hasattr(model, 'scaler')
        assert hasattr(model, 'is_trained')
        assert model.is_trained is False
    
    def test_generate_synthetic_data(self):
        """Test synthetic data generation."""
        model = BurnoutPredictionModel()
        data = model.generate_synthetic_training_data(n_samples=100)
        
        assert isinstance(data, pd.DataFrame)
        assert len(data) == 100
        assert 'burnout_risk' in data.columns
        assert data['burnout_risk'].dtype == int
        assert set(data['burnout_risk'].unique()).issubset({0, 1})
    
    def test_synthetic_data_features(self):
        """Test that synthetic data has all required features."""
        model = BurnoutPredictionModel()
        data = model.generate_synthetic_training_data(n_samples=50)
        
        for feature in model.feature_names:
            assert feature in data.columns
            assert not data[feature].isnull().any()
    
    def test_synthetic_data_realistic_values(self):
        """Test that synthetic data has realistic value ranges."""
        model = BurnoutPredictionModel()
        data = model.generate_synthetic_training_data(n_samples=100)
        
        # Check work hours (should be reasonable)
        assert data['work_hours_per_week'].min() >= 0
        assert data['work_hours_per_week'].max() <= 100
        
        # Check stress level (1-10 scale)
        assert data['stress_level'].min() >= 1
        assert data['stress_level'].max() <= 10
        
        # Check workload score (1-10 scale)
        assert data['workload_score'].min() >= 1
        assert data['workload_score'].max() <= 10
        
        # Check work-life balance (1-10 scale)
        assert data['work_life_balance'].min() >= 1
        assert data['work_life_balance'].max() <= 10
    
    def test_model_training(self, sample_training_data):
        """Test model training process."""
        model = BurnoutPredictionModel()
        
        # Prepare training data
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        
        # Train model
        model.train(X, y)
        
        assert model.is_trained is True
        assert hasattr(model.model, 'predict')
        assert hasattr(model.scaler, 'transform')
    
    def test_model_prediction(self, sample_training_data):
        """Test model prediction."""
        model = BurnoutPredictionModel()
        
        # Prepare training data
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        
        # Train model
        model.train(X, y)
        
        # Test prediction
        predictions = model.predict(X.head(10))
        
        assert len(predictions) == 10
        assert all(pred in [0, 1] for pred in predictions)
    
    def test_model_evaluation(self, sample_training_data):
        """Test model evaluation metrics."""
        model = BurnoutPredictionModel()
        
        # Prepare training data
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        model.train(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        assert 0 <= accuracy <= 1
        assert 0 <= precision <= 1
        assert 0 <= recall <= 1
        assert 0 <= f1 <= 1
    
    def test_model_save_load(self, sample_training_data):
        """Test model saving and loading."""
        model = BurnoutPredictionModel()
        
        # Prepare and train model
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        model.train(X, y)
        
        # Save model
        with tempfile.NamedTemporaryFile(suffix='.pkl', delete=False) as tmp_file:
            model.save_model(tmp_file.name)
            
            # Load model
            loaded_model = BurnoutPredictionModel()
            loaded_model.load_model(tmp_file.name)
            
            # Test that loaded model works
            predictions = loaded_model.predict(X.head(5))
            assert len(predictions) == 5
            assert all(pred in [0, 1] for pred in predictions)
            
            # Clean up
            os.unlink(tmp_file.name)


class TestTrainingService:
    """Test the training service."""
    
    @pytest.mark.asyncio
    async def test_initialization(self):
        """Test training service initialization."""
        service = TrainingService()
        await service.initialize()
        assert service is not None
        assert hasattr(service, 'training_jobs')
        assert hasattr(service, 'models_dir')
    
    @pytest.mark.asyncio
    async def test_start_training(self):
        """Test starting a training job."""
        service = TrainingService()
        await service.initialize()
        
        # Mock the training process
        with patch.object(service, '_train_model') as mock_train:
            mock_train.return_value = None
            
            training_id = await service.start_training(
                dataset_path='test_data.csv',
                model_type='baseline'
            )
            
            assert training_id is not None
            assert training_id in service.training_jobs
            assert service.training_jobs[training_id]['status'] == 'started'
    
    @pytest.mark.asyncio
    async def test_get_training_status(self):
        """Test getting training status."""
        service = TrainingService()
        await service.initialize()
        
        # Add a mock training job
        training_id = 'test_training_123'
        service.training_jobs[training_id] = {
            'status': 'completed',
            'progress': 100,
            'metrics': {'accuracy': 0.85, 'f1_score': 0.82},
            'model_version': '1.0.0',
            'start_time': '2024-01-01T10:00:00Z',
            'end_time': '2024-01-01T10:30:00Z'
        }
        
        status = await service.get_training_status(training_id)
        
        assert status['status'] == 'completed'
        assert status['progress'] == 100
        assert 'accuracy' in status['metrics']
    
    @pytest.mark.asyncio
    async def test_get_training_status_not_found(self):
        """Test getting status for non-existent training job."""
        service = TrainingService()
        await service.initialize()
        
        with pytest.raises(ValueError, match="Training job not found"):
            await service.get_training_status('non_existent_id')
    
    @pytest.mark.asyncio
    async def test_cleanup(self):
        """Test training service cleanup."""
        service = TrainingService()
        await service.initialize()
        
        # Add some mock jobs
        service.training_jobs['job1'] = {'status': 'completed'}
        service.training_jobs['job2'] = {'status': 'running'}
        
        await service.cleanup()
        
        # Cleanup should clear completed jobs but keep running ones
        assert 'job1' not in service.training_jobs
        assert 'job2' in service.training_jobs


class TestAdvancedTrainingPipeline:
    """Test the advanced training pipeline."""
    
    def test_initialization(self):
        """Test advanced pipeline initialization."""
        pipeline = AdvancedTrainingPipeline()
        assert pipeline is not None
        assert hasattr(pipeline, 'feature_pipeline')
        assert hasattr(pipeline, 'model_trainer')
        assert hasattr(pipeline, 'evaluator')
    
    @pytest.mark.asyncio
    async def test_train_comprehensive_model(self, sample_training_data):
        """Test comprehensive model training."""
        pipeline = AdvancedTrainingPipeline()
        
        # Mock the components
        pipeline.feature_pipeline.extract_features = pytest.AsyncMock(
            return_value=sample_training_data
        )
        pipeline.model_trainer.train_models = pytest.AsyncMock(
            return_value={'best_model': 'rf_model', 'metrics': {'accuracy': 0.85}}
        )
        pipeline.evaluator.evaluate_models = pytest.AsyncMock(
            return_value={'rf_model': {'accuracy': 0.85, 'f1_score': 0.82}}
        )
        
        result = await pipeline.train_comprehensive_model(
            user_ids=['user1', 'user2'],
            lookback_days=30,
            optimization_enabled=True
        )
        
        assert 'best_model' in result
        assert 'metrics' in result
        assert result['metrics']['accuracy'] == 0.85
    
    @pytest.mark.asyncio
    async def test_hyperparameter_optimization(self, sample_training_data):
        """Test hyperparameter optimization."""
        pipeline = AdvancedTrainingPipeline()
        
        # Mock optimization
        pipeline.optimizer.optimize = pytest.AsyncMock(
            return_value={'best_params': {'n_estimators': 200, 'max_depth': 10}}
        )
        
        result = await pipeline._optimize_hyperparameters(
            X_train=sample_training_data.drop('burnout_risk', axis=1),
            y_train=sample_training_data['burnout_risk']
        )
        
        assert 'best_params' in result
        assert result['best_params']['n_estimators'] == 200
    
    @pytest.mark.asyncio
    async def test_model_ensemble(self, sample_training_data):
        """Test model ensemble creation."""
        pipeline = AdvancedTrainingPipeline()
        
        # Mock individual models
        mock_models = {
            'rf': Mock(),
            'gb': Mock(),
            'svm': Mock()
        }
        
        for model in mock_models.values():
            model.predict_proba.return_value = np.array([[0.3, 0.7], [0.8, 0.2]])
        
        pipeline._create_ensemble(mock_models)
        
        # Test ensemble prediction
        X_test = sample_training_data.drop('burnout_risk', axis=1).head(2)
        predictions = pipeline.ensemble.predict(X_test)
        
        assert len(predictions) == 2
        assert all(pred in [0, 1] for pred in predictions)


class TestModelValidation:
    """Test model validation and quality checks."""
    
    def test_cross_validation(self, sample_training_data):
        """Test cross-validation."""
        from sklearn.model_selection import cross_val_score
        from sklearn.ensemble import RandomForestClassifier
        
        X = sample_training_data.drop('burnout_risk', axis=1)
        y = sample_training_data['burnout_risk']
        
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
        
        assert len(scores) == 5
        assert all(0 <= score <= 1 for score in scores)
        assert np.mean(scores) > 0.5  # Should be better than random
    
    def test_feature_importance(self, sample_training_data):
        """Test feature importance calculation."""
        model = BurnoutPredictionModel()
        
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        
        model.train(X, y)
        importance = model.get_feature_importance()
        
        assert len(importance) == len(model.feature_names)
        assert all(imp >= 0 for imp in importance.values())
        assert abs(sum(importance.values()) - 1.0) < 0.01  # Should sum to 1
    
    def test_model_performance_thresholds(self, sample_training_data):
        """Test that model meets performance thresholds."""
        model = BurnoutPredictionModel()
        
        X = sample_training_data[model.feature_names]
        y = sample_training_data['burnout_risk']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        model.train(X_train, y_train)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Model should meet minimum performance thresholds
        assert accuracy >= 0.6  # At least 60% accuracy
        assert f1 >= 0.5  # At least 0.5 F1 score


@pytest.mark.integration
class TestTrainingIntegration:
    """Integration tests for the complete training pipeline."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_training(self, sample_training_data):
        """Test complete end-to-end training process."""
        service = TrainingService()
        await service.initialize()
        
        # Mock data loading
        with patch('pandas.read_csv', return_value=sample_training_data):
            training_id = await service.start_training(
                dataset_path='test_data.csv',
                model_type='comprehensive'
            )
            
            # Wait for training to complete (mocked)
            await service._train_model(training_id)
            
            # Check training results
            status = await service.get_training_status(training_id)
            assert status['status'] == 'completed'
            assert 'metrics' in status
            assert 'accuracy' in status['metrics']
    
    @pytest.mark.asyncio
    async def test_model_versioning(self):
        """Test model versioning system."""
        service = TrainingService()
        await service.initialize()
        
        # Mock training completion
        training_id = 'test_training_456'
        service.training_jobs[training_id] = {
            'status': 'completed',
            'model_version': '1.0.0',
            'metrics': {'accuracy': 0.85}
        }
        
        # Test model versioning
        version = service._generate_model_version(training_id)
        assert version.startswith('comprehensive_')
        assert '1.0.0' in version or 'latest' in version
    
    @pytest.mark.asyncio
    async def test_training_error_handling(self):
        """Test training error handling."""
        service = TrainingService()
        await service.initialize()
        
        # Mock training to fail
        with patch.object(service, '_train_model', side_effect=Exception("Training failed")):
            training_id = await service.start_training(
                dataset_path='test_data.csv',
                model_type='baseline'
            )
            
            # Training should handle errors gracefully
            status = await service.get_training_status(training_id)
            assert status['status'] in ['failed', 'error']
