# Deployment Guide - Burnout Prediction System
Created by Balaji Koneti

## Overview

This guide provides comprehensive instructions for deploying the Burnout Prediction System in various environments, from development to production.

## Prerequisites

### System Requirements

- **Node.js**: v18.17.0 or higher
- **Python**: 3.9 or higher
- **MongoDB**: 5.0 or higher
- **Redis**: 6.0 or higher
- **Docker**: 20.10 or higher (optional)
- **Docker Compose**: 2.0 or higher (optional)

### Required Services

- **Database**: MongoDB (primary data storage)
- **Cache**: Redis (session and data caching)
- **ML Service**: Python FastAPI service
- **Backend**: Node.js Express API
- **Frontend**: React application

## Environment Setup

### 1. Development Environment

#### Clone Repository

```bash
git clone https://github.com/your-org/burnout-prediction-system.git
cd burnout-prediction-system
```

#### Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install ML dependencies
cd ../ml
pip install -r requirements.txt
```

#### Environment Variables

Create environment files for each service:

**Backend (.env)**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/burnout_prediction
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
PORT=3001
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ML Service
ML_SERVICE_URL=http://localhost:8000

# External APIs
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
```

**ML Service (.env)**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/burnout_prediction

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# API
PORT=8000
CORS_ORIGIN=http://localhost:3000

# External APIs
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# ML Configuration
USE_REAL_CALENDAR_API=false
USE_REAL_GMAIL_API=false
MODEL_PATH=./models/burnout_model.pkl
```

### 2. Production Environment

#### Server Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps+ connection

#### Production Environment Variables

**Backend (.env.production)**
```bash
# Database
MONGODB_URI=mongodb://mongodb:27017/burnout_prediction
MONGODB_MAX_POOL_SIZE=20
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
PORT=3001
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ML Service
ML_SERVICE_URL=http://ml-service:8000

# Security
ENCRYPTION_KEY=your-encryption-key
SESSION_SECRET=your-session-secret
BCRYPT_ROUNDS=12

# External APIs
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

## Deployment Methods

### 1. Docker Compose Deployment (Recommended)

#### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale ml-service=2
```

### 2. Manual Deployment

#### Step 1: Database Setup

```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Step 2: Backend Deployment

```bash
cd backend

# Install dependencies
npm install --production

# Run database migrations
npm run migrate

# Start backend service
npm start
```

#### Step 3: ML Service Deployment

```bash
cd ml

# Install dependencies
pip install -r requirements.txt

# Start ML service
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

#### Step 4: Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve static files (using nginx)
sudo cp -r dist/* /var/www/html/
```

### 3. Kubernetes Deployment

#### Create Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: burnout-prediction
```

#### MongoDB Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: burnout-prediction
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:5.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "password"
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
      volumes:
      - name: mongodb-storage
        persistentVolumeClaim:
          claimName: mongodb-pvc
```

#### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: burnout-prediction
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: burnout-prediction/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017/burnout_prediction"
        - name: REDIS_HOST
          value: "redis"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Database Setup

### 1. MongoDB Configuration

#### Create Database and User

```javascript
// Connect to MongoDB
mongo

// Create database
use burnout_prediction

// Create user
db.createUser({
  user: "burnout_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "burnout_prediction" }
  ]
})
```

#### Run Migrations

```bash
cd backend
npm run migrate
```

#### Create Indexes

```javascript
// Connect to database
use burnout_prediction

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.predictions.createIndex({ "userId": 1, "predictionDate": -1 })
db.predictions.createIndex({ "burnoutRisk": 1 })
db.calendar_events.createIndex({ "userId": 1, "startTime": 1 })
db.email_messages.createIndex({ "userId": 1, "timestamp": -1 })
```

### 2. Redis Configuration

#### Configure Redis

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Set password
requirepass your-redis-password

# Set memory policy
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
```

## Security Configuration

### 1. SSL/TLS Setup

#### Generate SSL Certificates

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate
openssl req -new -x509 -key private.key -out certificate.crt -days 365

# Combine for nginx
cat certificate.crt private.key > ssl.pem
```

#### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/ssl.pem;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow MongoDB (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 27017

# Allow Redis (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 6379

# Enable firewall
sudo ufw enable
```

## Monitoring and Logging

### 1. Application Monitoring

#### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# ML service health
curl http://localhost:8000/health

# Database health
mongo --eval "db.adminCommand('ping')"
```

#### Log Monitoring

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f ml-service

# View system logs
sudo journalctl -u burnout-prediction-backend
sudo journalctl -u burnout-prediction-ml
```

### 2. Performance Monitoring

#### Install Monitoring Tools

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xzf prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64
./prometheus --config.file=prometheus.yml
```

#### Configure Grafana

```bash
# Install Grafana
sudo apt-get install -y adduser libfontconfig1
wget https://dl.grafana.com/oss/release/grafana_9.3.0_amd64.deb
sudo dpkg -i grafana_9.3.0_amd64.deb
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

## Backup and Recovery

### 1. Database Backup

#### MongoDB Backup

```bash
# Create backup
mongodump --db burnout_prediction --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db burnout_prediction /backup/20240101/burnout_prediction
```

#### Redis Backup

```bash
# Create backup
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb

# Restore backup
redis-cli --pipe < /backup/redis-20240101.rdb
```

### 2. Application Backup

```bash
# Backup application data
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /opt/burnout-prediction

# Backup configuration
cp -r /etc/burnout-prediction /backup/config-$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check MongoDB logs
sudo journalctl -u mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

#### 2. Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo journalctl -u redis-server

# Test connection
redis-cli ping
```

#### 3. Application Issues

```bash
# Check application logs
docker-compose logs backend
docker-compose logs ml-service

# Check system resources
htop
df -h
free -h
```

### Performance Issues

#### 1. High Memory Usage

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart services
docker-compose restart backend ml-service
```

#### 2. Slow Database Queries

```javascript
// Enable slow query logging
db.setProfilingLevel(2, { slowms: 100 })

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

## Scaling

### 1. Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

upstream ml-service {
    server ml1:8000;
    server ml2:8000;
}
```

#### Auto-scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Database Scaling

#### MongoDB Replica Set

```yaml
# Primary
mongod --replSet rs0 --port 27017

# Secondary
mongod --replSet rs0 --port 27018

# Initialize replica set
mongo --eval "rs.initiate()"
```

## Maintenance

### 1. Regular Maintenance

#### Daily Tasks

```bash
# Check system health
./scripts/health-check.sh

# Backup databases
./scripts/backup.sh

# Check logs for errors
./scripts/log-check.sh
```

#### Weekly Tasks

```bash
# Update dependencies
npm audit fix
pip install --upgrade -r requirements.txt

# Clean old logs
./scripts/cleanup-logs.sh

# Performance analysis
./scripts/performance-analysis.sh
```

### 2. Updates and Patches

#### Application Updates

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install
pip install -r requirements.txt

# Run migrations
npm run migrate

# Restart services
docker-compose restart
```

#### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
docker-compose up -d

# Check for vulnerabilities
npm audit
pip check
```

## Support

For deployment support:

- **Email**: deployment-support@burnout-prediction.com
- **Documentation**: https://docs.burnout-prediction.com
- **Status Page**: https://status.burnout-prediction.com
- **Emergency**: +1-800-BURNOUT-1
