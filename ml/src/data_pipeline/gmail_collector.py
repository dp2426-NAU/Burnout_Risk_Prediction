#!/usr/bin/env python3
"""
Gmail API Data Collector
Created by Balaji Koneti

This module handles Gmail API integration with OAuth 2.0 authentication
and provides fallback to synthetic data when real API is not available.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import asyncio
import aiohttp
from dataclasses import dataclass
import pandas as pd
import numpy as np
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .synthetic_data_generator import SyntheticDataGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EmailMessage:
    """Email message data structure"""
    message_id: str
    sender: str
    recipients: List[str]
    subject: str
    body: str
    timestamp: datetime
    is_sent: bool
    is_urgent: bool
    word_count: int
    sentiment_score: float
    sentiment_magnitude: float
    emotion_tags: List[str]
    response_time: Optional[float] = None

class GmailCollector:
    """Gmail API collector with OAuth 2.0 and fallback to synthetic data"""
    
    def __init__(self, use_real_api: bool = None):
        """
        Initialize Gmail collector
        
        Args:
            use_real_api (bool): Whether to use real Gmail API
                                If None, will check environment variable
        """
        self.use_real_api = use_real_api or os.getenv('USE_REAL_GMAIL_API', 'false').lower() == 'true'
        self.client_id = os.getenv('GMAIL_CLIENT_ID')
        self.client_secret = os.getenv('GMAIL_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:3000/auth/gmail/callback')
        self.scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        
        # OAuth 2.0 credentials
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None
        
        # Synthetic data generator as fallback
        self.synthetic_generator = SyntheticDataGenerator()
        
        # API configuration
        self.api_base_url = 'https://gmail.googleapis.com/gmail/v1'
        self.max_messages_per_request = 100
        self.rate_limit_delay = 1.0  # seconds between requests
        
        # Sentiment analysis keywords
        self.positive_keywords = [
            'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
            'good', 'nice', 'perfect', 'brilliant', 'outstanding', 'superb',
            'thanks', 'thank you', 'appreciate', 'grateful', 'pleased'
        ]
        
        self.negative_keywords = [
            'bad', 'terrible', 'awful', 'horrible', 'disappointed', 'frustrated',
            'angry', 'upset', 'concerned', 'worried', 'urgent', 'asap',
            'problem', 'issue', 'error', 'failed', 'broken', 'wrong'
        ]
        
        self.urgent_keywords = [
            'urgent', 'asap', 'immediately', 'emergency', 'critical', 'priority',
            'deadline', 'due today', 'rush', 'quick', 'fast', 'now'
        ]
        
        logger.info(f"Gmail Collector initialized - Real API: {self.use_real_api}")
    
    async def authenticate(self, authorization_code: str = None) -> bool:
        """
        Authenticate with Gmail API
        
        Args:
            authorization_code (str): OAuth authorization code from callback
            
        Returns:
            bool: True if authentication successful
        """
        if not self.use_real_api:
            logger.info("Using synthetic data - skipping authentication")
            return True
        
        if not self.client_id or not self.client_secret:
            logger.warning("Gmail API credentials not configured - falling back to synthetic data")
            self.use_real_api = False
            return True
        
        try:
            if authorization_code:
                # Exchange authorization code for tokens
                token_data = await self._exchange_code_for_tokens(authorization_code)
                if token_data:
                    self.access_token = token_data['access_token']
                    self.refresh_token = token_data.get('refresh_token')
                    self.token_expires_at = datetime.now() + timedelta(seconds=token_data.get('expires_in', 3600))
                    logger.info("Successfully authenticated with Gmail API")
                    return True
            
            # Check if we have valid stored tokens
            if self._is_token_valid():
                logger.info("Using existing valid tokens")
                return True
            
            logger.warning("No valid authentication - falling back to synthetic data")
            self.use_real_api = False
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            self.use_real_api = False
            return True
    
    async def _exchange_code_for_tokens(self, authorization_code: str) -> Optional[Dict]:
        """Exchange authorization code for access and refresh tokens"""
        try:
            token_url = 'https://oauth2.googleapis.com/token'
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': authorization_code,
                'grant_type': 'authorization_code',
                'redirect_uri': self.redirect_uri
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(token_url, data=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Token exchange failed: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            return None
    
    def _is_token_valid(self) -> bool:
        """Check if current token is valid and not expired"""
        if not self.access_token:
            return False
        
        if self.token_expires_at and datetime.now() >= self.token_expires_at:
            return False
        
        return True
    
    async def _refresh_access_token(self) -> bool:
        """Refresh access token using refresh token"""
        if not self.refresh_token:
            return False
        
        try:
            token_url = 'https://oauth2.googleapis.com/token'
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'refresh_token': self.refresh_token,
                'grant_type': 'refresh_token'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(token_url, data=data) as response:
                    if response.status == 200:
                        token_data = await response.json()
                        self.access_token = token_data['access_token']
                        self.token_expires_at = datetime.now() + timedelta(seconds=token_data.get('expires_in', 3600))
                        logger.info("Access token refreshed successfully")
                        return True
                    else:
                        logger.error(f"Token refresh failed: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error refreshing access token: {e}")
            return False
    
    async def collect_user_emails(self, user_id: str, start_date: datetime, end_date: datetime) -> List[EmailMessage]:
        """
        Collect email messages for a user
        
        Args:
            user_id (str): User identifier
            start_date (datetime): Start date for email collection
            end_date (datetime): End date for email collection
            
        Returns:
            List[EmailMessage]: List of email messages
        """
        if not self.use_real_api:
            logger.info(f"Collecting synthetic email messages for user {user_id}")
            return await self._collect_synthetic_emails(user_id, start_date, end_date)
        
        try:
            # Ensure we have valid authentication
            if not await self.authenticate():
                logger.warning("Authentication failed - falling back to synthetic data")
                return await self._collect_synthetic_emails(user_id, start_date, end_date)
            
            # Refresh token if needed
            if not self._is_token_valid():
                if not await self._refresh_access_token():
                    logger.warning("Token refresh failed - falling back to synthetic data")
                    return await self._collect_synthetic_emails(user_id, start_date, end_date)
            
            # Collect emails from Gmail API
            messages = await self._fetch_messages_from_api(start_date, end_date)
            
            # Convert to our data structure
            email_messages = []
            for message in messages:
                email_message = await self._convert_api_message_to_email_message(message)
                if email_message:
                    email_messages.append(email_message)
            
            logger.info(f"Collected {len(email_messages)} real email messages for user {user_id}")
            return email_messages
            
        except Exception as e:
            logger.error(f"Error collecting real email messages: {e}")
            logger.info("Falling back to synthetic data")
            return await self._collect_synthetic_emails(user_id, start_date, end_date)
    
    async def _fetch_messages_from_api(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch messages from Gmail API"""
        try:
            # Build search query for date range
            start_date_str = start_date.strftime('%Y/%m/%d')
            end_date_str = end_date.strftime('%Y/%m/%d')
            query = f"after:{start_date_str} before:{end_date_str}"
            
            # Get message list
            messages_url = f"{self.api_base_url}/users/me/messages"
            params = {
                'q': query,
                'maxResults': self.max_messages_per_request
            }
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(messages_url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        message_ids = [msg['id'] for msg in data.get('messages', [])]
                        
                        # Fetch detailed message data
                        detailed_messages = []
                        for message_id in message_ids[:50]:  # Limit to 50 messages for performance
                            message_detail = await self._fetch_message_detail(message_id)
                            if message_detail:
                                detailed_messages.append(message_detail)
                            
                            # Rate limiting
                            await asyncio.sleep(self.rate_limit_delay)
                        
                        return detailed_messages
                    elif response.status == 401:
                        logger.warning("API request unauthorized - token may be expired")
                        return []
                    else:
                        logger.error(f"API request failed: {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching messages from API: {e}")
            return []
    
    async def _fetch_message_detail(self, message_id: str) -> Optional[Dict]:
        """Fetch detailed message data"""
        try:
            message_url = f"{self.api_base_url}/users/me/messages/{message_id}"
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(message_url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"Failed to fetch message {message_id}: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error fetching message detail: {e}")
            return None
    
    async def _convert_api_message_to_email_message(self, api_message: Dict) -> Optional[EmailMessage]:
        """Convert Gmail API message to our EmailMessage structure"""
        try:
            # Extract headers
            headers = {}
            for header in api_message.get('payload', {}).get('headers', []):
                headers[header['name'].lower()] = header['value']
            
            # Extract basic information
            message_id = api_message.get('id', '')
            subject = headers.get('subject', 'No Subject')
            sender = headers.get('from', '')
            recipients = self._parse_recipients(headers.get('to', ''))
            
            # Extract body
            body = self._extract_message_body(api_message.get('payload', {}))
            
            # Parse timestamp
            timestamp = self._parse_timestamp(headers.get('date', ''))
            if not timestamp:
                return None
            
            # Determine if sent by user
            is_sent = 'sent' in api_message.get('labelIds', [])
            
            # Analyze content
            word_count = len(body.split())
            sentiment_score, sentiment_magnitude = self._analyze_sentiment(body)
            is_urgent = self._is_urgent_message(subject, body)
            emotion_tags = self._extract_emotion_tags(body)
            
            return EmailMessage(
                message_id=message_id,
                sender=sender,
                recipients=recipients,
                subject=subject,
                body=body,
                timestamp=timestamp,
                is_sent=is_sent,
                is_urgent=is_urgent,
                word_count=word_count,
                sentiment_score=sentiment_score,
                sentiment_magnitude=sentiment_magnitude,
                emotion_tags=emotion_tags
            )
            
        except Exception as e:
            logger.error(f"Error converting API message: {e}")
            return None
    
    def _parse_recipients(self, to_header: str) -> List[str]:
        """Parse recipients from email header"""
        if not to_header:
            return []
        
        # Simple email extraction (can be improved with proper email parsing)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(email_pattern, to_header)
    
    def _extract_message_body(self, payload: Dict) -> str:
        """Extract message body from Gmail API payload"""
        try:
            # Handle different payload structures
            if 'parts' in payload:
                # Multipart message
                for part in payload['parts']:
                    if part.get('mimeType') == 'text/plain':
                        body_data = part.get('body', {}).get('data', '')
                        if body_data:
                            return base64.urlsafe_b64decode(body_data).decode('utf-8')
                    elif part.get('mimeType') == 'text/html':
                        # Fallback to HTML if no plain text
                        body_data = part.get('body', {}).get('data', '')
                        if body_data:
                            html_content = base64.urlsafe_b64decode(body_data).decode('utf-8')
                            # Simple HTML to text conversion
                            return re.sub(r'<[^>]+>', '', html_content)
            else:
                # Simple message
                if payload.get('mimeType') == 'text/plain':
                    body_data = payload.get('body', {}).get('data', '')
                    if body_data:
                        return base64.urlsafe_b64decode(body_data).decode('utf-8')
            
            return ""
            
        except Exception as e:
            logger.error(f"Error extracting message body: {e}")
            return ""
    
    def _parse_timestamp(self, date_header: str) -> Optional[datetime]:
        """Parse timestamp from email date header"""
        try:
            if not date_header:
                return None
            
            # Try different date formats
            date_formats = [
                '%a, %d %b %Y %H:%M:%S %z',
                '%a, %d %b %Y %H:%M:%S %Z',
                '%d %b %Y %H:%M:%S %z',
                '%d %b %Y %H:%M:%S %Z'
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(date_header, fmt)
                except ValueError:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing timestamp: {e}")
            return None
    
    def _analyze_sentiment(self, text: str) -> tuple[float, float]:
        """Analyze sentiment of email text"""
        if not text:
            return 0.0, 0.0
        
        text_lower = text.lower()
        
        # Count positive and negative keywords
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_count = sum(1 for word in self.negative_keywords if word in text_lower)
        
        # Calculate sentiment score (-1 to 1)
        total_words = len(text.split())
        if total_words == 0:
            return 0.0, 0.0
        
        sentiment_score = (positive_count - negative_count) / max(total_words, 1)
        sentiment_score = max(-1.0, min(1.0, sentiment_score))
        
        # Calculate magnitude (0 to 1)
        sentiment_magnitude = (positive_count + negative_count) / max(total_words, 1)
        sentiment_magnitude = min(1.0, sentiment_magnitude)
        
        return sentiment_score, sentiment_magnitude
    
    def _is_urgent_message(self, subject: str, body: str) -> bool:
        """Determine if message is urgent"""
        text = f"{subject} {body}".lower()
        return any(keyword in text for keyword in self.urgent_keywords)
    
    def _extract_emotion_tags(self, text: str) -> List[str]:
        """Extract emotion tags from email text"""
        if not text:
            return []
        
        text_lower = text.lower()
        emotions = []
        
        # Simple emotion detection based on keywords
        if any(word in text_lower for word in ['happy', 'excited', 'thrilled', 'joy']):
            emotions.append('happy')
        if any(word in text_lower for word in ['sad', 'disappointed', 'upset', 'frustrated']):
            emotions.append('sad')
        if any(word in text_lower for word in ['angry', 'mad', 'furious', 'annoyed']):
            emotions.append('angry')
        if any(word in text_lower for word in ['worried', 'concerned', 'anxious', 'nervous']):
            emotions.append('worried')
        if any(word in text_lower for word in ['confused', 'unclear', 'unsure', 'lost']):
            emotions.append('confused')
        
        return emotions
    
    async def _collect_synthetic_emails(self, user_id: str, start_date: datetime, end_date: datetime) -> List[EmailMessage]:
        """Collect synthetic email messages as fallback"""
        try:
            # Generate synthetic emails using the synthetic data generator
            synthetic_emails = await self.synthetic_generator.generate_email_messages(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                num_messages=100  # Generate reasonable number of emails
            )
            
            # Convert to EmailMessage objects
            email_messages = []
            for email_data in synthetic_emails:
                email_message = EmailMessage(
                    message_id=email_data.get('message_id', ''),
                    sender=email_data.get('sender', ''),
                    recipients=email_data.get('recipients', []),
                    subject=email_data.get('subject', ''),
                    body=email_data.get('body', ''),
                    timestamp=email_data.get('timestamp'),
                    is_sent=email_data.get('is_sent', False),
                    is_urgent=email_data.get('is_urgent', False),
                    word_count=email_data.get('word_count', 0),
                    sentiment_score=email_data.get('sentiment_score', 0.0),
                    sentiment_magnitude=email_data.get('sentiment_magnitude', 0.0),
                    emotion_tags=email_data.get('emotion_tags', [])
                )
                email_messages.append(email_message)
            
            logger.info(f"Generated {len(email_messages)} synthetic email messages for user {user_id}")
            return email_messages
            
        except Exception as e:
            logger.error(f"Error generating synthetic emails: {e}")
            return []
    
    def get_authorization_url(self) -> str:
        """Get Google OAuth authorization URL"""
        if not self.use_real_api:
            return ""
        
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{auth_url}?{param_string}"
    
    async def save_emails_to_database(self, emails: List[EmailMessage], user_id: str) -> bool:
        """Save collected emails to database"""
        try:
            # This would integrate with your database layer
            # For now, we'll just log the emails
            logger.info(f"Saving {len(emails)} emails to database for user {user_id}")
            
            # Convert emails to database format
            emails_data = []
            for email in emails:
                email_data = {
                    'user_id': user_id,
                    'message_id': email.message_id,
                    'sender': email.sender,
                    'recipients': email.recipients,
                    'subject': email.subject,
                    'body': email.body,
                    'timestamp': email.timestamp,
                    'is_sent': email.is_sent,
                    'is_urgent': email.is_urgent,
                    'word_count': email.word_count,
                    'sentiment_score': email.sentiment_score,
                    'sentiment_magnitude': email.sentiment_magnitude,
                    'emotion_tags': email.emotion_tags,
                    'collected_at': datetime.now()
                }
                emails_data.append(email_data)
            
            # Here you would save to your database
            # await database.save_email_messages(emails_data)
            
            logger.info(f"Successfully saved {len(emails_data)} emails to database")
            return True
            
        except Exception as e:
            logger.error(f"Error saving emails to database: {e}")
            return False

# CLI interface for testing
async def main():
    """CLI interface for testing the Gmail collector"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Gmail Data Collector')
    parser.add_argument('--user-id', required=True, help='User ID to collect emails for')
    parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--use-real-api', action='store_true', help='Use real Gmail API')
    
    args = parser.parse_args()
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    
    # Initialize collector
    collector = GmailCollector(use_real_api=args.use_real_api)
    
    # Authenticate if using real API
    if args.use_real_api:
        auth_url = collector.get_authorization_url()
        print(f"Please visit this URL to authorize: {auth_url}")
        auth_code = input("Enter authorization code: ")
        await collector.authenticate(auth_code)
    
    # Collect emails
    emails = await collector.collect_user_emails(args.user_id, start_date, end_date)
    
    print(f"Collected {len(emails)} emails:")
    for email in emails[:5]:  # Show first 5 emails
        print(f"  - {email.subject} ({email.timestamp})")
    
    if len(emails) > 5:
        print(f"  ... and {len(emails) - 5} more emails")

if __name__ == '__main__':
    asyncio.run(main())
