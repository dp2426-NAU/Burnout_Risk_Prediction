// MongoDB initialization script - Created by Harish S & Team
// This script sets up the database and collections for the burnout risk prediction system

// Switch to the burnout risk prediction database
db = db.getSiblingDB('burnout_risk_prediction');

// Create collections with validation rules
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters long'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'First name is required and must be between 1-50 characters'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Last name is required and must be between 1-50 characters'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'user', 'manager'],
          description: 'Role must be one of: admin, user, manager'
        },
        isActive: {
          bsonType: 'bool',
          description: 'isActive must be a boolean'
        }
      }
    }
  }
});

db.createCollection('calendarEvents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'title', 'startTime', 'endTime', 'eventType'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'userId must be a valid ObjectId'
        },
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Title is required and must be between 1-200 characters'
        },
        startTime: {
          bsonType: 'date',
          description: 'startTime must be a valid date'
        },
        endTime: {
          bsonType: 'date',
          description: 'endTime must be a valid date'
        },
        eventType: {
          bsonType: 'string',
          enum: ['meeting', 'focus_time', 'break', 'overtime', 'personal'],
          description: 'eventType must be one of the allowed values'
        },
        stressLevel: {
          bsonType: 'number',
          minimum: 1,
          maximum: 5,
          description: 'stressLevel must be between 1-5'
        },
        workload: {
          bsonType: 'number',
          minimum: 1,
          maximum: 5,
          description: 'workload must be between 1-5'
        }
      }
    }
  }
});

db.createCollection('emailMessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'subject', 'body', 'sender', 'recipient', 'timestamp'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'userId must be a valid ObjectId'
        },
        subject: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 500,
          description: 'Subject is required and must be between 1-500 characters'
        },
        body: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50000,
          description: 'Body is required and must be between 1-50000 characters'
        },
        sender: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Sender must be a valid email address'
        },
        recipient: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Recipient must be a valid email address'
        },
        timestamp: {
          bsonType: 'date',
          description: 'timestamp must be a valid date'
        },
        sentimentScore: {
          bsonType: 'number',
          minimum: -1,
          maximum: 1,
          description: 'sentimentScore must be between -1 and 1'
        },
        wordCount: {
          bsonType: 'number',
          minimum: 0,
          description: 'wordCount must be a non-negative number'
        }
      }
    }
  }
});

db.createCollection('predictionResults', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'predictionDate', 'riskLevel', 'riskScore', 'confidence'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'userId must be a valid ObjectId'
        },
        predictionDate: {
          bsonType: 'date',
          description: 'predictionDate must be a valid date'
        },
        riskLevel: {
          bsonType: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'riskLevel must be one of the allowed values'
        },
        riskScore: {
          bsonType: 'number',
          minimum: 0,
          maximum: 100,
          description: 'riskScore must be between 0-100'
        },
        confidence: {
          bsonType: 'number',
          minimum: 0,
          maximum: 1,
          description: 'confidence must be between 0-1'
        },
        modelVersion: {
          bsonType: 'string',
          description: 'modelVersion must be a string'
        }
      }
    }
  }
});

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'isActive': 1 });

// Calendar events indexes
db.calendarEvents.createIndex({ 'userId': 1, 'startTime': 1, 'endTime': 1 });
db.calendarEvents.createIndex({ 'eventType': 1 });
db.calendarEvents.createIndex({ 'isRecurring': 1 });
db.calendarEvents.createIndex({ 'stressLevel': 1, 'workload': 1 });

// Email messages indexes
db.emailMessages.createIndex({ 'userId': 1, 'timestamp': -1 });
db.emailMessages.createIndex({ 'threadId': 1, 'timestamp': 1 });
db.emailMessages.createIndex({ 'sentimentScore': 1 });
db.emailMessages.createIndex({ 'emotionTags': 1 });
db.emailMessages.createIndex({ 'isImportant': 1 });

// Prediction results indexes
db.predictionResults.createIndex({ 'userId': 1, 'predictionDate': -1 });
db.predictionResults.createIndex({ 'riskLevel': 1 });
db.predictionResults.createIndex({ 'isActive': 1 });
db.predictionResults.createIndex({ 'modelVersion': 1 });

print('Indexes created successfully!');

// Create a default admin user
print('Creating default admin user...');

const bcrypt = require('bcryptjs');
const adminPassword = bcrypt.hashSync('admin123', 12);

db.users.insertOne({
  email: 'admin@burnout-prediction.com',
  password: adminPassword,
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Default admin user created!');
print('Email: admin@burnout-prediction.com');
print('Password: admin123');

// Create sample data for demonstration
print('Creating sample data...');

// Sample users
const sampleUsers = [
  {
    email: 'user1@example.com',
    password: bcrypt.hashSync('password123', 12),
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'user2@example.com',
    password: bcrypt.hashSync('password123', 12),
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'manager',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const userIds = [];
sampleUsers.forEach(user => {
  const result = db.users.insertOne(user);
  userIds.push(result.insertedId);
});

// Sample calendar events
const sampleEvents = [];
for (let i = 0; i < 50; i++) {
  const userId = userIds[i % userIds.length];
  const startTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const duration = Math.random() * 120 + 30; // 30-150 minutes
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  
  sampleEvents.push({
    userId: userId,
    title: `Event ${i + 1}`,
    startTime: startTime,
    endTime: endTime,
    eventType: ['meeting', 'focus_time', 'break', 'overtime', 'personal'][Math.floor(Math.random() * 5)],
    isVirtual: Math.random() > 0.3,
    stressLevel: Math.floor(Math.random() * 5) + 1,
    workload: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.calendarEvents.insertMany(sampleEvents);

// Sample email messages
const sampleEmails = [];
for (let i = 0; i < 100; i++) {
  const userId = userIds[i % userIds.length];
  const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  
  sampleEmails.push({
    userId: userId,
    subject: `Email Subject ${i + 1}`,
    body: `This is the body of email ${i + 1}. It contains some content for analysis.`,
    sender: `sender${i}@example.com`,
    recipient: `recipient${i}@example.com`,
    timestamp: timestamp,
    isRead: Math.random() > 0.3,
    isImportant: Math.random() > 0.8,
    sentimentScore: (Math.random() - 0.5) * 2, // -1 to 1
    wordCount: Math.floor(Math.random() * 200) + 10,
    isOutgoing: Math.random() > 0.5,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.emailMessages.insertMany(sampleEmails);

// Sample prediction results
const samplePredictions = [];
for (let i = 0; i < 20; i++) {
  const userId = userIds[i % userIds.length];
  const predictionDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  const riskScore = Math.random() * 100;
  const riskLevel = riskScore < 25 ? 'low' : riskScore < 50 ? 'medium' : riskScore < 75 ? 'high' : 'critical';
  
  samplePredictions.push({
    userId: userId,
    predictionDate: predictionDate,
    riskLevel: riskLevel,
    riskScore: riskScore,
    confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
    factors: {
      workload: Math.random() * 10,
      stressLevel: Math.random() * 10,
      workLifeBalance: Math.random() * 10,
      socialSupport: Math.random() * 10,
      jobSatisfaction: Math.random() * 10,
      physicalHealth: Math.random() * 10,
      mentalHealth: Math.random() * 10,
      sleepQuality: Math.random() * 10,
      exerciseFrequency: Math.random() * 10,
      nutritionQuality: Math.random() * 10
    },
    recommendations: [
      {
        priority: 'high',
        category: 'workload',
        title: 'Reduce Meeting Overload',
        description: 'Consider consolidating or eliminating unnecessary meetings.',
        actionItems: ['Audit your meetings', 'Set meeting time limits']
      }
    ],
    dataPoints: {
      calendarEvents: Math.floor(Math.random() * 50),
      emailMessages: Math.floor(Math.random() * 100),
      surveyResponses: Math.floor(Math.random() * 10),
      biometricData: Math.floor(Math.random() * 20)
    },
    modelVersion: '1.0.0',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.predictionResults.insertMany(samplePredictions);

print('Sample data created successfully!');
print('Database initialization completed!');
