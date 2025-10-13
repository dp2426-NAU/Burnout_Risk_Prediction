# Data Validation - Created by Balaji Koneti
"""
Data quality validation and checks for the burnout risk prediction system.
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of data validation check"""
    check_name: str
    passed: bool
    message: str
    severity: str  # 'error', 'warning', 'info'
    details: Optional[Dict[str, Any]] = None

class DataValidator:
    """Validates data quality for ML pipeline"""
    
    def __init__(self):
        self.validation_rules = self._initialize_validation_rules()
    
    def _initialize_validation_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize validation rules for different data types"""
        return {
            "calendar_events": {
                "required_fields": [
                    "event_id", "user_id", "title", "start_time", 
                    "end_time", "duration_minutes", "is_meeting"
                ],
                "time_range": {
                    "min_duration": 5,  # minutes
                    "max_duration": 480,  # 8 hours
                    "max_events_per_day": 20
                },
                "data_types": {
                    "duration_minutes": int,
                    "is_meeting": bool,
                    "attendees_count": int
                }
            },
            "email_messages": {
                "required_fields": [
                    "message_id", "user_id", "sender", "recipients",
                    "subject", "body", "timestamp", "is_sent"
                ],
                "content_limits": {
                    "min_word_count": 1,
                    "max_word_count": 10000,
                    "max_emails_per_day": 200
                },
                "data_types": {
                    "word_count": int,
                    "is_sent": bool,
                    "is_urgent": bool,
                    "sentiment_score": float
                }
            },
            "user_profiles": {
                "required_fields": [
                    "user_id", "email", "role", "department", 
                    "job_title", "experience_years"
                ],
                "valid_roles": ["admin", "manager", "user"],
                "valid_departments": [
                    "Engineering", "Marketing", "Sales", "HR", "Finance",
                    "Operations", "Product", "Design", "Data", "Support"
                ],
                "experience_range": {
                    "min_years": 0,
                    "max_years": 50
                }
            }
        }
    
    def validate_calendar_events(self, events: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate calendar events data"""
        results = []
        rules = self.validation_rules["calendar_events"]
        
        try:
            if not events:
                results.append(ValidationResult(
                    check_name="calendar_events_empty",
                    passed=False,
                    message="No calendar events provided",
                    severity="warning"
                ))
                return results
            
            # Check required fields
            for i, event in enumerate(events):
                for field in rules["required_fields"]:
                    if field not in event or event[field] is None:
                        results.append(ValidationResult(
                            check_name="calendar_required_field",
                            passed=False,
                            message=f"Missing required field '{field}' in event {i}",
                            severity="error",
                            details={"event_index": i, "missing_field": field}
                        ))
            
            # Validate data types and ranges
            for i, event in enumerate(events):
                # Duration validation
                if "duration_minutes" in event:
                    duration = event["duration_minutes"]
                    if not isinstance(duration, int) or duration < rules["time_range"]["min_duration"]:
                        results.append(ValidationResult(
                            check_name="calendar_duration_invalid",
                            passed=False,
                            message=f"Invalid duration {duration} in event {i}",
                            severity="error",
                            details={"event_index": i, "duration": duration}
                        ))
                
                # Meeting validation
                if "is_meeting" in event and not isinstance(event["is_meeting"], bool):
                    results.append(ValidationResult(
                        check_name="calendar_meeting_type",
                        passed=False,
                        message=f"Invalid is_meeting value in event {i}",
                        severity="error",
                        details={"event_index": i, "value": event["is_meeting"]}
                    ))
            
            # Check for excessive events per day
            daily_counts = {}
            for event in events:
                if "start_time" in event:
                    try:
                        start_time = datetime.fromisoformat(event["start_time"].replace('Z', '+00:00'))
                        date_key = start_time.date()
                        daily_counts[date_key] = daily_counts.get(date_key, 0) + 1
                    except (ValueError, AttributeError):
                        continue
            
            for date, count in daily_counts.items():
                if count > rules["time_range"]["max_events_per_day"]:
                    results.append(ValidationResult(
                        check_name="calendar_excessive_events",
                        passed=False,
                        message=f"Too many events on {date}: {count}",
                        severity="warning",
                        details={"date": str(date), "count": count}
                    ))
            
            # If no errors found, add success result
            if not any(r.severity == "error" for r in results):
                results.append(ValidationResult(
                    check_name="calendar_events_valid",
                    passed=True,
                    message=f"All {len(events)} calendar events passed validation",
                    severity="info"
                ))
            
        except Exception as e:
            results.append(ValidationResult(
                check_name="calendar_validation_error",
                passed=False,
                message=f"Error during calendar validation: {str(e)}",
                severity="error"
            ))
        
        return results
    
    def validate_email_messages(self, emails: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate email messages data"""
        results = []
        rules = self.validation_rules["email_messages"]
        
        try:
            if not emails:
                results.append(ValidationResult(
                    check_name="email_messages_empty",
                    passed=False,
                    message="No email messages provided",
                    severity="warning"
                ))
                return results
            
            # Check required fields
            for i, email in enumerate(emails):
                for field in rules["required_fields"]:
                    if field not in email or email[field] is None:
                        results.append(ValidationResult(
                            check_name="email_required_field",
                            passed=False,
                            message=f"Missing required field '{field}' in email {i}",
                            severity="error",
                            details={"email_index": i, "missing_field": field}
                        ))
            
            # Validate content limits
            for i, email in enumerate(emails):
                if "word_count" in email:
                    word_count = email["word_count"]
                    if not isinstance(word_count, int) or word_count < rules["content_limits"]["min_word_count"]:
                        results.append(ValidationResult(
                            check_name="email_word_count_invalid",
                            passed=False,
                            message=f"Invalid word count {word_count} in email {i}",
                            severity="error",
                            details={"email_index": i, "word_count": word_count}
                        ))
            
            # Check for excessive emails per day
            daily_counts = {}
            for email in emails:
                if "timestamp" in email:
                    try:
                        timestamp = datetime.fromisoformat(email["timestamp"].replace('Z', '+00:00'))
                        date_key = timestamp.date()
                        daily_counts[date_key] = daily_counts.get(date_key, 0) + 1
                    except (ValueError, AttributeError):
                        continue
            
            for date, count in daily_counts.items():
                if count > rules["content_limits"]["max_emails_per_day"]:
                    results.append(ValidationResult(
                        check_name="email_excessive_count",
                        passed=False,
                        message=f"Too many emails on {date}: {count}",
                        severity="warning",
                        details={"date": str(date), "count": count}
                    ))
            
            # Validate sentiment scores
            sentiment_scores = [email.get("sentiment_score") for email in emails if email.get("sentiment_score") is not None]
            if sentiment_scores:
                invalid_sentiments = [s for s in sentiment_scores if not isinstance(s, (int, float)) or s < -1 or s > 1]
                if invalid_sentiments:
                    results.append(ValidationResult(
                        check_name="email_sentiment_invalid",
                        passed=False,
                        message=f"Invalid sentiment scores found: {len(invalid_sentiments)}",
                        severity="warning",
                        details={"invalid_count": len(invalid_sentiments)}
                    ))
            
            # If no errors found, add success result
            if not any(r.severity == "error" for r in results):
                results.append(ValidationResult(
                    check_name="email_messages_valid",
                    passed=True,
                    message=f"All {len(emails)} email messages passed validation",
                    severity="info"
                ))
            
        except Exception as e:
            results.append(ValidationResult(
                check_name="email_validation_error",
                passed=False,
                message=f"Error during email validation: {str(e)}",
                severity="error"
            ))
        
        return results
    
    def validate_user_profiles(self, profiles: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate user profile data"""
        results = []
        rules = self.validation_rules["user_profiles"]
        
        try:
            if not profiles:
                results.append(ValidationResult(
                    check_name="user_profiles_empty",
                    passed=False,
                    message="No user profiles provided",
                    severity="error"
                ))
                return results
            
            # Check required fields and validate values
            for i, profile in enumerate(profiles):
                # Required fields
                for field in rules["required_fields"]:
                    if field not in profile or profile[field] is None:
                        results.append(ValidationResult(
                            check_name="profile_required_field",
                            passed=False,
                            message=f"Missing required field '{field}' in profile {i}",
                            severity="error",
                            details={"profile_index": i, "missing_field": field}
                        ))
                
                # Validate role
                if "role" in profile and profile["role"] not in rules["valid_roles"]:
                    results.append(ValidationResult(
                        check_name="profile_invalid_role",
                        passed=False,
                        message=f"Invalid role '{profile['role']}' in profile {i}",
                        severity="error",
                        details={"profile_index": i, "role": profile["role"]}
                    ))
                
                # Validate department
                if "department" in profile and profile["department"] not in rules["valid_departments"]:
                    results.append(ValidationResult(
                        check_name="profile_invalid_department",
                        passed=False,
                        message=f"Invalid department '{profile['department']}' in profile {i}",
                        severity="warning",
                        details={"profile_index": i, "department": profile["department"]}
                    ))
                
                # Validate experience years
                if "experience_years" in profile:
                    exp_years = profile["experience_years"]
                    if not isinstance(exp_years, (int, float)) or exp_years < rules["experience_range"]["min_years"] or exp_years > rules["experience_range"]["max_years"]:
                        results.append(ValidationResult(
                            check_name="profile_invalid_experience",
                            passed=False,
                            message=f"Invalid experience years {exp_years} in profile {i}",
                            severity="warning",
                            details={"profile_index": i, "experience_years": exp_years}
                        ))
            
            # Check for duplicate user IDs
            user_ids = [profile.get("user_id") for profile in profiles if profile.get("user_id")]
            if len(user_ids) != len(set(user_ids)):
                duplicate_ids = [uid for uid in user_ids if user_ids.count(uid) > 1]
                results.append(ValidationResult(
                    check_name="profile_duplicate_ids",
                    passed=False,
                    message=f"Duplicate user IDs found: {duplicate_ids}",
                    severity="error",
                    details={"duplicate_ids": list(set(duplicate_ids))}
                ))
            
            # If no errors found, add success result
            if not any(r.severity == "error" for r in results):
                results.append(ValidationResult(
                    check_name="user_profiles_valid",
                    passed=True,
                    message=f"All {len(profiles)} user profiles passed validation",
                    severity="info"
                ))
            
        except Exception as e:
            results.append(ValidationResult(
                check_name="profile_validation_error",
                passed=False,
                message=f"Error during profile validation: {str(e)}",
                severity="error"
            ))
        
        return results
    
    def validate_collected_data(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate complete collected data package"""
        results = []
        
        try:
            # Validate calendar events
            if "calendar_events" in data:
                calendar_results = self.validate_calendar_events(data["calendar_events"])
                results.extend(calendar_results)
            
            # Validate email messages
            if "email_messages" in data:
                email_results = self.validate_email_messages(data["email_messages"])
                results.extend(email_results)
            
            # Validate summary statistics
            if "summary" in data:
                summary_results = self._validate_summary(data["summary"])
                results.extend(summary_results)
            
            # Overall data quality assessment
            error_count = sum(1 for r in results if r.severity == "error")
            warning_count = sum(1 for r in results if r.severity == "warning")
            
            if error_count == 0:
                results.append(ValidationResult(
                    check_name="overall_data_quality",
                    passed=True,
                    message=f"Data quality check passed with {warning_count} warnings",
                    severity="info",
                    details={"errors": error_count, "warnings": warning_count}
                ))
            else:
                results.append(ValidationResult(
                    check_name="overall_data_quality",
                    passed=False,
                    message=f"Data quality check failed with {error_count} errors and {warning_count} warnings",
                    severity="error",
                    details={"errors": error_count, "warnings": warning_count}
                ))
            
        except Exception as e:
            results.append(ValidationResult(
                check_name="validation_system_error",
                passed=False,
                message=f"Error during data validation: {str(e)}",
                severity="error"
            ))
        
        return results
    
    def _validate_summary(self, summary: Dict[str, Any]) -> List[ValidationResult]:
        """Validate summary statistics"""
        results = []
        
        try:
            # Check for reasonable counts
            expected_fields = [
                "total_calendar_events", "total_emails", "meeting_count",
                "urgent_emails", "sent_emails", "received_emails"
            ]
            
            for field in expected_fields:
                if field not in summary:
                    results.append(ValidationResult(
                        check_name="summary_missing_field",
                        passed=False,
                        message=f"Missing summary field: {field}",
                        severity="warning"
                    ))
                elif not isinstance(summary[field], int) or summary[field] < 0:
                    results.append(ValidationResult(
                        check_name="summary_invalid_count",
                        passed=False,
                        message=f"Invalid count for {field}: {summary[field]}",
                        severity="warning"
                    ))
            
            # Validate email counts consistency
            if "sent_emails" in summary and "received_emails" in summary and "total_emails" in summary:
                calculated_total = summary["sent_emails"] + summary["received_emails"]
                if calculated_total != summary["total_emails"]:
                    results.append(ValidationResult(
                        check_name="summary_email_count_mismatch",
                        passed=False,
                        message=f"Email count mismatch: {calculated_total} != {summary['total_emails']}",
                        severity="warning"
                    ))
            
        except Exception as e:
            results.append(ValidationResult(
                check_name="summary_validation_error",
                passed=False,
                message=f"Error validating summary: {str(e)}",
                severity="error"
            ))
        
        return results
    
    def get_validation_report(self, results: List[ValidationResult]) -> Dict[str, Any]:
        """Generate a comprehensive validation report"""
        report = {
            "validation_timestamp": datetime.utcnow().isoformat(),
            "total_checks": len(results),
            "passed_checks": sum(1 for r in results if r.passed),
            "failed_checks": sum(1 for r in results if not r.passed),
            "error_count": sum(1 for r in results if r.severity == "error"),
            "warning_count": sum(1 for r in results if r.severity == "warning"),
            "info_count": sum(1 for r in results if r.severity == "info"),
            "overall_status": "PASS" if not any(r.severity == "error" for r in results) else "FAIL",
            "checks": [
                {
                    "name": r.check_name,
                    "passed": r.passed,
                    "message": r.message,
                    "severity": r.severity,
                    "details": r.details
                }
                for r in results
            ]
        }
        
        return report

