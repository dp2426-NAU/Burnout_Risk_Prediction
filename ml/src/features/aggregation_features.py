# Aggregation Features - Created by Balaji Koneti
"""
Aggregation feature engineering for burnout risk prediction.
Extracts statistical aggregations and derived metrics from calendar and email data.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AggregationFeatureExtractor:
    """Extracts aggregated features from calendar and email data"""
    
    def __init__(self):
        self.feature_names = []
    
    def extract_calendar_aggregation_features(
        self, 
        calendar_data: pd.DataFrame,
        user_id: str,
        lookback_days: int = 30
    ) -> Dict[str, float]:
        """
        Extract aggregated features from calendar data
        
        Args:
            calendar_data: DataFrame with calendar events
            user_id: User identifier
            lookback_days: Number of days to look back for features
            
        Returns:
            Dictionary of aggregated features
        """
        try:
            # Filter data for specific user and time period
            user_data = calendar_data[calendar_data['user_id'] == user_id].copy()
            if user_data.empty:
                return self._get_default_calendar_aggregation_features()
            
            # Convert to datetime
            user_data['start_time'] = pd.to_datetime(user_data['start_time'])
            user_data['date'] = user_data['start_time'].dt.date
            
            # Calculate lookback date
            end_date = user_data['start_time'].max().date()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Filter to lookback period
            user_data = user_data[user_data['date'] >= start_date]
            
            if user_data.empty:
                return self._get_default_calendar_aggregation_features()
            
            features = {}
            
            # 1. Basic statistics
            features.update(self._extract_basic_calendar_stats(user_data))
            
            # 2. Meeting statistics
            features.update(self._extract_meeting_aggregations(user_data))
            
            # 3. Workload metrics
            features.update(self._extract_workload_metrics(user_data))
            
            # 4. Time distribution
            features.update(self._extract_time_distribution_features(user_data))
            
            # 5. Efficiency metrics
            features.update(self._extract_efficiency_metrics(user_data))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting calendar aggregation features for user {user_id}: {str(e)}")
            return self._get_default_calendar_aggregation_features()
    
    def extract_email_aggregation_features(
        self, 
        email_data: pd.DataFrame,
        user_id: str,
        lookback_days: int = 30
    ) -> Dict[str, float]:
        """
        Extract aggregated features from email data
        
        Args:
            email_data: DataFrame with email messages
            user_id: User identifier
            lookback_days: Number of days to look back for features
            
        Returns:
            Dictionary of aggregated features
        """
        try:
            # Filter data for specific user and time period
            user_data = email_data[email_data['user_id'] == user_id].copy()
            if user_data.empty:
                return self._get_default_email_aggregation_features()
            
            # Convert to datetime
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            user_data['date'] = user_data['timestamp'].dt.date
            
            # Calculate lookback date
            end_date = user_data['timestamp'].max().date()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Filter to lookback period
            user_data = user_data[user_data['date'] >= start_date]
            
            if user_data.empty:
                return self._get_default_email_aggregation_features()
            
            features = {}
            
            # 1. Basic email statistics
            features.update(self._extract_basic_email_stats(user_data))
            
            # 2. Communication patterns
            features.update(self._extract_communication_aggregations(user_data))
            
            # 3. Content analysis
            features.update(self._extract_content_aggregations(user_data))
            
            # 4. Sentiment aggregations
            features.update(self._extract_sentiment_aggregations(user_data))
            
            # 5. Urgency patterns
            features.update(self._extract_urgency_aggregations(user_data))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting email aggregation features for user {user_id}: {str(e)}")
            return self._get_default_email_aggregation_features()
    
    def _extract_basic_calendar_stats(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract basic calendar statistics"""
        features = {}
        
        # Event counts
        features['total_events'] = len(user_data)
        features['unique_days_with_events'] = user_data['date'].nunique()
        features['events_per_day'] = features['total_events'] / (features['unique_days_with_events'] + 1e-6)
        
        # Duration statistics
        features['total_duration_hours'] = user_data['duration_minutes'].sum() / 60
        features['avg_duration_minutes'] = user_data['duration_minutes'].mean()
        features['duration_std'] = user_data['duration_minutes'].std()
        features['max_duration_minutes'] = user_data['duration_minutes'].max()
        features['min_duration_minutes'] = user_data['duration_minutes'].min()
        
        # Duration percentiles
        duration_percentiles = user_data['duration_minutes'].quantile([0.25, 0.5, 0.75, 0.9, 0.95])
        features['duration_p25'] = duration_percentiles[0.25]
        features['duration_p50'] = duration_percentiles[0.5]
        features['duration_p75'] = duration_percentiles[0.75]
        features['duration_p90'] = duration_percentiles[0.9]
        features['duration_p95'] = duration_percentiles[0.95]
        
        # Daily duration statistics
        daily_duration = user_data.groupby('date')['duration_minutes'].sum()
        features['avg_daily_duration_hours'] = daily_duration.mean() / 60
        features['max_daily_duration_hours'] = daily_duration.max() / 60
        features['daily_duration_std'] = daily_duration.std() / 60
        
        return features
    
    def _extract_meeting_aggregations(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract meeting-specific aggregations"""
        features = {}
        
        meetings = user_data[user_data['is_meeting']]
        non_meetings = user_data[~user_data['is_meeting']]
        
        # Meeting ratios
        features['meeting_ratio'] = len(meetings) / len(user_data)
        features['meeting_duration_ratio'] = meetings['duration_minutes'].sum() / (user_data['duration_minutes'].sum() + 1e-6)
        
        if not meetings.empty:
            # Meeting statistics
            features['avg_meeting_duration'] = meetings['duration_minutes'].mean()
            features['meeting_duration_std'] = meetings['duration_minutes'].std()
            features['max_meeting_duration'] = meetings['duration_minutes'].max()
            
            # Attendees statistics
            features['avg_meeting_attendees'] = meetings['attendees_count'].mean()
            features['max_meeting_attendees'] = meetings['attendees_count'].max()
            features['large_meetings_count'] = (meetings['attendees_count'] > 8).sum()
            features['large_meetings_ratio'] = features['large_meetings_count'] / len(meetings)
            
            # Recurring meetings
            features['recurring_meetings_ratio'] = meetings['is_recurring'].mean()
        else:
            features.update({
                'avg_meeting_duration': 0.0,
                'meeting_duration_std': 0.0,
                'max_meeting_duration': 0.0,
                'avg_meeting_attendees': 0.0,
                'max_meeting_attendees': 0.0,
                'large_meetings_count': 0.0,
                'large_meetings_ratio': 0.0,
                'recurring_meetings_ratio': 0.0
            })
        
        if not non_meetings.empty:
            # Focus time statistics
            features['avg_focus_time_duration'] = non_meetings['duration_minutes'].mean()
            features['focus_time_ratio'] = len(non_meetings) / len(user_data)
        else:
            features.update({
                'avg_focus_time_duration': 0.0,
                'focus_time_ratio': 0.0
            })
        
        return features
    
    def _extract_workload_metrics(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract workload-related metrics"""
        features = {}
        
        # Add time components
        user_data['hour'] = user_data['start_time'].dt.hour
        user_data['day_of_week'] = user_data['start_time'].dt.dayofweek
        user_data['is_weekend'] = user_data['day_of_week'].isin([5, 6])
        
        # Workload intensity
        weekday_data = user_data[~user_data['is_weekend']]
        if not weekday_data.empty:
            # Work hours (8 AM to 6 PM)
            work_hours_data = weekday_data[(weekday_data['hour'] >= 8) & (weekday_data['hour'] <= 18)]
            features['work_hours_events'] = len(work_hours_data)
            features['work_hours_duration'] = work_hours_data['duration_minutes'].sum() / 60
            features['work_hours_ratio'] = len(work_hours_data) / len(weekday_data)
            
            # After-hours work
            after_hours_data = weekday_data[(weekday_data['hour'] < 8) | (weekday_data['hour'] > 18)]
            features['after_hours_events'] = len(after_hours_data)
            features['after_hours_duration'] = after_hours_data['duration_minutes'].sum() / 60
            features['after_hours_ratio'] = len(after_hours_data) / len(weekday_data)
        else:
            features.update({
                'work_hours_events': 0.0,
                'work_hours_duration': 0.0,
                'work_hours_ratio': 0.0,
                'after_hours_events': 0.0,
                'after_hours_duration': 0.0,
                'after_hours_ratio': 0.0
            })
        
        # Weekend work
        weekend_data = user_data[user_data['is_weekend']]
        features['weekend_events'] = len(weekend_data)
        features['weekend_duration'] = weekend_data['duration_minutes'].sum() / 60
        features['weekend_ratio'] = len(weekend_data) / len(user_data)
        
        # Workload consistency (coefficient of variation)
        daily_duration = user_data.groupby('date')['duration_minutes'].sum()
        if len(daily_duration) > 1 and daily_duration.mean() > 0:
            features['workload_consistency'] = daily_duration.std() / daily_duration.mean()
        else:
            features['workload_consistency'] = 0.0
        
        return features
    
    def _extract_time_distribution_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract time distribution features"""
        features = {}
        
        # Hourly distribution
        hourly_counts = user_data['start_time'].dt.hour.value_counts()
        if not hourly_counts.empty:
            features['peak_hour'] = hourly_counts.idxmax()
            features['peak_hour_events'] = hourly_counts.max()
            features['hour_distribution_entropy'] = self._calculate_entropy(hourly_counts.values)
        else:
            features['peak_hour'] = 12
            features['peak_hour_events'] = 0
            features['hour_distribution_entropy'] = 0.0
        
        # Daily distribution
        daily_counts = user_data['start_time'].dt.dayofweek.value_counts()
        if not daily_counts.empty:
            features['most_active_day'] = daily_counts.idxmax()
            features['day_distribution_entropy'] = self._calculate_entropy(daily_counts.values)
        else:
            features['most_active_day'] = 1  # Tuesday
            features['day_distribution_entropy'] = 0.0
        
        # Time spread (hours between first and last event)
        if len(user_data) > 1:
            time_spread = (user_data['start_time'].max() - user_data['start_time'].min()).total_seconds() / 3600
            features['time_spread_hours'] = time_spread
        else:
            features['time_spread_hours'] = 0.0
        
        return features
    
    def _extract_efficiency_metrics(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract efficiency-related metrics"""
        features = {}
        
        # Meeting efficiency (shorter meetings might be more efficient)
        meetings = user_data[user_data['is_meeting']]
        if not meetings.empty:
            # Meetings under 30 minutes
            short_meetings = meetings[meetings['duration_minutes'] <= 30]
            features['short_meetings_ratio'] = len(short_meetings) / len(meetings)
            
            # Meetings over 2 hours (potentially inefficient)
            long_meetings = meetings[meetings['duration_minutes'] > 120]
            features['long_meetings_ratio'] = len(long_meetings) / len(meetings)
        else:
            features['short_meetings_ratio'] = 0.0
            features['long_meetings_ratio'] = 0.0
        
        # Event density (events per hour of work)
        daily_events = user_data.groupby('date').size()
        daily_duration = user_data.groupby('date')['duration_minutes'].sum() / 60
        
        if not daily_duration.empty and daily_duration.sum() > 0:
            features['avg_events_per_hour'] = daily_events.mean() / (daily_duration.mean() + 1e-6)
        else:
            features['avg_events_per_hour'] = 0.0
        
        return features
    
    def _extract_basic_email_stats(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract basic email statistics"""
        features = {}
        
        # Email counts
        features['total_emails'] = len(user_data)
        features['unique_days_with_emails'] = user_data['date'].nunique()
        features['emails_per_day'] = features['total_emails'] / (features['unique_days_with_emails'] + 1e-6)
        
        # Sent vs received
        if 'is_sent' in user_data.columns:
            sent_emails = user_data[user_data['is_sent']]
            received_emails = user_data[~user_data['is_sent']]
            
            features['sent_emails_count'] = len(sent_emails)
            features['received_emails_count'] = len(received_emails)
            features['sent_email_ratio'] = len(sent_emails) / len(user_data)
        else:
            features['sent_emails_count'] = 0.0
            features['received_emails_count'] = 0.0
            features['sent_email_ratio'] = 0.0
        
        # Urgency
        if 'is_urgent' in user_data.columns:
            urgent_emails = user_data[user_data['is_urgent']]
            features['urgent_emails_count'] = len(urgent_emails)
            features['urgent_email_ratio'] = len(urgent_emails) / len(user_data)
        else:
            features['urgent_emails_count'] = 0.0
            features['urgent_email_ratio'] = 0.0
        
        # Daily email statistics
        daily_emails = user_data.groupby('date').size()
        features['avg_daily_emails'] = daily_emails.mean()
        features['max_daily_emails'] = daily_emails.max()
        features['daily_emails_std'] = daily_emails.std()
        
        return features
    
    def _extract_communication_aggregations(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract communication pattern aggregations"""
        features = {}
        
        # Time-based patterns
        user_data['hour'] = user_data['timestamp'].dt.hour
        user_data['day_of_week'] = user_data['timestamp'].dt.dayofweek
        user_data['is_weekend'] = user_data['day_of_week'].isin([5, 6])
        
        # Peak communication times
        hourly_counts = user_data['hour'].value_counts()
        if not hourly_counts.empty:
            features['peak_communication_hour'] = hourly_counts.idxmax()
            features['peak_hour_emails'] = hourly_counts.max()
            features['communication_entropy'] = self._calculate_entropy(hourly_counts.values)
        else:
            features['peak_communication_hour'] = 12
            features['peak_hour_emails'] = 0
            features['communication_entropy'] = 0.0
        
        # Weekend communication
        weekend_emails = user_data[user_data['is_weekend']]
        features['weekend_emails_count'] = len(weekend_emails)
        features['weekend_communication_ratio'] = len(weekend_emails) / len(user_data)
        
        # After-hours communication
        weekday_emails = user_data[~user_data['is_weekend']]
        if not weekday_emails.empty:
            after_hours_emails = weekday_emails[(weekday_emails['hour'] < 8) | (weekday_emails['hour'] > 18)]
            features['after_hours_emails_count'] = len(after_hours_emails)
            features['after_hours_communication_ratio'] = len(after_hours_emails) / len(weekday_emails)
        else:
            features['after_hours_emails_count'] = 0.0
            features['after_hours_communication_ratio'] = 0.0
        
        return features
    
    def _extract_content_aggregations(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract content-related aggregations"""
        features = {}
        
        # Word count statistics
        if 'word_count' in user_data.columns:
            word_counts = user_data['word_count']
            features['avg_word_count'] = word_counts.mean()
            features['word_count_std'] = word_counts.std()
            features['max_word_count'] = word_counts.max()
            features['min_word_count'] = word_counts.min()
            
            # Word count percentiles
            word_percentiles = word_counts.quantile([0.25, 0.5, 0.75, 0.9, 0.95])
            features['word_count_p25'] = word_percentiles[0.25]
            features['word_count_p50'] = word_percentiles[0.5]
            features['word_count_p75'] = word_percentiles[0.75]
            features['word_count_p90'] = word_percentiles[0.9]
            features['word_count_p95'] = word_percentiles[0.95]
            
            # Long vs short emails
            long_emails = user_data[word_counts > word_counts.quantile(0.8)]
            short_emails = user_data[word_counts < word_counts.quantile(0.2)]
            
            features['long_emails_ratio'] = len(long_emails) / len(user_data)
            features['short_emails_ratio'] = len(short_emails) / len(user_data)
        else:
            features.update({
                'avg_word_count': 0.0,
                'word_count_std': 0.0,
                'max_word_count': 0.0,
                'min_word_count': 0.0,
                'word_count_p25': 0.0,
                'word_count_p50': 0.0,
                'word_count_p75': 0.0,
                'word_count_p90': 0.0,
                'word_count_p95': 0.0,
                'long_emails_ratio': 0.0,
                'short_emails_ratio': 0.0
            })
        
        return features
    
    def _extract_sentiment_aggregations(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract sentiment-related aggregations"""
        features = {}
        
        if 'sentiment_score' not in user_data.columns:
            return {
                'avg_sentiment': 0.0,
                'sentiment_std': 0.0,
                'sentiment_range': 0.0,
                'positive_emails_ratio': 0.0,
                'negative_emails_ratio': 0.0,
                'neutral_emails_ratio': 0.0
            }
        
        sentiment_scores = user_data['sentiment_score'].fillna(0)
        
        # Basic sentiment statistics
        features['avg_sentiment'] = sentiment_scores.mean()
        features['sentiment_std'] = sentiment_scores.std()
        features['sentiment_range'] = sentiment_scores.max() - sentiment_scores.min()
        features['sentiment_min'] = sentiment_scores.min()
        features['sentiment_max'] = sentiment_scores.max()
        
        # Sentiment distribution
        positive_emails = (sentiment_scores > 0.1).sum()
        negative_emails = (sentiment_scores < -0.1).sum()
        neutral_emails = ((sentiment_scores >= -0.1) & (sentiment_scores <= 0.1)).sum()
        
        total_emails = len(sentiment_scores)
        features['positive_emails_ratio'] = positive_emails / total_emails
        features['negative_emails_ratio'] = negative_emails / total_emails
        features['neutral_emails_ratio'] = neutral_emails / total_emails
        
        # Sentiment volatility
        if len(sentiment_scores) > 1:
            sentiment_changes = sentiment_scores.diff().abs()
            features['sentiment_volatility'] = sentiment_changes.mean()
            features['sentiment_volatility_std'] = sentiment_changes.std()
        else:
            features['sentiment_volatility'] = 0.0
            features['sentiment_volatility_std'] = 0.0
        
        return features
    
    def _extract_urgency_aggregations(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract urgency-related aggregations"""
        features = {}
        
        if 'is_urgent' not in user_data.columns:
            return {
                'urgent_emails_ratio': 0.0,
                'urgent_emails_per_day': 0.0,
                'max_urgent_emails_per_day': 0.0
            }
        
        # Basic urgency statistics
        urgent_emails = user_data[user_data['is_urgent']]
        features['urgent_emails_ratio'] = len(urgent_emails) / len(user_data)
        
        # Daily urgency patterns
        daily_urgent = user_data.groupby('date')['is_urgent'].sum()
        features['urgent_emails_per_day'] = daily_urgent.mean()
        features['max_urgent_emails_per_day'] = daily_urgent.max()
        features['urgent_emails_std'] = daily_urgent.std()
        
        # Urgency in sent vs received
        if 'is_sent' in user_data.columns:
            sent_urgent = user_data[(user_data['is_sent']) & (user_data['is_urgent'])]
            received_urgent = user_data[(~user_data['is_sent']) & (user_data['is_urgent'])]
            
            features['sent_urgent_ratio'] = len(sent_urgent) / (user_data['is_sent'].sum() + 1e-6)
            features['received_urgent_ratio'] = len(received_urgent) / ((~user_data['is_sent']).sum() + 1e-6)
        else:
            features['sent_urgent_ratio'] = 0.0
            features['received_urgent_ratio'] = 0.0
        
        return features
    
    def _calculate_entropy(self, values: np.ndarray) -> float:
        """Calculate entropy of a distribution"""
        if len(values) == 0:
            return 0.0
        
        # Normalize to probabilities
        probabilities = values / values.sum()
        
        # Calculate entropy
        entropy = -np.sum(probabilities * np.log2(probabilities + 1e-10))
        
        return entropy
    
    def _get_default_calendar_aggregation_features(self) -> Dict[str, float]:
        """Return default values for calendar aggregation features"""
        return {
            'total_events': 0.0,
            'unique_days_with_events': 0.0,
            'events_per_day': 0.0,
            'total_duration_hours': 0.0,
            'avg_duration_minutes': 0.0,
            'duration_std': 0.0,
            'max_duration_minutes': 0.0,
            'min_duration_minutes': 0.0,
            'duration_p25': 0.0,
            'duration_p50': 0.0,
            'duration_p75': 0.0,
            'duration_p90': 0.0,
            'duration_p95': 0.0,
            'avg_daily_duration_hours': 0.0,
            'max_daily_duration_hours': 0.0,
            'daily_duration_std': 0.0,
            'meeting_ratio': 0.0,
            'meeting_duration_ratio': 0.0,
            'avg_meeting_duration': 0.0,
            'meeting_duration_std': 0.0,
            'max_meeting_duration': 0.0,
            'avg_meeting_attendees': 0.0,
            'max_meeting_attendees': 0.0,
            'large_meetings_count': 0.0,
            'large_meetings_ratio': 0.0,
            'recurring_meetings_ratio': 0.0,
            'avg_focus_time_duration': 0.0,
            'focus_time_ratio': 0.0,
            'work_hours_events': 0.0,
            'work_hours_duration': 0.0,
            'work_hours_ratio': 0.0,
            'after_hours_events': 0.0,
            'after_hours_duration': 0.0,
            'after_hours_ratio': 0.0,
            'weekend_events': 0.0,
            'weekend_duration': 0.0,
            'weekend_ratio': 0.0,
            'workload_consistency': 0.0,
            'peak_hour': 12,
            'peak_hour_events': 0.0,
            'hour_distribution_entropy': 0.0,
            'most_active_day': 1,
            'day_distribution_entropy': 0.0,
            'time_spread_hours': 0.0,
            'short_meetings_ratio': 0.0,
            'long_meetings_ratio': 0.0,
            'avg_events_per_hour': 0.0
        }
    
    def _get_default_email_aggregation_features(self) -> Dict[str, float]:
        """Return default values for email aggregation features"""
        return {
            'total_emails': 0.0,
            'unique_days_with_emails': 0.0,
            'emails_per_day': 0.0,
            'sent_emails_count': 0.0,
            'received_emails_count': 0.0,
            'sent_email_ratio': 0.0,
            'urgent_emails_count': 0.0,
            'urgent_email_ratio': 0.0,
            'avg_daily_emails': 0.0,
            'max_daily_emails': 0.0,
            'daily_emails_std': 0.0,
            'peak_communication_hour': 12,
            'peak_hour_emails': 0.0,
            'communication_entropy': 0.0,
            'weekend_emails_count': 0.0,
            'weekend_communication_ratio': 0.0,
            'after_hours_emails_count': 0.0,
            'after_hours_communication_ratio': 0.0,
            'avg_word_count': 0.0,
            'word_count_std': 0.0,
            'max_word_count': 0.0,
            'min_word_count': 0.0,
            'word_count_p25': 0.0,
            'word_count_p50': 0.0,
            'word_count_p75': 0.0,
            'word_count_p90': 0.0,
            'word_count_p95': 0.0,
            'long_emails_ratio': 0.0,
            'short_emails_ratio': 0.0,
            'avg_sentiment': 0.0,
            'sentiment_std': 0.0,
            'sentiment_range': 0.0,
            'sentiment_min': 0.0,
            'sentiment_max': 0.0,
            'positive_emails_ratio': 0.0,
            'negative_emails_ratio': 0.0,
            'neutral_emails_ratio': 0.0,
            'sentiment_volatility': 0.0,
            'sentiment_volatility_std': 0.0,
            'urgent_emails_ratio': 0.0,
            'urgent_emails_per_day': 0.0,
            'max_urgent_emails_per_day': 0.0,
            'urgent_emails_std': 0.0,
            'sent_urgent_ratio': 0.0,
            'received_urgent_ratio': 0.0
        }

