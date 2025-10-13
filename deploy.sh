#!/bin/bash

# 🚀 Burnout Prediction System - Production Deployment Script
# Created by Balaji Koneti

set -e

echo "🚀 Starting Burnout Prediction System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database Configuration
MONGODB_URI=mongodb://mongodb:27017/burnout_prediction
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ML Service
ML_SERVICE_URL=http://ml-service:8000

# Security
ENCRYPTION_KEY=your-encryption-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this-in-production
BCRYPT_ROUNDS=12

# External APIs (Optional - will use synthetic data if not provided)
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=

# Monitoring
SENTRY_DSN=
ANALYTICS_ID=
EOF
        print_success "Environment file created"
    else
        print_warning "Environment file already exists"
    fi
}

# Deploy with Docker Compose
deploy_application() {
    print_status "Deploying application with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    print_success "Application deployed successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    timeout 60 bash -c 'until docker exec burnout-mongodb mongosh --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do sleep 2; done'
    print_success "MongoDB is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout 30 bash -c 'until docker exec burnout-redis redis-cli ping > /dev/null 2>&1; do sleep 2; done'
    print_success "Redis is ready"
    
    # Wait for Backend
    print_status "Waiting for Backend..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/health > /dev/null 2>&1; do sleep 2; done'
    print_success "Backend is ready"
    
    # Wait for ML Service
    print_status "Waiting for ML Service..."
    timeout 60 bash -c 'until curl -f http://localhost:8000/health > /dev/null 2>&1; do sleep 2; done'
    print_success "ML Service is ready"
    
    # Wait for Frontend
    print_status "Waiting for Frontend..."
    timeout 30 bash -c 'until curl -f http://localhost:5173 > /dev/null 2>&1; do sleep 2; done'
    print_success "Frontend is ready"
}

# Generate user data
generate_users() {
    print_status "Generating user data..."
    
    # Install dependencies and generate users
    docker exec burnout-backend npm install
    docker exec burnout-backend npm run generate-users
    
    print_success "User data generated successfully"
}

# Display access information
show_access_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Access URLs:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend API: http://localhost:3001"
    echo "  ML Service: http://localhost:8000"
    echo ""
    echo "🔐 Login Credentials:"
    echo "  Admin: admin@company.com / AdminPass123!"
    echo "  Manager: alex.thompson@company.com / MgrPass123!"
    echo "  Employee: alice.johnson@company.com / EmpPass123!"
    echo ""
    echo "📊 System Status:"
    echo "  MongoDB: http://localhost:27017"
    echo "  Redis: http://localhost:6379"
    echo ""
    echo "📚 Documentation:"
    echo "  API Docs: docs/API_DOCUMENTATION.md"
    echo "  Deployment Guide: docs/DEPLOYMENT_GUIDE.md"
    echo "  Security Guide: docs/SECURITY_GUIDE.md"
    echo "  User Credentials: docs/USER_CREDENTIALS.md"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update services: docker-compose pull && docker-compose up -d"
}

# Main deployment function
main() {
    echo "🚀 Burnout Prediction System - Production Deployment"
    echo "=================================================="
    echo ""
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    
    # Setup
    create_env_file
    
    # Deploy
    deploy_application
    
    # Wait for services
    wait_for_services
    
    # Generate users
    generate_users
    
    # Show access info
    show_access_info
    
    print_success "🎉 System is now live and ready to use!"
}

# Run main function
main "$@"
