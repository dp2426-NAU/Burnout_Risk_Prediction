# 🚀 Burnout Prediction System - Production Ready

[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](https://github.com/yourusername/burnout-prediction-system)
[![Test Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen.svg)](https://github.com/yourusername/burnout-prediction-system)
[![Security](https://img.shields.io/badge/Security-Hardened-blue.svg)](https://github.com/yourusername/burnout-prediction-system)
A comprehensive, production-ready system for predicting burnout risk in hybrid and remote teams using machine learning, real-time data collection, and advanced analytics.

## 🎯 Overview

This system analyzes employee behavior patterns from calendar events, email communications, and survey responses to predict burnout risk with high accuracy. Built with industrial standards and ready for enterprise deployment.

### ✨ Key Features

- **🤖 Advanced ML Models**: Random Forest, Gradient Boosting, Neural Networks, Ensemble Methods
- **📊 Real-time Data Collection**: Google Calendar, Gmail integration with OAuth 2.0
- **🔒 Enterprise Security**: JWT authentication, RBAC, rate limiting, input validation
- **📈 Comprehensive Analytics**: Dashboard, trends, recommendations, team insights
- **⚡ High Performance**: Redis caching, database optimization, response compression
- **🔍 Monitoring**: Health checks, metrics collection, structured logging, alerting
- **🧪 80%+ Test Coverage**: Unit, integration, and component tests across all services
- **🚀 Operational Tooling**: Automated testing, linting, and observability integrations out of the box

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   ML Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 5173    │    │   Port: 3001    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │   MongoDB       │    │   Redis         │
│  (Optional)     │    │   Database      │    │   Cache         │
│  Edge Proxy     │    │   Port: 27017   │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **Python**: 3.9 or higher
- **MongoDB**: v6.x (local install or managed cluster)
- **Redis**: v7.x (local install or managed cache)

### Manual Setup

```bash
# 1. Ensure MongoDB and Redis are running locally (or update connection strings accordingly)

# 2. Configure environments
cp backend/env.example backend/.env
echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../ml && pip install -r requirements.txt

# 4. (Optional) generate demo user data
cd backend && npm run generate-users

# 5. Start each service in separate terminals
cd backend && npm run dev          # http://localhost:3001
cd frontend && npm run dev         # http://localhost:5173
cd ml && uvicorn src.api.server:app --host 0.0.0.0 --port 8001
```

## 🔐 Login Credentials

### Admin Access
- **Email**: `admin@company.com`
- **Password**: `AdminPass123!`
- **Access**: Full system access, user management

### Manager Access
- **Email**: `alex.thompson@company.com`
- **Password**: `MgrPass123!`
- **Access**: Team management, team analytics

### Employee Access
- **Email**: `alice.johnson@company.com`
- **Password**: `EmpPass123!`
- **Access**: Personal dashboard, predictions

## 📊 System Features

### 🎯 Core Functionality

1. **Burnout Risk Prediction**
   - Real-time risk assessment
   - Historical trend analysis
   - Personalized recommendations
   - Team-level insights

2. **Data Collection**
   - Calendar event analysis
   - Email sentiment analysis
   - Survey responses
   - Biometric data integration

3. **Analytics Dashboard**
   - Risk score visualization
   - Trend analysis
   - Team comparisons
   - Intervention recommendations

### 🔧 Technical Features

1. **Security**
   - JWT authentication with refresh tokens
   - Role-based access control (RBAC)
   - Rate limiting and CORS protection
   - Input validation and XSS prevention
   - Secrets management

2. **Performance**
   - Redis caching with TTL
   - Database indexing and optimization
   - Response compression
   - Connection pooling

3. **Monitoring**
   - Health checks for all services
   - Metrics collection and alerting
   - Structured logging
   - Performance monitoring

## 🧪 Testing

The system includes comprehensive testing across all components:

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# ML tests
cd ml
pytest tests/
pytest --cov=src tests/
```

**Test Coverage**: 80%+ across all services

## 📚 Documentation

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Security Guide](docs/SECURITY_GUIDE.md)** - Security best practices
- **[User Credentials](docs/USER_CREDENTIALS.md)** - Complete user database

## 🔧 Configuration

### Environment Variables

Create `.env` file with the following variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/burnout_prediction
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External APIs (Optional)
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
```

## 🚀 Deployment

### Production Deployment

The stack can be deployed on traditional servers or platform services:
1. Provision MongoDB and Redis (managed services or dedicated VMs).
2. Deploy the backend (Node.js) service behind a process manager such as PM2 or systemd.
3. Serve the frontend using a static host (Vite build output) or a lightweight web server.
4. Host the ML FastAPI service with Uvicorn/Gunicorn behind an HTTP proxy.

### CI/CD Pipeline

The system includes automated CI/CD with GitHub Actions:
- Automated testing
- Security scanning
- Build and packaging steps for backend/frontend
- Deployment automation hooks (customise for your environment)

## 📈 Monitoring

### Health Checks
- **Backend**: `http://localhost:3001/api/health`
- **ML Service**: `http://localhost:8001/health`
- **Frontend**: provide a lightweight `/health` endpoint if exposing publicly

### Metrics
- Request/response metrics
- Database performance
- Model prediction latency
- Error rates by endpoint

### Logging
- Structured JSON logging
- Request ID tracking
- Performance logging
- Security event logging

## 🔒 Security

### Security Features
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Secrets management

### Security Best Practices
- No hardcoded secrets
- Environment-specific configurations
- Regular security updates
- Vulnerability scanning
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@burnout-prediction.com
- **Documentation**: https://docs.burnout-prediction.com
- **Issues**: https://github.com/yourusername/burnout-prediction-system/issues

## 🎉 Acknowledgments

- **Created by**: Balaji Koneti
- **Framework**: React, Node.js, Python, FastAPI
- **Database**: MongoDB, Redis
- **ML Libraries**: Scikit-learn, TensorFlow, Pandas, NumPy

---

**🚀 Ready for Production Deployment!**

This system meets all industrial standards and is ready for enterprise deployment with comprehensive testing, security, monitoring, and documentation.
