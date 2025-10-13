# Pytest configuration and fixtures - Created by Balaji Koneti
import pytest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def sample_calendar_data():
    """Sample calendar data for testing."""
    return pd.DataFrame({
        'user_id': ['user1', 'user1', 'user1', 'user2', 'user2'],
        'event_id': ['evt1', 'evt2', 'evt3', 'evt4', 'evt5'],
        'title': ['Meeting', 'Focus Time', 'Break', 'Meeting', 'Lunch'],
        'start_time': [
            datetime(2024, 1, 1, 9, 0),
            datetime(2024, 1, 1, 10, 0),
            datetime(2024, 1, 1, 12, 0),
            datetime(2024, 1, 1, 14, 0),
            datetime(2024, 1, 1, 12, 0)
        ],
        'end_time': [
            datetime(2024, 1, 1, 10, 0),
            datetime(2024, 1, 1, 12, 0),
            datetime(2024, 1, 1, 12, 30),
            datetime(2024, 1, 1, 15, 0),
            datetime(2024, 1, 1, 13, 0)
        ],
        'event_type': ['meeting', 'focus_time', 'break', 'meeting', 'personal'],
        'is_virtual': [True, False, False, True, False],
        'stress_level': [3, 2, 1, 4, 1],
        'workload': [4, 3, 1, 5, 1]
    })

@pytest.fixture
def sample_email_data():
    """Sample email data for testing."""
    return pd.DataFrame({
        'user_id': ['user1', 'user1', 'user2', 'user2'],
        'message_id': ['msg1', 'msg2', 'msg3', 'msg4'],
        'sender': ['user1@example.com', 'user1@example.com', 'user2@example.com', 'user2@example.com'],
        'recipients': [['colleague@example.com'], ['team@example.com'], ['manager@example.com'], ['client@example.com']],
        'subject': ['Project Update', 'Urgent: Deadline', 'Status Report', 'Meeting Notes'],
        'body': [
            'Here is the latest project update. Everything is going well.',
            'We need to finish this by tomorrow. This is urgent!',
            'The project is on track and we are meeting our goals.',
            'Here are the notes from our meeting today.'
        ],
        'timestamp': [
            datetime(2024, 1, 1, 10, 0),
            datetime(2024, 1, 1, 11, 0),
            datetime(2024, 1, 1, 15, 0),
            datetime(2024, 1, 1, 16, 0)
        ],
        'is_sent': [True, True, True, True],
        'is_urgent': [False, True, False, False],
        'word_count': [15, 12, 18, 20],
        'sentiment_score': [0.2, -0.5, 0.3, 0.1]
    })

@pytest.fixture
def sample_features():
    """Sample extracted features for testing."""
    return {
        'work_hours': 45.0,
        'overtime_hours': 5.0,
        'weekend_work': 2.0,
        'early_morning_work': 1.0,
        'late_night_work': 0.0,
        'meeting_count': 8,
        'meeting_duration': 12.0,
        'back_to_back_meetings': 2,
        'virtual_meetings': 6,
        'email_count': 25,
        'avg_email_length': 15.5,
        'stress_email_count': 3,
        'urgent_email_count': 2,
        'response_time': 2.5,
        'total_events': 12,
        'avg_event_duration': 1.5,
        'focus_time_ratio': 0.3,
        'break_time_ratio': 0.1,
        'stress_level': 4.0,
        'workload_level': 5.0,
        'work_life_balance': 6.0,
        'social_interaction': 7.0,
        'team_collaboration': 8.0,
        'sleep_quality': 6.0,
        'exercise_frequency': 4.0,
        'nutrition_quality': 7.0
    }

@pytest.fixture
def sample_training_data():
    """Sample training data for model testing."""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    features = {
        'work_hours_per_week': np.random.normal(40, 10, n_samples),
        'meeting_hours_per_week': np.random.normal(8, 3, n_samples),
        'email_count_per_day': np.random.poisson(15, n_samples),
        'stress_level': np.random.uniform(1, 10, n_samples),
        'workload_score': np.random.uniform(1, 10, n_samples),
        'work_life_balance': np.random.uniform(1, 10, n_samples),
        'overtime_hours': np.random.exponential(5, n_samples),
        'deadline_pressure': np.random.uniform(1, 10, n_samples),
        'team_size': np.random.poisson(8, n_samples),
        'remote_work_percentage': np.random.uniform(0, 100, n_samples)
    }
    
    # Generate target variable based on features
    burnout_score = (
        (features['work_hours_per_week'] - 40) / 40 * 0.2 +
        (features['stress_level'] - 5) / 5 * 0.25 +
        (features['workload_score'] - 5) / 5 * 0.2 +
        (5 - features['work_life_balance']) / 5 * 0.15 +
        features['overtime_hours'] / 20 * 0.1 +
        (features['deadline_pressure'] - 5) / 5 * 0.1
    )
    
    # Add noise
    burnout_score += np.random.normal(0, 0.1, n_samples)
    
    # Convert to binary classification
    features['burnout_risk'] = (burnout_score > 0.5).astype(int)
    
    return pd.DataFrame(features)

@pytest.fixture
def mock_ml_service():
    """Mock ML service for testing."""
    mock_service = Mock()
    mock_service.predict = AsyncMock()
    mock_service.train = AsyncMock()
    mock_service.evaluate = AsyncMock()
    return mock_service

@pytest.fixture
def mock_database():
    """Mock database connection for testing."""
    mock_db = Mock()
    mock_db.users = Mock()
    mock_db.calendar_events = Mock()
    mock_db.email_messages = Mock()
    mock_db.predictions = Mock()
    return mock_db

@pytest.fixture
def sample_prediction_request():
    """Sample prediction request for testing."""
    return {
        'user_id': 'test_user_123',
        'features': {
            'work_hours_per_week': 45,
            'stress_level': 7,
            'workload_score': 8,
            'work_life_balance': 5,
            'overtime_hours': 5,
            'deadline_pressure': 6,
            'team_size': 8,
            'remote_work_percentage': 80
        },
        'model_version': 'latest'
    }

@pytest.fixture
def sample_prediction_response():
    """Sample prediction response for testing."""
    return {
        'prediction_id': 'pred_123',
        'user_id': 'test_user_123',
        'risk_level': 'medium',
        'risk_score': 0.65,
        'confidence': 0.85,
        'factors': {
            'workload': 8,
            'stress_level': 7,
            'work_life_balance': 5
        },
        'recommendations': [
            'Take regular breaks',
            'Consider reducing meeting frequency',
            'Improve work-life balance'
        ],
        'model_version': '1.0.0',
        'prediction_date': datetime.now()
    }

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'user_id': 'test_user_123',
        'email': 'test@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'role': 'user',
        'department': 'Engineering',
        'team_size': 8,
        'experience_years': 5,
        'is_active': True,
        'created_at': datetime.now() - timedelta(days=30),
        'last_login': datetime.now() - timedelta(hours=2)
    }
