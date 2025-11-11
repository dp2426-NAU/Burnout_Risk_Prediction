# Deployment Guide

This document describes how to run the burnout prediction platform locally without Docker and how to prepare the stack for production deployments using the React frontend, Express backend, and Python ML service.

---

## 1. Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 6.x (local install or managed cluster)
- Redis 7.x (local install or managed cache)
- Optional: process manager (PM2, systemd, Supervisor) for production deployments

---

## 2. Environment Configuration

1. Create the backend environment file:

   ```bash
   cp backend/env.example backend/.env
   ```

   Update the copy with your MongoDB/Redis connection strings and strong JWT secrets.

2. Configure the frontend API endpoint:

   ```bash
   echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env
   ```

3. (Optional) define environment overrides for the ML service in `ml/.env` if you need to adjust model locations or service ports.

---

## 3. Local Development Workflow

1. Start MongoDB and Redis using your preferred method (native services, Atlas/Elasticache, etc.).
2. Install dependencies and start the backend:

   ```bash
   cd backend
   npm install
   npm run dev          # http://localhost:3001
   ```

3. In a new terminal, run the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev          # http://localhost:5173
   ```

4. In another terminal, run the ML service:

   ```bash
   cd ml
   pip install -r requirements.txt
   uvicorn src.api.server:app --host 0.0.0.0 --port 8001
   ```

Ensure the `.env` files point to the same MongoDB/Redis instances and that the frontend references the backend URL.

---

## 4. Seeding Data & Admin Accounts

Run the following scripts from the project root once the backend dependencies are installed:

```bash
cd backend
npm run generate-users
node scripts/generate-realistic-data.js
```

These commands populate MongoDB with realistic demo records so you can sign in using the credentials documented in the README.

---

## 5. Production Notes

- Store secrets (JWT keys, database credentials) in a secure vault and inject them via environment variables.
- Use a process manager (PM2, systemd, Supervisord) to keep the backend and ML services running and to handle restarts.
- Serve the built frontend (`frontend/dist`) through a static file host or reverse proxy (Nginx, Apache, S3 + CloudFront, etc.).
- Configure backups, high-availability replicas, or managed services for MongoDB and Redis.
- Export backend and ML logs to your centralized logging stack and enable metrics scraping (Prometheus/Grafana) for observability.
- Schedule periodic ML retraining with the CLI tools in `ml/src/training` and redeploy updated artefacts.

---

## 6. Troubleshooting

| Issue | Resolution |
| ----- | ---------- |
| Backend fails to connect to MongoDB | Confirm `MONGODB_URI` matches your running instance and that credentials (if any) are correct. |
| Redis connection warnings in backend logs | Ensure the Redis service is reachable and `REDIS_HOST`/`REDIS_PORT` are set in `.env`. |
| Frontend API calls return CORS errors | Update `CORS_ORIGIN` in `backend/.env` to include the URL serving the frontend. |
| ML service responds with 500 status | Verify the model artefacts exist under `ml/models/` or rerun the training pipeline to regenerate them. |

---

For additional assistance refer to the README or open an issue with logs and configuration snippets.
