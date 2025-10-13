# Security Guide - Burnout Prediction System
Created by Balaji Koneti

## Overview

This document outlines the comprehensive security measures implemented in the Burnout Prediction System to protect user data, ensure system integrity, and maintain compliance with industry standards.

## Security Architecture

### 1. Defense in Depth

The system implements multiple layers of security:

- **Network Security**: Firewalls, VPNs, network segmentation
- **Application Security**: Authentication, authorization, input validation
- **Data Security**: Encryption, access controls, audit logging
- **Infrastructure Security**: Secure configurations, monitoring, updates

### 2. Security Principles

- **Least Privilege**: Users and services have minimum required permissions
- **Zero Trust**: All requests are authenticated and authorized
- **Data Minimization**: Only necessary data is collected and stored
- **Encryption Everywhere**: Data encrypted in transit and at rest
- **Audit Everything**: All actions are logged and monitored

## Authentication & Authorization

### 1. JWT Token Security

#### Access Tokens
- **Expiration**: 15 minutes
- **Algorithm**: RS256 (RSA with SHA-256)
- **Claims**: User ID, role, permissions, expiration
- **Storage**: HTTP-only cookies (preferred) or secure storage

#### Refresh Tokens
- **Expiration**: 7 days
- **Storage**: Secure database with encryption
- **Rotation**: New refresh token issued on each use
- **Revocation**: Immediate invalidation on logout

#### Token Implementation

```typescript
// Access token generation
const accessToken = jwt.sign(
  {
    userId: user.id,
    role: user.role,
    permissions: user.permissions
  },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Refresh token generation
const refreshToken = jwt.sign(
  { userId: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

### 2. Role-Based Access Control (RBAC)

#### User Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| **Employee** | Read own data, Generate predictions | Standard user |
| **Manager** | Read team data, View team predictions | Team management |
| **Admin** | Full system access, User management | System administration |

#### Permission Matrix

| Resource | Employee | Manager | Admin |
|----------|----------|---------|-------|
| Own Profile | R/W | R/W | R/W |
| Own Predictions | R/W | R/W | R/W |
| Team Data | - | R | R/W |
| Team Predictions | - | R | R/W |
| User Management | - | - | R/W |
| System Settings | - | - | R/W |

### 3. Multi-Factor Authentication (MFA)

#### Implementation Options

```typescript
// TOTP (Time-based One-Time Password)
import speakeasy from 'speakeasy';

const secret = speakeasy.generateSecret({
  name: 'Burnout Prediction System',
  account: user.email
});

// SMS-based MFA
const smsCode = generateRandomCode();
await sendSMS(user.phone, smsCode);

// Email-based MFA
const emailCode = generateRandomCode();
await sendEmail(user.email, 'MFA Code', emailCode);
```

## Data Protection

### 1. Encryption

#### Data at Rest
- **Database**: MongoDB encryption at rest
- **Files**: AES-256 encryption for sensitive files
- **Backups**: Encrypted backup storage

#### Data in Transit
- **HTTPS**: TLS 1.3 for all communications
- **API**: JWT tokens for authentication
- **Database**: TLS connections to MongoDB
- **Cache**: TLS connections to Redis

#### Encryption Implementation

```typescript
// Data encryption
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('burnout-prediction', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('burnout-prediction', 'utf8'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 2. Data Classification

#### Sensitivity Levels

| Level | Description | Examples | Protection |
|-------|-------------|----------|------------|
| **Public** | Non-sensitive data | System status, public APIs | Standard |
| **Internal** | Internal business data | User counts, system metrics | Access control |
| **Confidential** | Sensitive business data | User profiles, predictions | Encryption + Access control |
| **Restricted** | Highly sensitive data | Personal health data, PII | Strong encryption + Audit |

#### Data Handling

```typescript
// Data classification
enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Data handling based on classification
function handleData(data: any, classification: DataClassification) {
  switch (classification) {
    case DataClassification.PUBLIC:
      return data; // No special handling
    case DataClassification.INTERNAL:
      return addAccessControl(data);
    case DataClassification.CONFIDENTIAL:
      return encrypt(addAccessControl(data));
    case DataClassification.RESTRICTED:
      return strongEncrypt(addAccessControl(addAuditLog(data)));
  }
}
```

### 3. Data Retention

#### Retention Policies

| Data Type | Retention Period | Disposal Method |
|-----------|------------------|-----------------|
| User Profiles | 7 years after last activity | Secure deletion |
| Predictions | 3 years | Secure deletion |
| Logs | 1 year | Secure deletion |
| Backups | 2 years | Secure deletion |

#### Implementation

```typescript
// Data retention service
class DataRetentionService {
  async cleanupExpiredData() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
    
    // Delete old predictions
    await Prediction.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    // Delete old logs
    await Log.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
  }
  
  async secureDelete(data: any) {
    // Overwrite data multiple times
    const overwriteData = Buffer.alloc(data.length, 0);
    
    // Write zeros
    await fs.writeFile(data.path, overwriteData);
    
    // Write random data
    const randomData = crypto.randomBytes(data.length);
    await fs.writeFile(data.path, randomData);
    
    // Delete file
    await fs.unlink(data.path);
  }
}
```

## Input Validation & Sanitization

### 1. Input Validation

#### Request Validation

```typescript
import { body, validationResult } from 'express-validator';

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-50 characters, letters only'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-50 characters, letters only'),
  
  body('role')
    .isIn(['employee', 'manager', 'admin'])
    .withMessage('Invalid role')
];

// Prediction validation
const validatePrediction = [
  body('includeCalendar')
    .isBoolean()
    .withMessage('includeCalendar must be boolean'),
  
  body('includeEmails')
    .isBoolean()
    .withMessage('includeEmails must be boolean'),
  
  body('dateRange.startDate')
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 date'),
  
  body('dateRange.endDate')
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 date')
];
```

#### SQL/NoSQL Injection Prevention

```typescript
// MongoDB query sanitization
function sanitizeMongoQuery(query: any) {
  // Remove dangerous operators
  const dangerousOperators = ['$where', '$regex', '$text', '$expr'];
  
  for (const operator of dangerousOperators) {
    if (query[operator]) {
      delete query[operator];
    }
  }
  
  // Validate field names
  const allowedFields = ['userId', 'email', 'role', 'createdAt'];
  const sanitizedQuery: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (allowedFields.includes(key)) {
      sanitizedQuery[key] = value;
    }
  }
  
  return sanitizedQuery;
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .substring(0, 1000); // Limit length
}
```

### 2. XSS Prevention

#### Output Encoding

```typescript
// HTML encoding
function encodeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// URL encoding
function encodeURL(text: string): string {
  return encodeURIComponent(text);
}

// JSON encoding
function encodeJSON(obj: any): string {
  return JSON.stringify(obj);
}
```

#### Content Security Policy (CSP)

```typescript
// CSP middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
```

## Network Security

### 1. HTTPS Configuration

#### SSL/TLS Setup

```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 2. Firewall Configuration

#### UFW Rules

```bash
# Basic firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow internal services
sudo ufw allow from 10.0.0.0/8 to any port 27017  # MongoDB
sudo ufw allow from 10.0.0.0/8 to any port 6379   # Redis

# Enable firewall
sudo ufw enable
```

#### iptables Rules

```bash
# Advanced firewall rules
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

## Monitoring & Logging

### 1. Security Logging

#### Audit Logging

```typescript
// Security event logging
interface SecurityEvent {
  timestamp: Date;
  eventType: 'login' | 'logout' | 'access_denied' | 'data_access' | 'admin_action';
  userId: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  result: 'success' | 'failure';
  details: any;
}

class SecurityLogger {
  async logSecurityEvent(event: SecurityEvent) {
    const logEntry = {
      ...event,
      severity: this.getSeverity(event.eventType),
      hash: this.generateHash(event)
    };
    
    // Log to file
    logger.security(JSON.stringify(logEntry));
    
    // Log to database
    await SecurityLog.create(logEntry);
    
    // Send to SIEM if critical
    if (logEntry.severity === 'critical') {
      await this.sendToSIEM(logEntry);
    }
  }
  
  private getSeverity(eventType: string): string {
    const severityMap = {
      'login': 'info',
      'logout': 'info',
      'access_denied': 'warning',
      'data_access': 'info',
      'admin_action': 'warning'
    };
    
    return severityMap[eventType] || 'info';
  }
}
```

#### Access Logging

```typescript
// Access logging middleware
export const accessLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const accessLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionID
    };
    
    logger.access(JSON.stringify(accessLog));
  });
  
  next();
};
```

### 2. Intrusion Detection

#### Anomaly Detection

```typescript
// Anomaly detection service
class AnomalyDetectionService {
  async detectAnomalies(userId: string, activity: any) {
    const userProfile = await this.getUserProfile(userId);
    
    // Check for unusual login patterns
    if (activity.type === 'login') {
      const isUnusualTime = this.isUnusualLoginTime(activity.timestamp);
      const isUnusualLocation = this.isUnusualLocation(activity.ip);
      
      if (isUnusualTime || isUnusualLocation) {
        await this.triggerSecurityAlert(userId, 'unusual_login', activity);
      }
    }
    
    // Check for excessive API calls
    if (activity.type === 'api_call') {
      const callCount = await this.getRecentAPICalls(userId, 300); // 5 minutes
      
      if (callCount > 100) {
        await this.triggerSecurityAlert(userId, 'excessive_api_calls', activity);
      }
    }
  }
  
  private async triggerSecurityAlert(userId: string, alertType: string, activity: any) {
    const alert = {
      userId,
      alertType,
      severity: 'high',
      timestamp: new Date(),
      activity,
      action: 'investigate'
    };
    
    // Log alert
    logger.security(JSON.stringify(alert));
    
    // Send notification
    await this.sendSecurityNotification(alert);
  }
}
```

## Compliance & Privacy

### 1. GDPR Compliance

#### Data Subject Rights

```typescript
// GDPR compliance service
class GDPRComplianceService {
  // Right to access
  async exportUserData(userId: string) {
    const userData = {
      profile: await User.findById(userId),
      predictions: await Prediction.find({ userId }),
      calendarEvents: await CalendarEvent.find({ userId }),
      emailMessages: await EmailMessage.find({ userId }),
      logs: await AccessLog.find({ userId })
    };
    
    return userData;
  }
  
  // Right to rectification
  async updateUserData(userId: string, updates: any) {
    const allowedFields = ['firstName', 'lastName', 'department', 'team'];
    const sanitizedUpdates = this.sanitizeUpdates(updates, allowedFields);
    
    return await User.findByIdAndUpdate(userId, sanitizedUpdates);
  }
  
  // Right to erasure
  async deleteUserData(userId: string) {
    // Anonymize instead of delete for audit purposes
    const anonymizedData = {
      firstName: 'Deleted',
      lastName: 'User',
      email: `deleted_${userId}@example.com`,
      phone: '000-000-0000',
      address: 'Deleted'
    };
    
    await User.findByIdAndUpdate(userId, anonymizedData);
    await Prediction.deleteMany({ userId });
    await CalendarEvent.deleteMany({ userId });
    await EmailMessage.deleteMany({ userId });
  }
  
  // Right to portability
  async exportUserDataPortable(userId: string) {
    const data = await this.exportUserData(userId);
    return JSON.stringify(data, null, 2);
  }
}
```

### 2. HIPAA Compliance

#### Health Data Protection

```typescript
// HIPAA compliance for health data
class HIPAAComplianceService {
  // Encrypt health data
  async encryptHealthData(data: any) {
    const encryptedData = encrypt(JSON.stringify(data));
    return {
      encryptedData,
      encryptionKey: this.generateEncryptionKey(),
      timestamp: new Date()
    };
  }
  
  // Audit health data access
  async auditHealthDataAccess(userId: string, dataType: string, action: string) {
    const auditLog = {
      userId,
      dataType,
      action,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    };
    
    await HealthDataAuditLog.create(auditLog);
  }
  
  // Data minimization
  async minimizeHealthData(data: any) {
    const requiredFields = ['burnoutRisk', 'riskScore', 'timestamp'];
    const minimizedData: any = {};
    
    for (const field of requiredFields) {
      if (data[field] !== undefined) {
        minimizedData[field] = data[field];
      }
    }
    
    return minimizedData;
  }
}
```

## Incident Response

### 1. Security Incident Response Plan

#### Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **Critical** | Data breach, system compromise | 15 minutes | CISO, Legal |
| **High** | Unauthorized access, DoS | 1 hour | Security Team |
| **Medium** | Suspicious activity, policy violation | 4 hours | Security Team |
| **Low** | Minor security events | 24 hours | Security Team |

#### Response Procedures

```typescript
// Incident response service
class IncidentResponseService {
  async handleSecurityIncident(incident: SecurityIncident) {
    // Immediate response
    await this.containIncident(incident);
    
    // Investigation
    const investigation = await this.investigateIncident(incident);
    
    // Recovery
    await this.recoverFromIncident(incident, investigation);
    
    // Lessons learned
    await this.documentLessonsLearned(incident, investigation);
  }
  
  private async containIncident(incident: SecurityIncident) {
    switch (incident.type) {
      case 'data_breach':
        await this.isolateAffectedSystems(incident);
        await this.revokeCompromisedCredentials(incident);
        break;
      
      case 'unauthorized_access':
        await this.blockSuspiciousIPs(incident);
        await this.disableCompromisedAccounts(incident);
        break;
      
      case 'dos_attack':
        await this.enableDDoSProtection(incident);
        await this.blockMaliciousTraffic(incident);
        break;
    }
  }
}
```

### 2. Security Testing

#### Penetration Testing

```bash
# OWASP ZAP security testing
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3001

# Nmap security scanning
nmap -sV -sC -O target-ip

# SSL/TLS testing
testssl.sh your-domain.com
```

#### Vulnerability Scanning

```bash
# Dependency vulnerability scanning
npm audit
pip check

# Container vulnerability scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image burnout-prediction/backend:latest
```

## Security Best Practices

### 1. Development Security

#### Secure Coding Practices

- **Input Validation**: Validate all inputs
- **Output Encoding**: Encode all outputs
- **Error Handling**: Don't expose sensitive information
- **Logging**: Log security events
- **Dependencies**: Keep dependencies updated

#### Code Review Checklist

- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Error handling secure
- [ ] Logging implemented
- [ ] Dependencies updated
- [ ] Secrets not hardcoded

### 2. Operational Security

#### Regular Security Tasks

```bash
# Daily tasks
./scripts/security-check.sh
./scripts/log-analysis.sh
./scripts/vulnerability-scan.sh

# Weekly tasks
./scripts/dependency-update.sh
./scripts/security-audit.sh
./scripts/backup-verification.sh

# Monthly tasks
./scripts/penetration-test.sh
./scripts/security-training.sh
./scripts/compliance-review.sh
```

#### Security Monitoring

```typescript
// Security monitoring dashboard
class SecurityMonitoringDashboard {
  async getSecurityMetrics() {
    return {
      failedLogins: await this.getFailedLogins(),
      suspiciousActivity: await this.getSuspiciousActivity(),
      vulnerabilityCount: await this.getVulnerabilityCount(),
      complianceScore: await this.getComplianceScore()
    };
  }
  
  async getSecurityAlerts() {
    return await SecurityAlert.find({
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    });
  }
}
```

## Contact & Support

For security concerns:

- **Security Email**: security@burnout-prediction.com
- **Emergency**: +1-800-SECURITY
- **Bug Bounty**: https://bugbounty.burnout-prediction.com
- **Security Status**: https://security.burnout-prediction.com
