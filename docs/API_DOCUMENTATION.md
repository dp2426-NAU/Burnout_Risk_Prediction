# API Documentation - Burnout Prediction System
Created by Balaji Koneti

## Overview

This document provides comprehensive API documentation for the Burnout Prediction System, including authentication, endpoints, request/response formats, and error handling.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Token) authentication with refresh token support.

### Authentication Flow

1. **Login**: POST `/auth/login`
2. **Refresh Token**: POST `/auth/refresh`
3. **Logout**: POST `/auth/logout`

### Headers

All authenticated requests must include:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee"
  }
}
```

#### POST /auth/login

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee"
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "new_jwt_access_token"
}
```

#### POST /auth/logout

Logout user and invalidate tokens.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### User Management Endpoints

#### GET /users/profile

Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "Engineering",
    "team": "Backend",
    "manager": "manager_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /users/profile

Update user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "department": "Engineering",
  "team": "Backend"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "Engineering",
    "team": "Backend"
  }
}
```

### Prediction Endpoints

#### GET /predictions

Get user's burnout predictions.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "id": "prediction_id",
      "userId": "user_id",
      "predictionDate": "2024-01-01T00:00:00.000Z",
      "burnoutRisk": "low",
      "riskScore": 0.25,
      "confidence": 0.85,
      "factors": {
        "workload": 0.3,
        "stress": 0.2,
        "workLifeBalance": 0.8,
        "meetingOverload": 0.4
      },
      "recommendations": [
        "Take regular breaks",
        "Consider reducing meeting frequency"
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /predictions/generate

Generate new burnout prediction.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "includeCalendar": true,
  "includeEmails": true,
  "includeSurveys": true,
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prediction generated successfully",
  "prediction": {
    "id": "prediction_id",
    "userId": "user_id",
    "predictionDate": "2024-01-01T00:00:00.000Z",
    "burnoutRisk": "medium",
    "riskScore": 0.65,
    "confidence": 0.78,
    "factors": {
      "workload": 0.7,
      "stress": 0.6,
      "workLifeBalance": 0.4,
      "meetingOverload": 0.8
    },
    "recommendations": [
      "Schedule focus time blocks",
      "Reduce meeting frequency",
      "Take regular breaks"
    ],
    "dataSources": {
      "calendarEvents": 45,
      "emailMessages": 120,
      "surveyResponses": 3
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /predictions/:id

Get specific prediction by ID.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "prediction": {
    "id": "prediction_id",
    "userId": "user_id",
    "predictionDate": "2024-01-01T00:00:00.000Z",
    "burnoutRisk": "medium",
    "riskScore": 0.65,
    "confidence": 0.78,
    "factors": {
      "workload": 0.7,
      "stress": 0.6,
      "workLifeBalance": 0.4,
      "meetingOverload": 0.8
    },
    "recommendations": [
      "Schedule focus time blocks",
      "Reduce meeting frequency",
      "Take regular breaks"
    ],
    "dataSources": {
      "calendarEvents": 45,
      "emailMessages": 120,
      "surveyResponses": 3
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Dashboard Endpoints

#### GET /dashboard/overview

Get dashboard overview data.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "overview": {
    "currentRisk": "medium",
    "riskScore": 0.65,
    "trend": "increasing",
    "lastPrediction": "2024-01-01T00:00:00.000Z",
    "recommendations": [
      "Schedule focus time blocks",
      "Reduce meeting frequency"
    ],
    "metrics": {
      "totalPredictions": 25,
      "averageRisk": 0.45,
      "highRiskDays": 5,
      "improvementDays": 12
    }
  }
}
```

#### GET /dashboard/trends

Get risk trends over time.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y)
- `granularity` (optional): Data granularity (daily, weekly, monthly)

**Response:**
```json
{
  "success": true,
  "trends": [
    {
      "date": "2024-01-01",
      "riskScore": 0.45,
      "riskLevel": "low",
      "factors": {
        "workload": 0.3,
        "stress": 0.2,
        "workLifeBalance": 0.8
      }
    }
  ],
  "summary": {
    "averageRisk": 0.45,
    "trend": "stable",
    "volatility": 0.15
  }
}
```

### Data Collection Endpoints

#### POST /data/calendar/sync

Sync calendar data for user.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "includeRecurring": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Calendar data synced successfully",
  "data": {
    "eventsCollected": 45,
    "dateRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "lastSync": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /data/emails/sync

Sync email data for user.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "includeSent": true,
  "includeReceived": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email data synced successfully",
  "data": {
    "messagesCollected": 120,
    "dateRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "lastSync": "2024-01-01T00:00:00.000Z"
  }
}
```

### Health Check Endpoints

#### GET /health

Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "connected": true,
      "host": "localhost",
      "port": 27017
    },
    "cache": {
      "status": "healthy",
      "connected": true,
      "memory": "256MB"
    },
    "application": {
      "status": "healthy",
      "uptime": 3600,
      "memoryUsage": 128,
      "nodeVersion": "v18.17.0"
    }
  },
  "metrics": {
    "totalRequests": 1250,
    "totalErrors": 5,
    "errorRate": 0.004,
    "averageResponseTime": 150,
    "memoryUsage": 128
  }
}
```

#### GET /metrics

Get system metrics.

**Headers:** `Authorization: Bearer <access_token>` (Admin only)

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalRequests": 1250,
    "averageResponseTime": 150,
    "errorRate": 0.004,
    "topEndpoints": [
      {
        "endpoint": "GET /predictions",
        "count": 450
      },
      {
        "endpoint": "GET /dashboard/overview",
        "count": 300
      }
    ],
    "statusCodes": {
      "200": 1200,
      "400": 30,
      "401": 15,
      "500": 5
    },
    "memoryUsage": 128,
    "uptime": 3600
  }
}
```

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |

### Example Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": "Invalid or expired token",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Rate Limited
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": "Too many requests. Try again in 60 seconds",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Prediction endpoints**: 10 requests per hour
- **Data sync endpoints**: 5 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Caching

The API implements caching for improved performance:

- **User profiles**: 24 hours
- **Predictions**: 1 hour
- **Dashboard data**: 30 minutes
- **API responses**: 15 minutes

Cache headers are included in responses:

```
X-Cache: HIT
X-Cache-TTL: 3600
Cache-Control: public, max-age=3600
```

## Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events

- `prediction.generated`: New prediction created
- `prediction.updated`: Prediction updated
- `user.registered`: New user registered
- `user.updated`: User profile updated

### Webhook Payload

```json
{
  "event": "prediction.generated",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "userId": "user_id",
    "predictionId": "prediction_id",
    "riskLevel": "medium",
    "riskScore": 0.65
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @burnout-prediction/api-client
```

```typescript
import { BurnoutPredictionAPI } from '@burnout-prediction/api-client';

const api = new BurnoutPredictionAPI({
  baseURL: 'https://api.burnout-prediction.com',
  apiKey: 'your-api-key'
});

const predictions = await api.predictions.list();
```

### Python

```bash
pip install burnout-prediction-api
```

```python
from burnout_prediction import BurnoutPredictionAPI

api = BurnoutPredictionAPI(
    base_url='https://api.burnout-prediction.com',
    api_key='your-api-key'
)

predictions = api.predictions.list()
```

## Support

For API support and questions:

- **Email**: api-support@burnout-prediction.com
- **Documentation**: https://docs.burnout-prediction.com
- **Status Page**: https://status.burnout-prediction.com
