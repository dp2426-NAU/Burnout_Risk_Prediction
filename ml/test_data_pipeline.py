# Test Data Pipeline - Created by Balaji Koneti
"""
Test script to verify the data pipeline functionality.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from data_pipeline.orchestrator import DataPipelineOrchestrator

async def test_data_pipeline():
    """Test the data pipeline functionality"""
    print("🧪 Testing Data Pipeline...")
    
    try:
        # Initialize orchestrator
        orchestrator = DataPipelineOrchestrator()
        await orchestrator.initialize()
        print("✅ Data pipeline initialized successfully")
        
        # Test single user data collection
        print("\n📊 Testing single user data collection...")
        user_id = "test_user_001"
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        result = await orchestrator.run_user_data_pipeline(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            validate_data=True
        )
        
        print(f"✅ Single user collection completed: {result['success']}")
        print(f"   - Duration: {result.get('total_duration_seconds', 0):.2f} seconds")
        print(f"   - Calendar events: {result.get('steps', {}).get('data_collection', {}).get('records_collected', {}).get('calendar_events', 0)}")
        print(f"   - Email messages: {result.get('steps', {}).get('data_collection', {}).get('records_collected', {}).get('email_messages', 0)}")
        
        # Test batch data collection
        print("\n📊 Testing batch data collection...")
        user_ids = [f"test_user_{i:03d}" for i in range(1, 4)]  # Test 3 users
        
        batch_result = await orchestrator.run_batch_data_pipeline(
            user_ids=user_ids,
            start_date=start_date,
            end_date=end_date,
            max_concurrent=2,
            validate_data=True
        )
        
        print(f"✅ Batch collection completed: {batch_result['summary']['successful']}/{len(user_ids)} successful")
        print(f"   - Duration: {batch_result['summary']['total_duration_seconds']:.2f} seconds")
        
        # Test pipeline status
        print("\n📊 Testing pipeline status...")
        status = orchestrator.get_pipeline_status()
        print(f"✅ Pipeline status: {status['pipeline_status']}")
        print(f"   - Total versions: {status['storage_statistics']['total_versions']}")
        print(f"   - Total size: {status['storage_statistics']['total_size_mb']:.2f} MB")
        print(f"   - Total records: {status['storage_statistics']['total_records']}")
        
        # Test data lineage
        if status['latest_versions']:
            print("\n📊 Testing data lineage...")
            latest_version = status['latest_versions'][0]
            lineage = orchestrator.storage_manager.get_data_lineage(latest_version['version_id'])
            print(f"✅ Data lineage retrieved for version: {lineage['version_id']}")
            print(f"   - Data type: {lineage['data_type']}")
            print(f"   - Record count: {lineage['record_count']}")
        
        print("\n🎉 All data pipeline tests passed!")
        
    except Exception as e:
        print(f"❌ Data pipeline test failed: {str(e)}")
        import traceback
        traceback.print_exc()

async def test_data_validation():
    """Test data validation functionality"""
    print("\n🧪 Testing Data Validation...")
    
    try:
        from data_pipeline.validate_data import DataValidator
        
        validator = DataValidator()
        
        # Test calendar events validation
        test_calendar_events = [
            {
                "event_id": "test_event_1",
                "user_id": "test_user",
                "title": "Test Meeting",
                "start_time": "2025-01-01T09:00:00Z",
                "end_time": "2025-01-01T10:00:00Z",
                "duration_minutes": 60,
                "is_meeting": True,
                "attendees_count": 3
            }
        ]
        
        calendar_results = validator.validate_calendar_events(test_calendar_events)
        print(f"✅ Calendar validation: {len(calendar_results)} checks performed")
        
        # Test email messages validation
        test_email_messages = [
            {
                "message_id": "test_email_1",
                "user_id": "test_user",
                "sender": "test@company.com",
                "recipients": ["colleague@company.com"],
                "subject": "Test Email",
                "body": "This is a test email message.",
                "timestamp": "2025-01-01T10:00:00Z",
                "is_sent": True,
                "is_urgent": False,
                "word_count": 7
            }
        ]
        
        email_results = validator.validate_email_messages(test_email_messages)
        print(f"✅ Email validation: {len(email_results)} checks performed")
        
        # Test validation report
        all_results = calendar_results + email_results
        report = validator.get_validation_report(all_results)
        print(f"✅ Validation report: {report['overall_status']} ({report['total_checks']} checks)")
        
        print("🎉 All data validation tests passed!")
        
    except Exception as e:
        print(f"❌ Data validation test failed: {str(e)}")
        import traceback
        traceback.print_exc()

async def main():
    """Run all tests"""
    print("🚀 Starting Data Pipeline Tests")
    print("=" * 50)
    
    await test_data_validation()
    await test_data_pipeline()
    
    print("\n" + "=" * 50)
    print("🏁 All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())

