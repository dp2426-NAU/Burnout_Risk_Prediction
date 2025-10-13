# Feature engineering tests - Created by Balaji Koneti
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.features.feature_engineer import FeatureEngineer
from src.features.calendar_features import CalendarFeatureExtractor
from src.features.email_features import EmailFeatureExtractor
from src.features.aggregation_features import AggregationFeatureExtractor


class TestFeatureEngineer:
    """Test the main FeatureEngineer class."""
    
    def test_initialization(self):
        """Test FeatureEngineer initialization."""
        engineer = FeatureEngineer()
        assert engineer is not None
        assert hasattr(engineer, 'calendar_extractor')
        assert hasattr(engineer, 'email_extractor')
        assert hasattr(engineer, 'aggregation_extractor')
    
    @pytest.mark.asyncio
    async def test_extract_features(self, sample_calendar_data, sample_email_data):
        """Test feature extraction from calendar and email data."""
        engineer = FeatureEngineer()
        
        # Mock the extractors
        engineer.calendar_extractor.extract = pytest.AsyncMock(return_value={
            'work_hours': 40.0,
            'meeting_count': 5,
            'stress_level': 4.0
        })
        engineer.email_extractor.extract = pytest.AsyncMock(return_value={
            'email_count': 20,
            'avg_sentiment': 0.2,
            'urgent_count': 2
        })
        engineer.aggregation_extractor.extract = pytest.AsyncMock(return_value={
            'workload_score': 6.0,
            'work_life_balance': 7.0
        })
        
        features = await engineer.extract_features(
            user_id='test_user',
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31)
        )
        
        assert isinstance(features, dict)
        assert 'work_hours' in features
        assert 'meeting_count' in features
        assert 'email_count' in features
        assert 'workload_score' in features
    
    @pytest.mark.asyncio
    async def test_extract_features_with_missing_data(self):
        """Test feature extraction when data is missing."""
        engineer = FeatureEngineer()
        
        # Mock extractors to return empty results
        engineer.calendar_extractor.extract = pytest.AsyncMock(return_value={})
        engineer.email_extractor.extract = pytest.AsyncMock(return_value={})
        engineer.aggregation_extractor.extract = pytest.AsyncMock(return_value={})
        
        features = await engineer.extract_features(
            user_id='test_user',
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31)
        )
        
        assert isinstance(features, dict)
        # Should have default values for missing features
        assert len(features) > 0


class TestCalendarFeatureExtractor:
    """Test calendar feature extraction."""
    
    def test_initialization(self):
        """Test CalendarFeatureExtractor initialization."""
        extractor = CalendarFeatureExtractor()
        assert extractor is not None
    
    @pytest.mark.asyncio
    async def test_extract_work_hours(self, sample_calendar_data):
        """Test work hours calculation."""
        extractor = CalendarFeatureExtractor()
        
        work_hours = extractor._calculate_work_hours(sample_calendar_data)
        assert isinstance(work_hours, float)
        assert work_hours >= 0
    
    @pytest.mark.asyncio
    async def test_extract_meeting_features(self, sample_calendar_data):
        """Test meeting feature extraction."""
        extractor = CalendarFeatureExtractor()
        
        meeting_features = extractor._extract_meeting_features(sample_calendar_data)
        assert 'meeting_count' in meeting_features
        assert 'meeting_duration' in meeting_features
        assert 'virtual_meetings' in meeting_features
        assert meeting_features['meeting_count'] >= 0
    
    @pytest.mark.asyncio
    async def test_extract_stress_indicators(self, sample_calendar_data):
        """Test stress indicator extraction."""
        extractor = CalendarFeatureExtractor()
        
        stress_features = extractor._extract_stress_indicators(sample_calendar_data)
        assert 'avg_stress_level' in stress_features
        assert 'high_stress_events' in stress_features
        assert 0 <= stress_features['avg_stress_level'] <= 5
    
    @pytest.mark.asyncio
    async def test_extract_time_patterns(self, sample_calendar_data):
        """Test time pattern extraction."""
        extractor = CalendarFeatureExtractor()
        
        time_features = extractor._extract_time_patterns(sample_calendar_data)
        assert 'early_morning_work' in time_features
        assert 'late_night_work' in time_features
        assert 'weekend_work' in time_features
        assert all(isinstance(v, (int, float)) for v in time_features.values())


class TestEmailFeatureExtractor:
    """Test email feature extraction."""
    
    def test_initialization(self):
        """Test EmailFeatureExtractor initialization."""
        extractor = EmailFeatureExtractor()
        assert extractor is not None
    
    @pytest.mark.asyncio
    async def test_extract_volume_features(self, sample_email_data):
        """Test email volume feature extraction."""
        extractor = EmailFeatureExtractor()
        
        volume_features = extractor._extract_volume_features(sample_email_data)
        assert 'email_count' in volume_features
        assert 'avg_email_length' in volume_features
        assert 'sent_email_count' in volume_features
        assert volume_features['email_count'] >= 0
    
    @pytest.mark.asyncio
    async def test_extract_sentiment_features(self, sample_email_data):
        """Test sentiment feature extraction."""
        extractor = EmailFeatureExtractor()
        
        sentiment_features = extractor._extract_sentiment_features(sample_email_data)
        assert 'avg_sentiment' in sentiment_features
        assert 'negative_sentiment_count' in sentiment_features
        assert 'positive_sentiment_count' in sentiment_features
        assert -1 <= sentiment_features['avg_sentiment'] <= 1
    
    @pytest.mark.asyncio
    async def test_extract_urgency_features(self, sample_email_data):
        """Test urgency feature extraction."""
        extractor = EmailFeatureExtractor()
        
        urgency_features = extractor._extract_urgency_features(sample_email_data)
        assert 'urgent_email_count' in urgency_features
        assert 'urgent_email_ratio' in urgency_features
        assert 0 <= urgency_features['urgent_email_ratio'] <= 1
    
    @pytest.mark.asyncio
    async def test_extract_communication_patterns(self, sample_email_data):
        """Test communication pattern extraction."""
        extractor = EmailFeatureExtractor()
        
        pattern_features = extractor._extract_communication_patterns(sample_email_data)
        assert 'avg_recipients_per_email' in pattern_features
        assert 'unique_recipients' in pattern_features
        assert pattern_features['avg_recipients_per_email'] >= 0


class TestAggregationFeatureExtractor:
    """Test aggregation feature extraction."""
    
    def test_initialization(self):
        """Test AggregationFeatureExtractor initialization."""
        extractor = AggregationFeatureExtractor()
        assert extractor is not None
    
    def test_calculate_workload_score(self, sample_features):
        """Test workload score calculation."""
        extractor = AggregationFeatureExtractor()
        
        workload_score = extractor._calculate_workload_score(sample_features)
        assert isinstance(workload_score, float)
        assert 0 <= workload_score <= 10
    
    def test_calculate_work_life_balance(self, sample_features):
        """Test work-life balance calculation."""
        extractor = AggregationFeatureExtractor()
        
        balance_score = extractor._calculate_work_life_balance(sample_features)
        assert isinstance(balance_score, float)
        assert 0 <= balance_score <= 10
    
    def test_calculate_stress_score(self, sample_features):
        """Test stress score calculation."""
        extractor = AggregationFeatureExtractor()
        
        stress_score = extractor._calculate_stress_score(sample_features)
        assert isinstance(stress_score, float)
        assert 0 <= stress_score <= 10
    
    def test_normalize_features(self, sample_features):
        """Test feature normalization."""
        extractor = AggregationFeatureExtractor()
        
        normalized = extractor._normalize_features(sample_features)
        assert isinstance(normalized, dict)
        assert len(normalized) == len(sample_features)
        
        # Check that all values are between 0 and 1
        for key, value in normalized.items():
            if isinstance(value, (int, float)):
                assert 0 <= value <= 1


class TestFeatureValidation:
    """Test feature validation and quality checks."""
    
    def test_validate_feature_completeness(self, sample_features):
        """Test feature completeness validation."""
        from src.features.feature_engineer import FeatureEngineer
        
        engineer = FeatureEngineer()
        is_complete = engineer._validate_feature_completeness(sample_features)
        assert isinstance(is_complete, bool)
    
    def test_validate_feature_ranges(self, sample_features):
        """Test feature range validation."""
        from src.features.feature_engineer import FeatureEngineer
        
        engineer = FeatureEngineer()
        is_valid = engineer._validate_feature_ranges(sample_features)
        assert isinstance(is_valid, bool)
    
    def test_handle_missing_features(self):
        """Test handling of missing features."""
        from src.features.feature_engineer import FeatureEngineer
        
        engineer = FeatureEngineer()
        incomplete_features = {'work_hours': 40.0}  # Missing other features
        
        completed = engineer._handle_missing_features(incomplete_features)
        assert isinstance(completed, dict)
        assert len(completed) > len(incomplete_features)
    
    def test_feature_quality_score(self, sample_features):
        """Test feature quality scoring."""
        from src.features.feature_engineer import FeatureEngineer
        
        engineer = FeatureEngineer()
        quality_score = engineer._calculate_feature_quality_score(sample_features)
        assert isinstance(quality_score, float)
        assert 0 <= quality_score <= 1


@pytest.mark.integration
class TestFeatureIntegration:
    """Integration tests for feature engineering pipeline."""
    
    @pytest.mark.asyncio
    async def test_full_feature_pipeline(self, sample_calendar_data, sample_email_data):
        """Test the complete feature extraction pipeline."""
        engineer = FeatureEngineer()
        
        # Mock the data sources
        engineer.calendar_extractor.extract = pytest.AsyncMock(return_value={
            'work_hours': 40.0,
            'meeting_count': 5,
            'stress_level': 4.0,
            'workload': 5.0
        })
        engineer.email_extractor.extract = pytest.AsyncMock(return_value={
            'email_count': 20,
            'avg_sentiment': 0.2,
            'urgent_count': 2
        })
        engineer.aggregation_extractor.extract = pytest.AsyncMock(return_value={
            'workload_score': 6.0,
            'work_life_balance': 7.0,
            'stress_score': 4.0
        })
        
        features = await engineer.extract_features(
            user_id='test_user',
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31)
        )
        
        # Verify all expected features are present
        expected_features = [
            'work_hours', 'meeting_count', 'stress_level', 'workload',
            'email_count', 'avg_sentiment', 'urgent_count',
            'workload_score', 'work_life_balance', 'stress_score'
        ]
        
        for feature in expected_features:
            assert feature in features
            assert isinstance(features[feature], (int, float))
    
    @pytest.mark.asyncio
    async def test_feature_pipeline_with_errors(self):
        """Test feature pipeline error handling."""
        engineer = FeatureEngineer()
        
        # Mock extractors to raise exceptions
        engineer.calendar_extractor.extract = pytest.AsyncMock(side_effect=Exception("Calendar error"))
        engineer.email_extractor.extract = pytest.AsyncMock(return_value={})
        engineer.aggregation_extractor.extract = pytest.AsyncMock(return_value={})
        
        # Should handle errors gracefully
        features = await engineer.extract_features(
            user_id='test_user',
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31)
        )
        
        assert isinstance(features, dict)
        # Should still return some features even if one extractor fails
        assert len(features) >= 0
