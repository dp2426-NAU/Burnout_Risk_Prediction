# Text Features - Created by Balaji Koneti
"""
Text feature engineering for burnout risk prediction.
Extracts sentiment, urgency, and linguistic features from email content.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import re
import logging
from collections import Counter

logger = logging.getLogger(__name__)

class TextFeatureExtractor:
    """Extracts text-based features from email content"""
    
    def __init__(self):
        self.urgency_keywords = [
            'urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline',
            'rush', 'priority', 'important', 'time-sensitive', 'expedite'
        ]
        
        self.stress_keywords = [
            'stress', 'overwhelmed', 'burnout', 'exhausted', 'tired', 'frustrated',
            'anxious', 'worried', 'concerned', 'pressure', 'deadline', 'late',
            'behind', 'catch up', 'overworked', 'too much', 'can\'t handle'
        ]
        
        self.positive_keywords = [
            'great', 'excellent', 'good', 'happy', 'pleased', 'satisfied',
            'success', 'achievement', 'progress', 'improvement', 'thanks',
            'appreciate', 'grateful', 'excited', 'motivated', 'confident'
        ]
        
        self.negative_keywords = [
            'bad', 'terrible', 'awful', 'disappointed', 'frustrated', 'angry',
            'upset', 'concerned', 'worried', 'problem', 'issue', 'error',
            'mistake', 'failure', 'difficult', 'challenging', 'struggle'
        ]
    
    def extract_email_text_features(
        self, 
        email_data: pd.DataFrame,
        user_id: str
    ) -> Dict[str, float]:
        """
        Extract text features from email data
        
        Args:
            email_data: DataFrame with email messages
            user_id: User identifier
            
        Returns:
            Dictionary of text features
        """
        try:
            # Filter data for specific user
            user_data = email_data[email_data['user_id'] == user_id].copy()
            if user_data.empty:
                return self._get_default_text_features()
            
            features = {}
            
            # 1. Subject line analysis
            features.update(self._extract_subject_features(user_data))
            
            # 2. Content analysis (if available)
            if 'body' in user_data.columns:
                features.update(self._extract_content_features(user_data))
            
            # 3. Sentiment analysis
            features.update(self._extract_sentiment_features(user_data))
            
            # 4. Urgency detection
            features.update(self._extract_urgency_features(user_data))
            
            # 5. Communication patterns
            features.update(self._extract_communication_patterns(user_data))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting text features for user {user_id}: {str(e)}")
            return self._get_default_text_features()
    
    def _extract_subject_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract features from email subjects"""
        features = {}
        
        if 'subject' not in user_data.columns:
            return {
                'avg_subject_length': 0.0,
                'subject_urgency_ratio': 0.0,
                'subject_question_ratio': 0.0,
                'subject_exclamation_ratio': 0.0,
                'subject_caps_ratio': 0.0
            }
        
        subjects = user_data['subject'].fillna('').astype(str)
        
        # Subject length statistics
        subject_lengths = subjects.str.len()
        features['avg_subject_length'] = subject_lengths.mean()
        features['subject_length_std'] = subject_lengths.std()
        
        # Urgency indicators in subjects
        urgency_count = 0
        for subject in subjects:
            if any(keyword in subject.lower() for keyword in self.urgency_keywords):
                urgency_count += 1
        
        features['subject_urgency_ratio'] = urgency_count / len(subjects)
        
        # Question marks in subjects
        question_count = subjects.str.contains('\\?', regex=True).sum()
        features['subject_question_ratio'] = question_count / len(subjects)
        
        # Exclamation marks in subjects
        exclamation_count = subjects.str.contains('!', regex=True).sum()
        features['subject_exclamation_ratio'] = exclamation_count / len(subjects)
        
        # Capital letters ratio
        caps_ratios = []
        for subject in subjects:
            if len(subject) > 0:
                caps_ratio = sum(1 for c in subject if c.isupper()) / len(subject)
                caps_ratios.append(caps_ratio)
            else:
                caps_ratios.append(0.0)
        
        features['subject_caps_ratio'] = np.mean(caps_ratios)
        
        # Subject diversity (unique subjects / total subjects)
        features['subject_diversity'] = subjects.nunique() / len(subjects)
        
        return features
    
    def _extract_content_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract features from email content"""
        features = {}
        
        if 'body' not in user_data.columns:
            return {
                'avg_content_length': 0.0,
                'content_urgency_ratio': 0.0,
                'content_stress_ratio': 0.0,
                'content_positive_ratio': 0.0,
                'content_negative_ratio': 0.0
            }
        
        bodies = user_data['body'].fillna('').astype(str)
        
        # Content length statistics
        content_lengths = bodies.str.len()
        features['avg_content_length'] = content_lengths.mean()
        features['content_length_std'] = content_lengths.std()
        
        # Word count statistics
        word_counts = bodies.str.split().str.len()
        features['avg_word_count'] = word_counts.mean()
        features['word_count_std'] = word_counts.std()
        
        # Keyword analysis
        urgency_count = 0
        stress_count = 0
        positive_count = 0
        negative_count = 0
        
        for body in bodies:
            body_lower = body.lower()
            
            if any(keyword in body_lower for keyword in self.urgency_keywords):
                urgency_count += 1
            
            if any(keyword in body_lower for keyword in self.stress_keywords):
                stress_count += 1
            
            if any(keyword in body_lower for keyword in self.positive_keywords):
                positive_count += 1
            
            if any(keyword in body_lower for keyword in self.negative_keywords):
                negative_count += 1
        
        features['content_urgency_ratio'] = urgency_count / len(bodies)
        features['content_stress_ratio'] = stress_count / len(bodies)
        features['content_positive_ratio'] = positive_count / len(bodies)
        features['content_negative_ratio'] = negative_count / len(bodies)
        
        # Readability features
        features.update(self._extract_readability_features(bodies))
        
        return features
    
    def _extract_readability_features(self, bodies: pd.Series) -> Dict[str, float]:
        """Extract readability features from email content"""
        features = {}
        
        total_sentences = 0
        total_words = 0
        total_syllables = 0
        
        for body in bodies:
            if len(body.strip()) == 0:
                continue
                
            # Count sentences (simple heuristic)
            sentences = re.split(r'[.!?]+', body)
            sentences = [s.strip() for s in sentences if s.strip()]
            total_sentences += len(sentences)
            
            # Count words
            words = body.split()
            total_words += len(words)
            
            # Count syllables (approximate)
            for word in words:
                total_syllables += self._count_syllables(word)
        
        if total_sentences > 0 and total_words > 0:
            # Average sentence length
            features['avg_sentence_length'] = total_words / total_sentences
            
            # Average syllables per word
            features['avg_syllables_per_word'] = total_syllables / total_words
            
            # Flesch Reading Ease (simplified)
            features['flesch_reading_ease'] = 206.835 - (1.015 * features['avg_sentence_length']) - (84.6 * features['avg_syllables_per_word'])
        else:
            features['avg_sentence_length'] = 0.0
            features['avg_syllables_per_word'] = 0.0
            features['flesch_reading_ease'] = 0.0
        
        return features
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (approximate)"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            if char in vowels:
                if not prev_was_vowel:
                    syllable_count += 1
                prev_was_vowel = True
            else:
                prev_was_vowel = False
        
        # Handle silent 'e'
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def _extract_sentiment_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract sentiment features from emails"""
        features = {}
        
        if 'sentiment_score' not in user_data.columns:
            return {
                'avg_sentiment': 0.0,
                'sentiment_std': 0.0,
                'positive_sentiment_ratio': 0.0,
                'negative_sentiment_ratio': 0.0,
                'neutral_sentiment_ratio': 0.0
            }
        
        sentiment_scores = user_data['sentiment_score'].fillna(0)
        
        # Basic sentiment statistics
        features['avg_sentiment'] = sentiment_scores.mean()
        features['sentiment_std'] = sentiment_scores.std()
        features['sentiment_range'] = sentiment_scores.max() - sentiment_scores.min()
        
        # Sentiment distribution
        positive_count = (sentiment_scores > 0.1).sum()
        negative_count = (sentiment_scores < -0.1).sum()
        neutral_count = ((sentiment_scores >= -0.1) & (sentiment_scores <= 0.1)).sum()
        
        total_emails = len(sentiment_scores)
        features['positive_sentiment_ratio'] = positive_count / total_emails
        features['negative_sentiment_ratio'] = negative_count / total_emails
        features['neutral_sentiment_ratio'] = neutral_count / total_emails
        
        # Sentiment volatility (how much sentiment changes)
        if len(sentiment_scores) > 1:
            sentiment_changes = sentiment_scores.diff().abs()
            features['sentiment_volatility'] = sentiment_changes.mean()
        else:
            features['sentiment_volatility'] = 0.0
        
        return features
    
    def _extract_urgency_features(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract urgency features from emails"""
        features = {}
        
        if 'is_urgent' not in user_data.columns:
            return {
                'urgent_email_ratio': 0.0,
                'urgent_subject_ratio': 0.0,
                'urgent_content_ratio': 0.0
            }
        
        # Basic urgency statistics
        features['urgent_email_ratio'] = user_data['is_urgent'].mean()
        
        # Urgency in subjects
        if 'subject' in user_data.columns:
            urgent_subjects = 0
            for _, row in user_data.iterrows():
                if row['is_urgent'] and 'subject' in row:
                    subject = str(row['subject']).lower()
                    if any(keyword in subject for keyword in self.urgency_keywords):
                        urgent_subjects += 1
            
            features['urgent_subject_ratio'] = urgent_subjects / len(user_data)
        else:
            features['urgent_subject_ratio'] = 0.0
        
        # Urgency in content
        if 'body' in user_data.columns:
            urgent_content = 0
            for _, row in user_data.iterrows():
                if row['is_urgent'] and 'body' in row:
                    body = str(row['body']).lower()
                    if any(keyword in body for keyword in self.urgency_keywords):
                        urgent_content += 1
            
            features['urgent_content_ratio'] = urgent_content / len(user_data)
        else:
            features['urgent_content_ratio'] = 0.0
        
        return features
    
    def _extract_communication_patterns(self, user_data: pd.DataFrame) -> Dict[str, float]:
        """Extract communication pattern features"""
        features = {}
        
        # Sent vs received ratio
        if 'is_sent' in user_data.columns:
            features['sent_email_ratio'] = user_data['is_sent'].mean()
        else:
            features['sent_email_ratio'] = 0.0
        
        # Communication frequency patterns
        if 'timestamp' in user_data.columns:
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            user_data['hour'] = user_data['timestamp'].dt.hour
            user_data['day_of_week'] = user_data['timestamp'].dt.dayofweek
            
            # Peak communication hours
            hourly_counts = user_data['hour'].value_counts()
            if not hourly_counts.empty:
                features['peak_communication_hour'] = hourly_counts.idxmax()
                features['communication_concentration'] = hourly_counts.max() / len(user_data)
            else:
                features['peak_communication_hour'] = 12  # Default to noon
                features['communication_concentration'] = 0.0
            
            # Weekend communication
            weekend_emails = user_data[user_data['day_of_week'].isin([5, 6])]
            features['weekend_communication_ratio'] = len(weekend_emails) / len(user_data)
        else:
            features['peak_communication_hour'] = 12
            features['communication_concentration'] = 0.0
            features['weekend_communication_ratio'] = 0.0
        
        # Response time patterns (if we have conversation threads)
        # This would require more complex email threading analysis
        features['avg_response_time_hours'] = 0.0  # Placeholder
        
        return features
    
    def _get_default_text_features(self) -> Dict[str, float]:
        """Return default values for text features when no data available"""
        return {
            'avg_subject_length': 0.0,
            'subject_length_std': 0.0,
            'subject_urgency_ratio': 0.0,
            'subject_question_ratio': 0.0,
            'subject_exclamation_ratio': 0.0,
            'subject_caps_ratio': 0.0,
            'subject_diversity': 0.0,
            'avg_content_length': 0.0,
            'content_length_std': 0.0,
            'avg_word_count': 0.0,
            'word_count_std': 0.0,
            'content_urgency_ratio': 0.0,
            'content_stress_ratio': 0.0,
            'content_positive_ratio': 0.0,
            'content_negative_ratio': 0.0,
            'avg_sentence_length': 0.0,
            'avg_syllables_per_word': 0.0,
            'flesch_reading_ease': 0.0,
            'avg_sentiment': 0.0,
            'sentiment_std': 0.0,
            'sentiment_range': 0.0,
            'positive_sentiment_ratio': 0.0,
            'negative_sentiment_ratio': 0.0,
            'neutral_sentiment_ratio': 0.0,
            'sentiment_volatility': 0.0,
            'urgent_email_ratio': 0.0,
            'urgent_subject_ratio': 0.0,
            'urgent_content_ratio': 0.0,
            'sent_email_ratio': 0.0,
            'peak_communication_hour': 12,
            'communication_concentration': 0.0,
            'weekend_communication_ratio': 0.0,
            'avg_response_time_hours': 0.0
        }

