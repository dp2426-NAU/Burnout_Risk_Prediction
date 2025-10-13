# Time Series Features - Created by Balaji Koneti
"""
Time series feature engineering for burnout risk prediction.
Extracts temporal patterns, trends, and seasonality from calendar and email data.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class TimeSeriesFeatureExtractor:
    """Extracts time series features from calendar and email data"""
    
    def __init__(self):
        self.feature_names = []
    
    def extract_calendar_temporal_features(
        self, 
        calendar_data: pd.DataFrame,
        user_id: str,
        lookback_days: int = 30
    ) -> Dict[str, float]:
        """
        Extract temporal features from calendar data
        
        Args:
            calendar_data: DataFrame with calendar events
            user_id: User identifier
            lookback_days: Number of days to look back for features
            
        Returns:
            Dictionary of temporal features
        """
        try:
            # Filter data for specific user and time period
            user_data = calendar_data[calendar_data['user_id'] == user_id].copy()
            if user_data.empty:
                return self._get_default_temporal_features()
            
            # Convert to datetime
            user_data['start_time'] = pd.to_datetime(user_data['start_time'])
            user_data['date'] = user_data['start_time'].dt.date
            
            # Calculate lookback date
            end_date = user_data['start_time'].max().date()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Filter to lookback period
            user_data = user_data[user_data['date'] >= start_date]
            
            if user_data.empty:
                return self._get_default_temporal_features()
            
            features = {}
            
            # 1. Daily patterns
            features.update(self._extract_daily_patterns(user_data))
            
            # 2. Weekly patterns
            features.update(self._extract_weekly_patterns(user_data))
            
            # 3. Rolling averages and trends
            features.update(self._extract_rolling_features(user_data))
            
            # 4. Work-life balance indicators
            features.update(self._extract_work_life_balance_features(user_data))
            
            # 5. Meeting patterns
            features.update(self._extract_meeting_patterns(user_data))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting calendar temporal features for user {user_id}: {str(e)}")
            return self._get_default_temporal_features()
    
    def extract_email_temporal_features(
        self, 
        email_data: pd.DataFrame,
        user_id: str,
        lookback_days: int = 30
    ) -> Dict[str, float]:
        """
        Extract temporal features from email data
        
        Args:
            email_data: DataFrame with email messages
            user_id: User identifier
            lookback_days: Number of days to look back for features
            
        Returns:
            Dictionary of temporal features
        """
        try:
            # Filter data for specific user and time period
            user_data = email_data[email_data['user_id'] == user_id].copy()
            if user_data.empty:
                return self._get_default_email_temporal_features()
            
            # Convert to datetime
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            user_data['date'] = user_data['timestamp'].dt.date
            
            # Calculate lookback date
            end_date = user_data['timestamp'].max().date()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Filter to lookback period
            user_data = user_data[user_data['date'] >= start_date]
            
            if user_data.empty:
                return self._get_default_email_temporal_features()
            
            features = {}
            
            # 1. Daily email patterns
            features.update(self._extract_email_daily_patterns(user_data))
            
            # 2. Email frequency trends
            features.update(self._extract_email_frequency_trends(user_data))
            
            # 3. Sentiment trends
            features.update(self._extract_sentiment_trends(user_data))
            
            # 4. Urgency patterns
            features.update(self._extract_urgency_patterns(user_data))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting email temporal features for user {user_id}: {str(e)}")
            return self._get_default_email_temporal_features()
    
    def _extract_daily_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract daily work patterns"""
        features = {}
        
        # Add hour and day of week
        user_data['hour'] = user_data['start_time'].dt.hour
        user_data['day_of_week'] = user_data['start_time'].dt.dayofweek
        user_data['is_weekend'] = user_data['day_of_week'].isin([5, 6])
        
        # Work hours analysis
        work_hours = user_data[~user_data['is_weekend']]
        if not work_hours.empty:
            features['avg_work_hours_per_day'] = work_hours.groupby('date')['duration_minutes'].sum().mean() / 60
            features['max_work_hours_per_day'] = work_hours.groupby('date')['duration_minutes'].sum().max() / 60
            features['work_hours_std'] = work_hours.groupby('date')['duration_minutes'].sum().std() / 60
            
            # Early morning work (before 8 AM)
            early_morning = work_hours[work_hours['hour'] < 8]
            features['early_morning_work_ratio'] = len(early_morning) / len(work_hours)
            
            # Late evening work (after 6 PM)
            late_evening = work_hours[work_hours['hour'] > 18]
            features['late_evening_work_ratio'] = len(late_evening) / len(work_hours)
            
            # Weekend work
            weekend_work = user_data[user_data['is_weekend']]
            features['weekend_work_ratio'] = len(weekend_work) / len(user_data)
        else:
            features.update({
                'avg_work_hours_per_day': 0,
                'max_work_hours_per_day': 0,
                'work_hours_std': 0,
                'early_morning_work_ratio': 0,
                'late_evening_work_ratio': 0,
                'weekend_work_ratio': 0
            })
        
        return features
    
    def _extract_weekly_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract weekly work patterns"""
        features = {}
        
        # Group by day of week
        daily_stats = user_data.groupby('day_of_week').agg({
            'duration_minutes': ['sum', 'count', 'mean'],
            'is_meeting': 'sum'
        }).round(2)
        
        daily_stats.columns = ['total_duration', 'event_count', 'avg_duration', 'meeting_count']
        
        # Monday vs Friday comparison (workload distribution)
        if 0 in daily_stats.index and 4 in daily_stats.index:  # Monday and Friday
            monday_duration = daily_stats.loc[0, 'total_duration']
            friday_duration = daily_stats.loc[4, 'total_duration']
            features['monday_friday_ratio'] = monday_duration / (friday_duration + 1e-6)
        else:
            features['monday_friday_ratio'] = 1.0
        
        # Weekly consistency (coefficient of variation)
        if len(daily_stats) > 1:
            features['weekly_consistency'] = daily_stats['total_duration'].std() / (daily_stats['total_duration'].mean() + 1e-6)
        else:
            features['weekly_consistency'] = 0.0
        
        return features
    
    def _extract_rolling_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract rolling averages and trends"""
        features = {}
        
        # Daily aggregation
        daily_stats = user_data.groupby('date').agg({
            'duration_minutes': 'sum',
            'event_id': 'count',
            'is_meeting': 'sum'
        }).reset_index()
        
        daily_stats.columns = ['date', 'total_duration', 'event_count', 'meeting_count']
        daily_stats = daily_stats.sort_values('date')
        
        if len(daily_stats) >= 7:
            # 7-day rolling averages
            daily_stats['duration_7d_avg'] = daily_stats['total_duration'].rolling(window=7, min_periods=1).mean()
            daily_stats['events_7d_avg'] = daily_stats['event_count'].rolling(window=7, min_periods=1).mean()
            daily_stats['meetings_7d_avg'] = daily_stats['meeting_count'].rolling(window=7, min_periods=1).mean()
            
            # Current vs average ratios
            latest = daily_stats.iloc[-1]
            features['current_vs_7d_avg_duration'] = latest['total_duration'] / (latest['duration_7d_avg'] + 1e-6)
            features['current_vs_7d_avg_events'] = latest['event_count'] / (latest['events_7d_avg'] + 1e-6)
            features['current_vs_7d_avg_meetings'] = latest['meeting_count'] / (latest['meetings_7d_avg'] + 1e-6)
            
            # Trend analysis (linear regression slope)
            if len(daily_stats) >= 3:
                x = np.arange(len(daily_stats))
                duration_slope = np.polyfit(x, daily_stats['total_duration'], 1)[0]
                events_slope = np.polyfit(x, daily_stats['event_count'], 1)[0]
                
                features['duration_trend_slope'] = duration_slope
                features['events_trend_slope'] = events_slope
            else:
                features['duration_trend_slope'] = 0.0
                features['events_trend_slope'] = 0.0
        else:
            features.update({
                'current_vs_7d_avg_duration': 1.0,
                'current_vs_7d_avg_events': 1.0,
                'current_vs_7d_avg_meetings': 1.0,
                'duration_trend_slope': 0.0,
                'events_trend_slope': 0.0
            })
        
        return features
    
    def _extract_work_life_balance_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract work-life balance indicators"""
        features = {}
        
        # Add time components
        user_data['hour'] = user_data['start_time'].dt.hour
        user_data['day_of_week'] = user_data['start_time'].dt.dayofweek
        user_data['is_weekend'] = user_data['day_of_week'].isin([5, 6])
        
        # Weekend work
        weekend_events = user_data[user_data['is_weekend']]
        features['weekend_events_ratio'] = len(weekend_events) / len(user_data)
        features['weekend_duration_ratio'] = weekend_events['duration_minutes'].sum() / (user_data['duration_minutes'].sum() + 1e-6)
        
        # After-hours work (before 8 AM or after 6 PM on weekdays)
        weekday_data = user_data[~user_data['is_weekend']]
        if not weekday_data.empty:
            after_hours = weekday_data[(weekday_data['hour'] < 8) | (weekday_data['hour'] > 18)]
            features['after_hours_events_ratio'] = len(after_hours) / len(weekday_data)
            features['after_hours_duration_ratio'] = after_hours['duration_minutes'].sum() / (weekday_data['duration_minutes'].sum() + 1e-6)
        else:
            features['after_hours_events_ratio'] = 0.0
            features['after_hours_duration_ratio'] = 0.0
        
        # Work intensity (events per hour during work hours)
        work_hours_data = weekday_data[(weekday_data['hour'] >= 8) & (weekday_data['hour'] <= 18)]
        if not work_hours_data.empty:
            work_hours_count = len(work_hours_data.groupby(['date', 'hour']))
            features['work_intensity'] = len(work_hours_data) / (work_hours_count + 1e-6)
        else:
            features['work_intensity'] = 0.0
        
        return features
    
    def _extract_meeting_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract meeting-specific patterns"""
        features = {}
        
        meetings = user_data[user_data['is_meeting']]
        if meetings.empty:
            return {
                'meeting_ratio': 0.0,
                'avg_meeting_duration': 0.0,
                'back_to_back_meetings_ratio': 0.0,
                'large_meetings_ratio': 0.0
            }
        
        # Basic meeting statistics
        features['meeting_ratio'] = len(meetings) / len(user_data)
        features['avg_meeting_duration'] = meetings['duration_minutes'].mean()
        
        # Back-to-back meetings (meetings starting within 15 minutes of previous ending)
        meetings_sorted = meetings.sort_values('start_time')
        back_to_back_count = 0
        
        for i in range(1, len(meetings_sorted)):
            prev_end = meetings_sorted.iloc[i-1]['start_time'] + timedelta(minutes=meetings_sorted.iloc[i-1]['duration_minutes'])
            curr_start = meetings_sorted.iloc[i]['start_time']
            
            if (curr_start - prev_end).total_seconds() <= 15 * 60:  # 15 minutes
                back_to_back_count += 1
        
        features['back_to_back_meetings_ratio'] = back_to_back_count / (len(meetings) - 1 + 1e-6)
        
        # Large meetings (more than 8 attendees)
        large_meetings = meetings[meetings['attendees_count'] > 8]
        features['large_meetings_ratio'] = len(large_meetings) / len(meetings)
        
        return features
    
    def _extract_email_daily_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract daily email patterns"""
        features = {}
        
        # Add time components
        user_data['hour'] = user_data['timestamp'].dt.hour
        user_data['day_of_week'] = user_data['timestamp'].dt.dayofweek
        user_data['is_weekend'] = user_data['day_of_week'].isin([5, 6])
        
        # Daily email statistics
        daily_emails = user_data.groupby('date').agg({
            'message_id': 'count',
            'is_sent': 'sum',
            'is_urgent': 'sum',
            'word_count': ['sum', 'mean']
        }).round(2)
        
        daily_emails.columns = ['email_count', 'sent_count', 'urgent_count', 'total_words', 'avg_words']
        
        features['avg_emails_per_day'] = daily_emails['email_count'].mean()
        features['email_count_std'] = daily_emails['email_count'].std()
        features['sent_email_ratio'] = user_data['is_sent'].mean()
        features['urgent_email_ratio'] = user_data['is_urgent'].mean()
        
        # After-hours email activity
        weekday_emails = user_data[~user_data['is_weekend']]
        if not weekday_emails.empty:
            after_hours_emails = weekday_emails[(weekday_emails['hour'] < 8) | (weekday_emails['hour'] > 18)]
            features['after_hours_email_ratio'] = len(after_hours_emails) / len(weekday_emails)
        else:
            features['after_hours_email_ratio'] = 0.0
        
        # Weekend email activity
        weekend_emails = user_data[user_data['is_weekend']]
        features['weekend_email_ratio'] = len(weekend_emails) / len(user_data)
        
        return features
    
    def _extract_email_frequency_trends(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract email frequency trends"""
        features = {}
        
        # Daily email counts
        daily_counts = user_data.groupby('date').size().reset_index(name='email_count')
        daily_counts = daily_counts.sort_values('date')
        
        if len(daily_counts) >= 7:
            # 7-day rolling average
            daily_counts['email_7d_avg'] = daily_counts['email_count'].rolling(window=7, min_periods=1).mean()
            
            # Current vs average ratio
            latest = daily_counts.iloc[-1]
            features['current_vs_7d_avg_emails'] = latest['email_count'] / (latest['email_7d_avg'] + 1e-6)
            
            # Trend analysis
            if len(daily_counts) >= 3:
                x = np.arange(len(daily_counts))
                email_slope = np.polyfit(x, daily_counts['email_count'], 1)[0]
                features['email_frequency_trend'] = email_slope
            else:
                features['email_frequency_trend'] = 0.0
        else:
            features['current_vs_7d_avg_emails'] = 1.0
            features['email_frequency_trend'] = 0.0
        
        return features
    
    def _extract_sentiment_trends(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract sentiment trends from emails"""
        features = {}
        
        if 'sentiment_score' not in user_data.columns:
            return {
                'avg_sentiment': 0.0,
                'sentiment_std': 0.0,
                'negative_sentiment_ratio': 0.0,
                'sentiment_trend': 0.0
            }
        
        # Basic sentiment statistics
        features['avg_sentiment'] = user_data['sentiment_score'].mean()
        features['sentiment_std'] = user_data['sentiment_score'].std()
        features['negative_sentiment_ratio'] = (user_data['sentiment_score'] < -0.1).mean()
        
        # Daily sentiment trends
        daily_sentiment = user_data.groupby('date')['sentiment_score'].mean().reset_index()
        daily_sentiment = daily_sentiment.sort_values('date')
        
        if len(daily_sentiment) >= 3:
            x = np.arange(len(daily_sentiment))
            sentiment_slope = np.polyfit(x, daily_sentiment['sentiment_score'], 1)[0]
            features['sentiment_trend'] = sentiment_slope
        else:
            features['sentiment_trend'] = 0.0
        
        return features
    
    def _extract_urgency_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract urgency patterns from emails"""
        features = {}
        
        if 'is_urgent' not in user_data.columns:
            return {
                'urgent_email_ratio': 0.0,
                'urgent_email_trend': 0.0,
                'urgent_after_hours_ratio': 0.0
            }
        
        # Basic urgency statistics
        features['urgent_email_ratio'] = user_data['is_urgent'].mean()
        
        # Daily urgency trends
        daily_urgency = user_data.groupby('date')['is_urgent'].mean().reset_index()
        daily_urgency = daily_urgency.sort_values('date')
        
        if len(daily_urgency) >= 3:
            x = np.arange(len(daily_urgency))
            urgency_slope = np.polyfit(x, daily_urgency['is_urgent'], 1)[0]
            features['urgent_email_trend'] = urgency_slope
        else:
            features['urgent_email_trend'] = 0.0
        
        # Urgent emails after hours
        user_data['hour'] = user_data['timestamp'].dt.hour
        after_hours_urgent = user_data[(user_data['hour'] < 8) | (user_data['hour'] > 18)]['is_urgent'].mean()
        features['urgent_after_hours_ratio'] = after_hours_urgent if not pd.isna(after_hours_urgent) else 0.0
        
        return features
    
    def _get_default_temporal_features(self) -> Dict[str, float]:
        """Return default values for temporal features when no data available"""
        return {
            'avg_work_hours_per_day': 0.0,
            'max_work_hours_per_day': 0.0,
            'work_hours_std': 0.0,
            'early_morning_work_ratio': 0.0,
            'late_evening_work_ratio': 0.0,
            'weekend_work_ratio': 0.0,
            'monday_friday_ratio': 1.0,
            'weekly_consistency': 0.0,
            'current_vs_7d_avg_duration': 1.0,
            'current_vs_7d_avg_events': 1.0,
            'current_vs_7d_avg_meetings': 1.0,
            'duration_trend_slope': 0.0,
            'events_trend_slope': 0.0,
            'after_hours_events_ratio': 0.0,
            'after_hours_duration_ratio': 0.0,
            'work_intensity': 0.0,
            'meeting_ratio': 0.0,
            'avg_meeting_duration': 0.0,
            'back_to_back_meetings_ratio': 0.0,
            'large_meetings_ratio': 0.0
        }
    
    def _get_default_email_temporal_features(self) -> Dict[str, float]:
        """Return default values for email temporal features when no data available"""
        return {
            'avg_emails_per_day': 0.0,
            'email_count_std': 0.0,
            'sent_email_ratio': 0.0,
            'urgent_email_ratio': 0.0,
            'after_hours_email_ratio': 0.0,
            'weekend_email_ratio': 0.0,
            'current_vs_7d_avg_emails': 1.0,
            'email_frequency_trend': 0.0,
            'avg_sentiment': 0.0,
            'sentiment_std': 0.0,
            'negative_sentiment_ratio': 0.0,
            'sentiment_trend': 0.0,
            'urgent_email_trend': 0.0,
            'urgent_after_hours_ratio': 0.0
        }

