# Feature Engineering Orchestrator - Created by Balaji Koneti
"""
Main feature engineering orchestrator that combines all feature extraction modules.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging

from .time_series_features import TimeSeriesFeatureExtractor
from .text_features import TextFeatureExtractor
from .aggregation_features import AggregationFeatureExtractor

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Main feature engineering orchestrator"""
    
    def __init__(self):
        self.time_series_extractor = TimeSeriesFeatureExtractor()
        self.text_extractor = TextFeatureExtractor()
        self.aggregation_extractor = AggregationFeatureExtractor()
        
        # Feature categories
        self.feature_categories = {
            'calendar_temporal': [],
            'email_temporal': [],
            'calendar_aggregation': [],
            'email_aggregation': [],
            'text_features': [],
            'interaction_features': []
        }
    
    def engineer_features(
        self,
        calendar_data: pd.DataFrame,
        email_data: pd.DataFrame,
        user_id: str,
        lookback_days: int = 30
    ) -> Dict[str, float]:
        """
        Engineer comprehensive features for a user
        
        Args:
            calendar_data: DataFrame with calendar events
            email_data: DataFrame with email messages
            user_id: User identifier
            lookback_days: Number of days to look back for features
            
        Returns:
            Dictionary of engineered features
        """
        try:
            logger.info(f"Engineering features for user {user_id}")
            
            all_features = {}
            
            # 1. Calendar temporal features
            calendar_temporal = self.time_series_extractor.extract_calendar_temporal_features(
                calendar_data, user_id, lookback_days
            )
            all_features.update(calendar_temporal)
            self.feature_categories['calendar_temporal'] = list(calendar_temporal.keys())
            
            # 2. Email temporal features
            email_temporal = self.time_series_extractor.extract_email_temporal_features(
                email_data, user_id, lookback_days
            )
            all_features.update(email_temporal)
            self.feature_categories['email_temporal'] = list(email_temporal.keys())
            
            # 3. Calendar aggregation features
            calendar_aggregation = self.aggregation_extractor.extract_calendar_aggregation_features(
                calendar_data, user_id, lookback_days
            )
            all_features.update(calendar_aggregation)
            self.feature_categories['calendar_aggregation'] = list(calendar_aggregation.keys())
            
            # 4. Email aggregation features
            email_aggregation = self.aggregation_extractor.extract_email_aggregation_features(
                email_data, user_id, lookback_days
            )
            all_features.update(email_aggregation)
            self.feature_categories['email_aggregation'] = list(email_aggregation.keys())
            
            # 5. Text features
            text_features = self.text_extractor.extract_email_text_features(
                email_data, user_id
            )
            all_features.update(text_features)
            self.feature_categories['text_features'] = list(text_features.keys())
            
            # 6. Interaction features
            interaction_features = self._create_interaction_features(
                calendar_temporal, email_temporal, calendar_aggregation, email_aggregation
            )
            all_features.update(interaction_features)
            self.feature_categories['interaction_features'] = list(interaction_features.keys())
            
            # 7. Derived features
            derived_features = self._create_derived_features(all_features)
            all_features.update(derived_features)
            
            logger.info(f"Generated {len(all_features)} features for user {user_id}")
            
            return all_features
            
        except Exception as e:
            logger.error(f"Error engineering features for user {user_id}: {str(e)}")
            return self._get_default_features()
    
    def _create_interaction_features(
        self,
        calendar_temporal: Dict[str, float],
        email_temporal: Dict[str, float],
        calendar_aggregation: Dict[str, float],
        email_aggregation: Dict[str, float]
    ) -> Dict[str, float]:
        """Create interaction features between different data sources"""
        features = {}
        
        try:
            # Work intensity vs communication intensity
            work_hours = calendar_aggregation.get('avg_work_hours_per_day', 0)
            email_frequency = email_aggregation.get('emails_per_day', 0)
            features['work_communication_ratio'] = work_hours / (email_frequency + 1e-6)
            
            # Meeting load vs email load
            meeting_ratio = calendar_aggregation.get('meeting_ratio', 0)
            urgent_email_ratio = email_aggregation.get('urgent_email_ratio', 0)
            features['meeting_urgency_interaction'] = meeting_ratio * urgent_email_ratio
            
            # After-hours work vs after-hours communication
            after_hours_work = calendar_temporal.get('after_hours_events_ratio', 0)
            after_hours_email = email_temporal.get('after_hours_email_ratio', 0)
            features['after_hours_consistency'] = min(after_hours_work, after_hours_email) / (max(after_hours_work, after_hours_email) + 1e-6)
            
            # Weekend work vs weekend communication
            weekend_work = calendar_temporal.get('weekend_work_ratio', 0)
            weekend_email = email_temporal.get('weekend_email_ratio', 0)
            features['weekend_consistency'] = min(weekend_work, weekend_email) / (max(weekend_work, weekend_email) + 1e-6)
            
            # Stress indicators interaction
            stress_work = calendar_temporal.get('work_hours_std', 0)
            stress_email = email_aggregation.get('sentiment_std', 0)
            features['stress_consistency'] = (stress_work + stress_email) / 2
            
            # Efficiency indicators
            meeting_efficiency = calendar_aggregation.get('short_meetings_ratio', 0)
            email_efficiency = email_aggregation.get('short_emails_ratio', 0)
            features['communication_efficiency'] = (meeting_efficiency + email_efficiency) / 2
            
            # Workload balance
            work_intensity = calendar_aggregation.get('work_intensity', 0)
            communication_intensity = email_aggregation.get('communication_entropy', 0)
            features['workload_balance'] = work_intensity / (communication_intensity + 1e-6)
            
        except Exception as e:
            logger.error(f"Error creating interaction features: {str(e)}")
            # Return default interaction features
            features = {
                'work_communication_ratio': 0.0,
                'meeting_urgency_interaction': 0.0,
                'after_hours_consistency': 0.0,
                'weekend_consistency': 0.0,
                'stress_consistency': 0.0,
                'communication_efficiency': 0.0,
                'workload_balance': 0.0
            }
        
        return features
    
    def _create_derived_features(self, all_features: Dict[str, float]) -> Dict[str, float]:
        """Create derived features from existing features"""
        features = {}
        
        try:
            # Burnout risk indicators (composite features)
            
            # 1. Work overload indicator
            work_hours = all_features.get('avg_work_hours_per_day', 0)
            meeting_ratio = all_features.get('meeting_ratio', 0)
            after_hours_work = all_features.get('after_hours_events_ratio', 0)
            weekend_work = all_features.get('weekend_work_ratio', 0)
            
            work_overload = (work_hours / 8) * 0.4 + meeting_ratio * 0.3 + after_hours_work * 0.2 + weekend_work * 0.1
            features['work_overload_score'] = min(work_overload, 1.0)
            
            # 2. Communication stress indicator
            email_frequency = all_features.get('emails_per_day', 0)
            urgent_ratio = all_features.get('urgent_email_ratio', 0)
            negative_sentiment = all_features.get('negative_sentiment_ratio', 0)
            after_hours_email = all_features.get('after_hours_email_ratio', 0)
            
            communication_stress = (email_frequency / 50) * 0.3 + urgent_ratio * 0.3 + negative_sentiment * 0.2 + after_hours_email * 0.2
            features['communication_stress_score'] = min(communication_stress, 1.0)
            
            # 3. Work-life balance indicator
            work_life_balance = 1.0 - (after_hours_work * 0.4 + weekend_work * 0.3 + after_hours_email * 0.3)
            features['work_life_balance_score'] = max(work_life_balance, 0.0)
            
            # 4. Efficiency indicator
            meeting_efficiency = all_features.get('short_meetings_ratio', 0)
            email_efficiency = all_features.get('short_emails_ratio', 0)
            focus_time = all_features.get('focus_time_ratio', 0)
            
            efficiency = (meeting_efficiency * 0.4 + email_efficiency * 0.3 + focus_time * 0.3)
            features['efficiency_score'] = efficiency
            
            # 5. Social support indicator (inverse of isolation)
            meeting_attendees = all_features.get('avg_meeting_attendees', 0)
            large_meetings = all_features.get('large_meetings_ratio', 0)
            communication_entropy = all_features.get('communication_entropy', 0)
            
            social_support = (meeting_attendees / 10) * 0.4 + large_meetings * 0.3 + (communication_entropy / 3) * 0.3
            features['social_support_score'] = min(social_support, 1.0)
            
            # 6. Overall burnout risk score (composite)
            burnout_risk = (
                features['work_overload_score'] * 0.3 +
                features['communication_stress_score'] * 0.25 +
                (1.0 - features['work_life_balance_score']) * 0.2 +
                (1.0 - features['efficiency_score']) * 0.15 +
                (1.0 - features['social_support_score']) * 0.1
            )
            features['burnout_risk_score'] = min(burnout_risk, 1.0)
            
            # 7. Trend indicators
            duration_trend = all_features.get('duration_trend_slope', 0)
            events_trend = all_features.get('events_trend_slope', 0)
            email_trend = all_features.get('email_frequency_trend', 0)
            
            features['workload_trend'] = (duration_trend + events_trend) / 2
            features['communication_trend'] = email_trend
            
            # 8. Consistency indicators
            work_consistency = all_features.get('workload_consistency', 0)
            communication_consistency = all_features.get('communication_entropy', 0)
            
            features['work_consistency_score'] = 1.0 - min(work_consistency, 1.0)
            features['communication_consistency_score'] = 1.0 - min(communication_consistency / 3, 1.0)
            
        except Exception as e:
            logger.error(f"Error creating derived features: {str(e)}")
            # Return default derived features
            features = {
                'work_overload_score': 0.0,
                'communication_stress_score': 0.0,
                'work_life_balance_score': 1.0,
                'efficiency_score': 0.0,
                'social_support_score': 0.0,
                'burnout_risk_score': 0.0,
                'workload_trend': 0.0,
                'communication_trend': 0.0,
                'work_consistency_score': 1.0,
                'communication_consistency_score': 1.0
            }
        
        return features
    
    def get_feature_importance_weights(self) -> Dict[str, float]:
        """Get feature importance weights based on domain knowledge"""
        weights = {}
        
        # High importance features (based on burnout research)
        high_importance = [
            'work_overload_score', 'communication_stress_score', 'work_life_balance_score',
            'burnout_risk_score', 'avg_work_hours_per_day', 'meeting_ratio',
            'after_hours_events_ratio', 'weekend_work_ratio', 'urgent_email_ratio',
            'negative_sentiment_ratio', 'workload_trend', 'communication_trend'
        ]
        
        # Medium importance features
        medium_importance = [
            'efficiency_score', 'social_support_score', 'work_consistency_score',
            'communication_consistency_score', 'avg_meeting_duration',
            'back_to_back_meetings_ratio', 'large_meetings_ratio',
            'sentiment_volatility', 'after_hours_email_ratio', 'weekend_email_ratio'
        ]
        
        # Assign weights
        for feature in high_importance:
            weights[feature] = 1.0
        
        for feature in medium_importance:
            weights[feature] = 0.7
        
        # All other features get default weight
        for category_features in self.feature_categories.values():
            for feature in category_features:
                if feature not in weights:
                    weights[feature] = 0.5
        
        return weights
    
    def get_feature_categories(self) -> Dict[str, List[str]]:
        """Get feature categories for analysis"""
        return self.feature_categories.copy()
    
    def _get_default_features(self) -> Dict[str, float]:
        """Return default features when extraction fails"""
        default_features = {}
        
        # Add all possible features with default values
        for category_features in self.feature_categories.values():
            for feature in category_features:
                default_features[feature] = 0.0
        
        # Add derived features
        derived_features = self._create_derived_features(default_features)
        default_features.update(derived_features)
        
        return default_features
    
    def validate_features(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Validate feature values and return validation report"""
        validation_report = {
            'total_features': len(features),
            'valid_features': 0,
            'invalid_features': 0,
            'missing_values': 0,
            'outliers': 0,
            'issues': []
        }
        
        for feature_name, value in features.items():
            # Check for missing values
            if pd.isna(value) or value is None:
                validation_report['missing_values'] += 1
                validation_report['issues'].append(f"Missing value in {feature_name}")
                continue
            
            # Check for infinite values
            if np.isinf(value):
                validation_report['invalid_features'] += 1
                validation_report['issues'].append(f"Infinite value in {feature_name}")
                continue
            
            # Check for reasonable ranges (basic sanity checks)
            if feature_name.endswith('_ratio') and (value < 0 or value > 1):
                validation_report['outliers'] += 1
                validation_report['issues'].append(f"Ratio out of range [0,1] in {feature_name}: {value}")
            
            if feature_name.endswith('_score') and (value < 0 or value > 1):
                validation_report['outliers'] += 1
                validation_report['issues'].append(f"Score out of range [0,1] in {feature_name}: {value}")
            
            if feature_name.endswith('_hours') and value < 0:
                validation_report['outliers'] += 1
                validation_report['issues'].append(f"Negative hours in {feature_name}: {value}")
            
            validation_report['valid_features'] += 1
        
        return validation_report

