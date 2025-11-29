// Database migration script - Created by Harish S & Team
require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('../src/utils/logger');

// Database connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/burnout-risk-prediction';

// Migration functions
const migrations = [
  {
    version: '1.0.0',
    description: 'Initial schema with indexes',
    up: async () => {
      console.log('Running migration 1.0.0: Initial schema with indexes');
      
      // Create indexes for User collection
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ role: 1 });
      await mongoose.connection.db.collection('users').createIndex({ isActive: 1 });
      await mongoose.connection.db.collection('users').createIndex({ createdAt: 1 });
      await mongoose.connection.db.collection('users').createIndex({ lastLogin: 1 });
      
      // Create indexes for CalendarEvent collection
      await mongoose.connection.db.collection('calendarevents').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('calendarevents').createIndex({ startTime: 1 });
      await mongoose.connection.db.collection('calendarevents').createIndex({ endTime: 1 });
      await mongoose.connection.db.collection('calendarevents').createIndex({ eventType: 1 });
      await mongoose.connection.db.collection('calendarevents').createIndex({ userId: 1, startTime: 1 });
      await mongoose.connection.db.collection('calendarevents').createIndex({ userId: 1, eventType: 1 });
      
      // Create indexes for EmailMessage collection
      await mongoose.connection.db.collection('emailmessages').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('emailmessages').createIndex({ timestamp: 1 });
      await mongoose.connection.db.collection('emailmessages').createIndex({ isSent: 1 });
      await mongoose.connection.db.collection('emailmessages').createIndex({ isUrgent: 1 });
      await mongoose.connection.db.collection('emailmessages').createIndex({ sentimentScore: 1 });
      await mongoose.connection.db.collection('emailmessages').createIndex({ userId: 1, timestamp: 1 });
      
      // Create indexes for PredictionResult collection
      await mongoose.connection.db.collection('predictionresults').createIndex({ userId: 1 });
      await mongoose.connection.db.collection('predictionresults').createIndex({ predictionDate: 1 });
      await mongoose.connection.db.collection('predictionresults').createIndex({ riskLevel: 1 });
      await mongoose.connection.db.collection('predictionresults').createIndex({ userId: 1, predictionDate: 1 });
      await mongoose.connection.db.collection('predictionresults').createIndex({ modelVersion: 1 });
      
      console.log('✅ Migration 1.0.0 completed successfully');
    },
    down: async () => {
      console.log('Rolling back migration 1.0.0');
      // Drop all indexes
      await mongoose.connection.db.collection('users').dropIndexes();
      await mongoose.connection.db.collection('calendarevents').dropIndexes();
      await mongoose.connection.db.collection('emailmessages').dropIndexes();
      await mongoose.connection.db.collection('predictionresults').dropIndexes();
      console.log('✅ Migration 1.0.0 rolled back');
    }
  },
  {
    version: '1.1.0',
    description: 'Add text search indexes',
    up: async () => {
      console.log('Running migration 1.1.0: Add text search indexes');
      
      // Create text indexes for search functionality
      await mongoose.connection.db.collection('users').createIndex({
        firstName: 'text',
        lastName: 'text',
        email: 'text'
      });
      
      await mongoose.connection.db.collection('calendarevents').createIndex({
        title: 'text',
        description: 'text'
      });
      
      await mongoose.connection.db.collection('emailmessages').createIndex({
        subject: 'text',
        body: 'text'
      });
      
      console.log('✅ Migration 1.1.0 completed successfully');
    },
    down: async () => {
      console.log('Rolling back migration 1.1.0');
      // Drop text indexes
      await mongoose.connection.db.collection('users').dropIndex('firstName_text_lastName_text_email_text');
      await mongoose.connection.db.collection('calendarevents').dropIndex('title_text_description_text');
      await mongoose.connection.db.collection('emailmessages').dropIndex('subject_text_body_text');
      console.log('✅ Migration 1.1.0 rolled back');
    }
  },
  {
    version: '1.2.0',
    description: 'Add compound indexes for analytics',
    up: async () => {
      console.log('Running migration 1.2.0: Add compound indexes for analytics');
      
      // Analytics compound indexes
      await mongoose.connection.db.collection('predictionresults').createIndex({
        riskLevel: 1,
        predictionDate: 1,
        userId: 1
      });
      
      await mongoose.connection.db.collection('calendarevents').createIndex({
        eventType: 1,
        startTime: 1,
        userId: 1
      });
      
      await mongoose.connection.db.collection('emailmessages').createIndex({
        isUrgent: 1,
        timestamp: 1,
        userId: 1
      });
      
      console.log('✅ Migration 1.2.0 completed successfully');
    },
    down: async () => {
      console.log('Rolling back migration 1.2.0');
      // Drop compound indexes
      await mongoose.connection.db.collection('predictionresults').dropIndex('riskLevel_1_predictionDate_1_userId_1');
      await mongoose.connection.db.collection('calendarevents').dropIndex('eventType_1_startTime_1_userId_1');
      await mongoose.connection.db.collection('emailmessages').dropIndex('isUrgent_1_timestamp_1_userId_1');
      console.log('✅ Migration 1.2.0 rolled back');
    }
  }
];

// Migration tracking collection
const MIGRATION_COLLECTION = 'migrations';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function getMigrationHistory() {
  try {
    const history = await mongoose.connection.db.collection(MIGRATION_COLLECTION).find().sort({ version: 1 }).toArray();
    return history;
  } catch (error) {
    console.log('No migration history found, starting fresh');
    return [];
  }
}

async function recordMigration(version, description, status) {
  try {
    await mongoose.connection.db.collection(MIGRATION_COLLECTION).insertOne({
      version,
      description,
      status,
      timestamp: new Date(),
      author: 'Harish S & Team'
    });
  } catch (error) {
    console.error('Failed to record migration:', error);
  }
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  const history = await getMigrationHistory();
  const completedVersions = history.map(m => m.version);
  
  for (const migration of migrations) {
    if (completedVersions.includes(migration.version)) {
      console.log(`⏭️  Migration ${migration.version} already completed, skipping`);
      continue;
    }
    
    try {
      console.log(`🔄 Running migration ${migration.version}: ${migration.description}`);
      await migration.up();
      await recordMigration(migration.version, migration.description, 'completed');
      console.log(`✅ Migration ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      await recordMigration(migration.version, migration.description, 'failed');
      throw error;
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

async function rollbackMigration(version) {
  console.log(`🔄 Rolling back migration ${version}...`);
  
  const migration = migrations.find(m => m.version === version);
  if (!migration) {
    throw new Error(`Migration ${version} not found`);
  }
  
  try {
    await migration.down();
    await mongoose.connection.db.collection(MIGRATION_COLLECTION).deleteOne({ version });
    console.log(`✅ Migration ${version} rolled back successfully`);
  } catch (error) {
    console.error(`❌ Failed to rollback migration ${version}:`, error);
    throw error;
  }
}

async function showMigrationStatus() {
  console.log('📊 Migration Status:');
  
  const history = await getMigrationHistory();
  
  if (history.length === 0) {
    console.log('No migrations have been run yet');
    return;
  }
  
  console.table(history.map(m => ({
    Version: m.version,
    Description: m.description,
    Status: m.status,
    Date: m.timestamp.toISOString()
  })));
}

// Main execution
async function main() {
  const command = process.argv[2];
  const version = process.argv[3];
  
  try {
    await connectToDatabase();
    
    switch (command) {
      case 'migrate':
        await runMigrations();
        break;
      case 'rollback':
        if (!version) {
          console.error('Please specify a version to rollback');
          process.exit(1);
        }
        await rollbackMigration(version);
        break;
      case 'status':
        await showMigrationStatus();
        break;
      default:
        console.log('Usage: node migrate-database.js [migrate|rollback|status] [version]');
        console.log('  migrate  - Run all pending migrations');
        console.log('  rollback - Rollback a specific migration version');
        console.log('  status   - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migrations,
  runMigrations,
  rollbackMigration,
  showMigrationStatus
};
