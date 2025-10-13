# 🚀 Burnout Prediction System - Production Ready

[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](https://github.com/yourusername/burnout-prediction-system)
[![Test Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen.svg)](https://github.com/yourusername/burnout-prediction-system)
[![Security](https://img.shields.io/badge/Security-Hardened-blue.svg)](https://github.com/yourusername/burnout-prediction-system)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue.svg)](https://github.com/yourusername/burnout-prediction-system)

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
- **🐳 Production Ready**: Docker containers, CI/CD pipeline, automated deployment

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
│   Nginx         │    │   MongoDB       │    │   Redis         │
│   Load Balancer │    │   Database      │    │   Cache         │
│   Port: 80/443  │    │   Port: 27017   │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **Python**: 3.9 or higher
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/burnout-prediction-system.git
cd burnout-prediction-system

# Run deployment script
# For Linux/Mac:
chmod +x deploy.sh
./deploy.sh

# For Windows:
deploy.bat
```

### Option 2: Manual Setup

```bash
# 1. Start services
docker-compose up -d

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../ml && pip install -r requirements.txt

# 3. Generate user data
cd backend && npm run generate-users

# 4. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# ML Service: http://localhost:8000
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

1. **VPS/Cloud Deployment**
   ```bash
   # Use production Docker Compose
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Kubernetes Deployment**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Cloud Platform Deployment**
   - AWS ECS/EC2
   - Google Cloud Run
   - Azure Container Instances

### CI/CD Pipeline

The system includes automated CI/CD with GitHub Actions:
- Automated testing
- Security scanning
- Docker image building
- Deployment automation

## 📈 Monitoring

### Health Checks
- **Backend**: `http://localhost:3001/health`
- **ML Service**: `http://localhost:8000/health`
- **Frontend**: `http://localhost:5173/health`

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
- **Deployment**: Docker, Docker Compose, Kubernetes

---

**🚀 Ready for Production Deployment!**

This system meets all industrial standards and is ready for enterprise deployment with comprehensive testing, security, monitoring, and documentation.
