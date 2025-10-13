#!/usr/bin/env python3
"""
Google Calendar API Data Collector
Created by Balaji Koneti

This module handles Google Calendar API integration with OAuth 2.0 authentication
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

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .synthetic_data_generator import SyntheticDataGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CalendarEvent:
    """Calendar event data structure"""
    event_id: str
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: List[str] = None
    is_virtual: bool = False
    event_type: str = "meeting"
    stress_level: int = 3
    workload: int = 3

class GoogleCalendarCollector:
    """Google Calendar API collector with OAuth 2.0 and fallback to synthetic data"""
    
    def __init__(self, use_real_api: bool = None):
        """
        Initialize Google Calendar collector
        
        Args:
            use_real_api (bool): Whether to use real Google Calendar API
                                If None, will check environment variable
        """
        self.use_real_api = use_real_api or os.getenv('USE_REAL_CALENDAR_API', 'false').lower() == 'true'
        self.client_id = os.getenv('GOOGLE_CALENDAR_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CALENDAR_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_CALENDAR_REDIRECT_URI', 'http://localhost:3000/auth/google/callback')
        self.scopes = ['https://www.googleapis.com/auth/calendar.readonly']
        
        # OAuth 2.0 credentials
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None
        
        # Synthetic data generator as fallback
        self.synthetic_generator = SyntheticDataGenerator()
        
        # API configuration
        self.api_base_url = 'https://www.googleapis.com/calendar/v3'
        self.max_events_per_request = 250
        self.rate_limit_delay = 1.0  # seconds between requests
        
        logger.info(f"Google Calendar Collector initialized - Real API: {self.use_real_api}")
    
    async def authenticate(self, authorization_code: str = None) -> bool:
        """
        Authenticate with Google Calendar API
        
        Args:
            authorization_code (str): OAuth authorization code from callback
            
        Returns:
            bool: True if authentication successful
        """
        if not self.use_real_api:
            logger.info("Using synthetic data - skipping authentication")
            return True
        
        if not self.client_id or not self.client_secret:
            logger.warning("Google Calendar API credentials not configured - falling back to synthetic data")
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
                    logger.info("Successfully authenticated with Google Calendar API")
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
    
    async def collect_user_events(self, user_id: str, start_date: datetime, end_date: datetime) -> List[CalendarEvent]:
        """
        Collect calendar events for a user
        
        Args:
            user_id (str): User identifier
            start_date (datetime): Start date for event collection
            end_date (datetime): End date for event collection
            
        Returns:
            List[CalendarEvent]: List of calendar events
        """
        if not self.use_real_api:
            logger.info(f"Collecting synthetic calendar events for user {user_id}")
            return await self._collect_synthetic_events(user_id, start_date, end_date)
        
        try:
            # Ensure we have valid authentication
            if not await self.authenticate():
                logger.warning("Authentication failed - falling back to synthetic data")
                return await self._collect_synthetic_events(user_id, start_date, end_date)
            
            # Refresh token if needed
            if not self._is_token_valid():
                if not await self._refresh_access_token():
                    logger.warning("Token refresh failed - falling back to synthetic data")
                    return await self._collect_synthetic_events(user_id, start_date, end_date)
            
            # Collect events from Google Calendar API
            events = await self._fetch_events_from_api(start_date, end_date)
            
            # Convert to our data structure
            calendar_events = []
            for event in events:
                calendar_event = self._convert_api_event_to_calendar_event(event)
                if calendar_event:
                    calendar_events.append(calendar_event)
            
            logger.info(f"Collected {len(calendar_events)} real calendar events for user {user_id}")
            return calendar_events
            
        except Exception as e:
            logger.error(f"Error collecting real calendar events: {e}")
            logger.info("Falling back to synthetic data")
            return await self._collect_synthetic_events(user_id, start_date, end_date)
    
    async def _fetch_events_from_api(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch events from Google Calendar API"""
        try:
            events_url = f"{self.api_base_url}/calendars/primary/events"
            params = {
                'timeMin': start_date.isoformat() + 'Z',
                'timeMax': end_date.isoformat() + 'Z',
                'maxResults': self.max_events_per_request,
                'singleEvents': True,
                'orderBy': 'startTime'
            }
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Accept': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(events_url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('items', [])
                    elif response.status == 401:
                        logger.warning("API request unauthorized - token may be expired")
                        return []
                    else:
                        logger.error(f"API request failed: {response.status}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error fetching events from API: {e}")
            return []
    
    def _convert_api_event_to_calendar_event(self, api_event: Dict) -> Optional[CalendarEvent]:
        """Convert Google Calendar API event to our CalendarEvent structure"""
        try:
            # Extract basic information
            event_id = api_event.get('id', '')
            title = api_event.get('summary', 'Untitled Event')
            
            # Parse start and end times
            start_data = api_event.get('start', {})
            end_data = api_event.get('end', {})
            
            start_time = self._parse_datetime(start_data)
            end_time = self._parse_datetime(end_data)
            
            if not start_time or not end_time:
                return None
            
            # Extract additional information
            description = api_event.get('description', '')
            location = api_event.get('location', '')
            
            # Extract attendees
            attendees = []
            for attendee in api_event.get('attendees', []):
                email = attendee.get('email', '')
                if email:
                    attendees.append(email)
            
            # Determine if event is virtual
            is_virtual = self._is_virtual_event(api_event, location)
            
            # Determine event type
            event_type = self._classify_event_type(title, description)
            
            # Calculate stress and workload levels
            stress_level = self._calculate_stress_level(api_event, attendees)
            workload = self._calculate_workload(start_time, end_time, event_type)
            
            return CalendarEvent(
                event_id=event_id,
                title=title,
                start_time=start_time,
                end_time=end_time,
                description=description,
                location=location,
                attendees=attendees,
                is_virtual=is_virtual,
                event_type=event_type,
                stress_level=stress_level,
                workload=workload
            )
            
        except Exception as e:
            logger.error(f"Error converting API event: {e}")
            return None
    
    def _parse_datetime(self, datetime_data: Dict) -> Optional[datetime]:
        """Parse datetime from Google Calendar API response"""
        try:
            if 'dateTime' in datetime_data:
                return datetime.fromisoformat(datetime_data['dateTime'].replace('Z', '+00:00'))
            elif 'date' in datetime_data:
                return datetime.fromisoformat(datetime_data['date'])
            return None
        except Exception as e:
            logger.error(f"Error parsing datetime: {e}")
            return None
    
    def _is_virtual_event(self, api_event: Dict, location: str) -> bool:
        """Determine if event is virtual based on event data"""
        # Check for virtual meeting indicators
        virtual_indicators = [
            'zoom', 'teams', 'meet', 'webex', 'skype', 'virtual',
            'online', 'remote', 'video call', 'video conference'
        ]
        
        title = api_event.get('summary', '').lower()
        description = api_event.get('description', '').lower()
        location_lower = location.lower()
        
        for indicator in virtual_indicators:
            if (indicator in title or 
                indicator in description or 
                indicator in location_lower):
                return True
        
        return False
    
    def _classify_event_type(self, title: str, description: str) -> str:
        """Classify event type based on title and description"""
        title_lower = title.lower()
        description_lower = description.lower()
        
        # Meeting types
        if any(word in title_lower for word in ['standup', 'daily', 'scrum']):
            return 'standup'
        elif any(word in title_lower for word in ['1:1', 'one-on-one', 'one on one']):
            return 'one_on_one'
        elif any(word in title_lower for word in ['review', 'retrospective', 'retro']):
            return 'review'
        elif any(word in title_lower for word in ['planning', 'planning session']):
            return 'planning'
        elif any(word in title_lower for word in ['focus', 'deep work', 'coding']):
            return 'focus_time'
        elif any(word in title_lower for word in ['break', 'lunch', 'coffee']):
            return 'break'
        else:
            return 'meeting'
    
    def _calculate_stress_level(self, api_event: Dict, attendees: List[str]) -> int:
        """Calculate stress level for an event (1-5 scale)"""
        stress_score = 3  # Default moderate stress
        
        # More attendees = higher stress
        if len(attendees) > 10:
            stress_score += 1
        elif len(attendees) > 5:
            stress_score += 0.5
        
        # Check for urgent indicators
        title = api_event.get('summary', '').lower()
        if any(word in title for word in ['urgent', 'asap', 'emergency', 'critical']):
            stress_score += 1
        
        # Check for deadline indicators
        if any(word in title for word in ['deadline', 'due', 'final', 'last chance']):
            stress_score += 1
        
        return min(5, max(1, int(stress_score)))
    
    def _calculate_workload(self, start_time: datetime, end_time: datetime, event_type: str) -> int:
        """Calculate workload for an event (1-5 scale)"""
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        # Base workload on duration
        if duration_hours > 2:
            workload = 5
        elif duration_hours > 1:
            workload = 4
        elif duration_hours > 0.5:
            workload = 3
        else:
            workload = 2
        
        # Adjust based on event type
        if event_type in ['focus_time', 'deep work']:
            workload += 1
        elif event_type in ['break', 'lunch']:
            workload = 1
        
        return min(5, max(1, workload))
    
    async def _collect_synthetic_events(self, user_id: str, start_date: datetime, end_date: datetime) -> List[CalendarEvent]:
        """Collect synthetic calendar events as fallback"""
        try:
            # Generate synthetic events using the synthetic data generator
            synthetic_events = await self.synthetic_generator.generate_calendar_events(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                num_events=50  # Generate reasonable number of events
            )
            
            # Convert to CalendarEvent objects
            calendar_events = []
            for event_data in synthetic_events:
                calendar_event = CalendarEvent(
                    event_id=event_data.get('event_id', ''),
                    title=event_data.get('title', ''),
                    start_time=event_data.get('start_time'),
                    end_time=event_data.get('end_time'),
                    description=event_data.get('description', ''),
                    location=event_data.get('location', ''),
                    attendees=event_data.get('attendees', []),
                    is_virtual=event_data.get('is_virtual', False),
                    event_type=event_data.get('event_type', 'meeting'),
                    stress_level=event_data.get('stress_level', 3),
                    workload=event_data.get('workload', 3)
                )
                calendar_events.append(calendar_event)
            
            logger.info(f"Generated {len(calendar_events)} synthetic calendar events for user {user_id}")
            return calendar_events
            
        except Exception as e:
            logger.error(f"Error generating synthetic events: {e}")
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
    
    async def save_events_to_database(self, events: List[CalendarEvent], user_id: str) -> bool:
        """Save collected events to database"""
        try:
            # This would integrate with your database layer
            # For now, we'll just log the events
            logger.info(f"Saving {len(events)} events to database for user {user_id}")
            
            # Convert events to database format
            events_data = []
            for event in events:
                event_data = {
                    'user_id': user_id,
                    'event_id': event.event_id,
                    'title': event.title,
                    'start_time': event.start_time,
                    'end_time': event.end_time,
                    'description': event.description,
                    'location': event.location,
                    'attendees': event.attendees,
                    'is_virtual': event.is_virtual,
                    'event_type': event.event_type,
                    'stress_level': event.stress_level,
                    'workload': event.workload,
                    'collected_at': datetime.now()
                }
                events_data.append(event_data)
            
            # Here you would save to your database
            # await database.save_calendar_events(events_data)
            
            logger.info(f"Successfully saved {len(events_data)} events to database")
            return True
            
        except Exception as e:
            logger.error(f"Error saving events to database: {e}")
            return False

# CLI interface for testing
async def main():
    """CLI interface for testing the Google Calendar collector"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Google Calendar Data Collector')
    parser.add_argument('--user-id', required=True, help='User ID to collect events for')
    parser.add_argument('--start-date', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--use-real-api', action='store_true', help='Use real Google Calendar API')
    
    args = parser.parse_args()
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d')
    
    # Initialize collector
    collector = GoogleCalendarCollector(use_real_api=args.use_real_api)
    
    # Authenticate if using real API
    if args.use_real_api:
        auth_url = collector.get_authorization_url()
        print(f"Please visit this URL to authorize: {auth_url}")
        auth_code = input("Enter authorization code: ")
        await collector.authenticate(auth_code)
    
    # Collect events
    events = await collector.collect_user_events(args.user_id, start_date, end_date)
    
    print(f"Collected {len(events)} events:")
    for event in events[:5]:  # Show first 5 events
        print(f"  - {event.title} ({event.start_time} - {event.end_time})")
    
    if len(events) > 5:
        print(f"  ... and {len(events) - 5} more events")

if __name__ == '__main__':
    asyncio.run(main())
