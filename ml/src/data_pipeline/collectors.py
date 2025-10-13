# Data Collectors - Created by Balaji Koneti
"""
Data collection modules for integrating with external APIs (Calendar, Email, etc.)
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

@dataclass
class CalendarEvent:
    """Calendar event data structure"""
    event_id: str
    user_id: str
    title: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    is_meeting: bool
    attendees_count: int
    is_recurring: bool
    location: Optional[str] = None
    description: Optional[str] = None

@dataclass
class EmailMessage:
    """Email message data structure"""
    message_id: str
    user_id: str
    sender: str
    recipients: List[str]
    subject: str
    body: str
    timestamp: datetime
    is_sent: bool
    is_urgent: bool
    word_count: int
    sentiment_score: Optional[float] = None

class CalendarDataCollector:
    """Collects calendar data from Google Calendar API"""
    
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path
        self.service = None
        
    async def initialize(self):
        """Initialize Google Calendar API service"""
        try:
            # In production, this would use real Google Calendar API
            # For now, we'll use mock data
            logger.info("Initializing Calendar Data Collector (Mock Mode)")
            self.service = "mock_service"
        except Exception as e:
            logger.error(f"Failed to initialize Calendar API: {str(e)}")
            raise
    
    async def collect_user_events(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[CalendarEvent]:
        """
        Collect calendar events for a user within date range
        
        Args:
            user_id: User identifier
            start_date: Start date for collection
            end_date: End date for collection
            
        Returns:
            List of CalendarEvent objects
        """
        try:
            logger.info(f"Collecting calendar events for user {user_id} from {start_date} to {end_date}")
            
            # Mock implementation - in production, this would call Google Calendar API
            events = await self._generate_mock_events(user_id, start_date, end_date)
            
            logger.info(f"Collected {len(events)} calendar events for user {user_id}")
            return events
            
        except Exception as e:
            logger.error(f"Error collecting calendar events for user {user_id}: {str(e)}")
            return []
    
    async def _generate_mock_events(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[CalendarEvent]:
        """Generate realistic mock calendar events"""
        events = []
        current_date = start_date
        
        # Generate events for each day in the range
        while current_date <= end_date:
            # Skip weekends for work events
            if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                # Generate 3-8 events per workday
                num_events = np.random.randint(3, 9)
                
                for i in range(num_events):
                    # Generate event times
                    start_hour = np.random.randint(8, 18)  # 8 AM to 6 PM
                    start_minute = np.random.choice([0, 15, 30, 45])
                    duration = np.random.choice([15, 30, 45, 60, 90, 120])
                    
                    event_start = current_date.replace(
                        hour=start_hour, 
                        minute=start_minute, 
                        second=0, 
                        microsecond=0
                    )
                    event_end = event_start + timedelta(minutes=duration)
                    
                    # Determine if it's a meeting (70% chance)
                    is_meeting = np.random.random() < 0.7
                    
                    # Generate event details
                    if is_meeting:
                        titles = [
                            "Team Standup", "Project Review", "Client Meeting", 
                            "Sprint Planning", "Code Review", "Design Discussion",
                            "One-on-One", "All Hands", "Retrospective"
                        ]
                        attendees_count = np.random.randint(2, 12)
                    else:
                        titles = [
                            "Focus Time", "Deep Work", "Email Review", 
                            "Documentation", "Research", "Planning"
                        ]
                        attendees_count = 1
                    
                    event = CalendarEvent(
                        event_id=f"event_{user_id}_{current_date.strftime('%Y%m%d')}_{i}",
                        user_id=user_id,
                        title=np.random.choice(titles),
                        start_time=event_start,
                        end_time=event_end,
                        duration_minutes=duration,
                        is_meeting=is_meeting,
                        attendees_count=attendees_count,
                        is_recurring=np.random.random() < 0.3,
                        location="Office" if np.random.random() < 0.6 else "Remote",
                        description=f"Event description for {np.random.choice(titles)}"
                    )
                    
                    events.append(event)
            
            current_date += timedelta(days=1)
        
        return events

class EmailDataCollector:
    """Collects email data from Gmail/Outlook API"""
    
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path
        self.service = None
        
    async def initialize(self):
        """Initialize Gmail API service"""
        try:
            # In production, this would use real Gmail API
            logger.info("Initializing Email Data Collector (Mock Mode)")
            self.service = "mock_service"
        except Exception as e:
            logger.error(f"Failed to initialize Gmail API: {str(e)}")
            raise
    
    async def collect_user_emails(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[EmailMessage]:
        """
        Collect email messages for a user within date range
        
        Args:
            user_id: User identifier
            start_date: Start date for collection
            end_date: End date for collection
            
        Returns:
            List of EmailMessage objects
        """
        try:
            logger.info(f"Collecting emails for user {user_id} from {start_date} to {end_date}")
            
            # Mock implementation - in production, this would call Gmail API
            emails = await self._generate_mock_emails(user_id, start_date, end_date)
            
            logger.info(f"Collected {len(emails)} emails for user {user_id}")
            return emails
            
        except Exception as e:
            logger.error(f"Error collecting emails for user {user_id}: {str(e)}")
            return []
    
    async def _generate_mock_emails(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[EmailMessage]:
        """Generate realistic mock email messages"""
        emails = []
        current_date = start_date
        
        # Generate emails for each day in the range
        while current_date <= end_date:
            # Skip weekends for work emails
            if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                # Generate 10-50 emails per workday
                num_emails = np.random.randint(10, 51)
                
                for i in range(num_emails):
                    # Generate email timestamp (8 AM to 8 PM)
                    email_hour = np.random.randint(8, 21)
                    email_minute = np.random.randint(0, 60)
                    
                    email_time = current_date.replace(
                        hour=email_hour, 
                        minute=email_minute, 
                        second=0, 
                        microsecond=0
                    )
                    
                    # Determine if sent or received (60% sent, 40% received)
                    is_sent = np.random.random() < 0.6
                    
                    # Generate email content
                    subjects = [
                        "Project Update", "Meeting Follow-up", "Deadline Reminder",
                        "Code Review Request", "Client Feedback", "Status Report",
                        "Budget Approval", "Team Announcement", "Bug Report",
                        "Feature Request", "Documentation Update", "Training Schedule"
                    ]
                    
                    bodies = [
                        "Hi team, I wanted to update you on the project progress...",
                        "Following up on our meeting yesterday, here are the action items...",
                        "Just a reminder that the deadline is approaching...",
                        "Could you please review the code changes in the PR...",
                        "The client has provided feedback on the latest iteration...",
                        "Here's the weekly status report for your review...",
                        "I need approval for the budget allocation...",
                        "Important team announcement regarding the new policy...",
                        "I've identified a bug in the system that needs attention...",
                        "We should consider adding this feature to improve UX..."
                    ]
                    
                    # Determine urgency (10% urgent)
                    is_urgent = np.random.random() < 0.1
                    if is_urgent:
                        subjects = [f"URGENT: {s}" for s in subjects]
                    
                    # Generate word count (50-500 words)
                    word_count = np.random.randint(50, 501)
                    
                    # Generate recipients
                    recipients = [f"colleague{i}@company.com" for i in range(np.random.randint(1, 6))]
                    
                    email = EmailMessage(
                        message_id=f"email_{user_id}_{current_date.strftime('%Y%m%d')}_{i}",
                        user_id=user_id,
                        sender=f"user{user_id}@company.com" if is_sent else np.random.choice(recipients),
                        recipients=recipients,
                        subject=np.random.choice(subjects),
                        body=np.random.choice(bodies),
                        timestamp=email_time,
                        is_sent=is_sent,
                        is_urgent=is_urgent,
                        word_count=word_count,
                        sentiment_score=np.random.uniform(-1, 1)  # Mock sentiment
                    )
                    
                    emails.append(email)
            
            current_date += timedelta(days=1)
        
        return emails

class DataCollectionService:
    """Main service for coordinating data collection from multiple sources"""
    
    def __init__(self):
        self.calendar_collector = CalendarDataCollector()
        self.email_collector = EmailDataCollector()
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize all data collectors"""
        try:
            logger.info("Initializing Data Collection Service...")
            
            await self.calendar_collector.initialize()
            await self.email_collector.initialize()
            
            self.is_initialized = True
            logger.info("Data Collection Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Data Collection Service: {str(e)}")
            raise
    
    async def collect_user_data(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Collect all data for a user within date range
        
        Args:
            user_id: User identifier
            start_date: Start date for collection
            end_date: End date for collection
            
        Returns:
            Dictionary containing all collected data
        """
        if not self.is_initialized:
            await self.initialize()
        
        try:
            logger.info(f"Collecting all data for user {user_id} from {start_date} to {end_date}")
            
            # Collect data from all sources in parallel
            calendar_task = self.calendar_collector.collect_user_events(user_id, start_date, end_date)
            email_task = self.email_collector.collect_user_emails(user_id, start_date, end_date)
            
            calendar_events, email_messages = await asyncio.gather(
                calendar_task, 
                email_task,
                return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(calendar_events, Exception):
                logger.error(f"Calendar collection failed: {calendar_events}")
                calendar_events = []
            
            if isinstance(email_messages, Exception):
                logger.error(f"Email collection failed: {email_messages}")
                email_messages = []
            
            # Compile results
            collected_data = {
                "user_id": user_id,
                "collection_date": datetime.utcnow(),
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "calendar_events": [
                    {
                        "event_id": event.event_id,
                        "title": event.title,
                        "start_time": event.start_time.isoformat(),
                        "end_time": event.end_time.isoformat(),
                        "duration_minutes": event.duration_minutes,
                        "is_meeting": event.is_meeting,
                        "attendees_count": event.attendees_count,
                        "is_recurring": event.is_recurring,
                        "location": event.location,
                        "description": event.description
                    }
                    for event in calendar_events
                ],
                "email_messages": [
                    {
                        "message_id": email.message_id,
                        "sender": email.sender,
                        "recipients": email.recipients,
                        "subject": email.subject,
                        "body": email.body,
                        "timestamp": email.timestamp.isoformat(),
                        "is_sent": email.is_sent,
                        "is_urgent": email.is_urgent,
                        "word_count": email.word_count,
                        "sentiment_score": email.sentiment_score
                    }
                    for email in email_messages
                ],
                "summary": {
                    "total_calendar_events": len(calendar_events),
                    "total_emails": len(email_messages),
                    "meeting_count": sum(1 for event in calendar_events if event.is_meeting),
                    "urgent_emails": sum(1 for email in email_messages if email.is_urgent),
                    "sent_emails": sum(1 for email in email_messages if email.is_sent),
                    "received_emails": sum(1 for email in email_messages if not email.is_sent)
                }
            }
            
            logger.info(f"Successfully collected data for user {user_id}: "
                       f"{len(calendar_events)} events, {len(email_messages)} emails")
            
            return collected_data
            
        except Exception as e:
            logger.error(f"Error collecting data for user {user_id}: {str(e)}")
            raise
    
    async def collect_batch_data(
        self, 
        user_ids: List[str], 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """
        Collect data for multiple users in parallel
        
        Args:
            user_ids: List of user identifiers
            start_date: Start date for collection
            end_date: End date for collection
            
        Returns:
            Dictionary mapping user_id to collected data
        """
        try:
            logger.info(f"Collecting batch data for {len(user_ids)} users from {start_date} to {end_date}")
            
            # Create tasks for all users
            tasks = [
                self.collect_user_data(user_id, start_date, end_date)
                for user_id in user_ids
            ]
            
            # Execute all tasks in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Compile results
            batch_data = {}
            for i, result in enumerate(results):
                user_id = user_ids[i]
                if isinstance(result, Exception):
                    logger.error(f"Failed to collect data for user {user_id}: {result}")
                    batch_data[user_id] = {"error": str(result)}
                else:
                    batch_data[user_id] = result
            
            successful_collections = sum(1 for data in batch_data.values() if "error" not in data)
            logger.info(f"Batch collection completed: {successful_collections}/{len(user_ids)} successful")
            
            return batch_data
            
        except Exception as e:
            logger.error(f"Error in batch data collection: {str(e)}")
            raise

