# Deployment Guide

This document describes how to run the full burnout prediction platform locally with Docker Compose and how to prepare the stack for production deployments.

---

## 1. Prerequisites

- Docker 24+
- Docker Compose v2
- Node.js 20+ (only required for local non-container development)
- Python 3.11+ (only required for running the ML service without Docker)

---

## 2. Environment Configuration

1. Copy the sample compose environment file and adjust values as required:

   ```bash
   cp compose.env.example compose.env
   ```

2. Update `compose.env` with strong secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET`).
3. (Optional) Generate production-ready `.env` files for each service if you plan to run them outside Docker:
   - `backend-nest/env.example`
   - `frontend-next/.env.example`

---

## 3. Run with Docker Compose

1. Build and start all services:

   ```bash
   docker compose --env-file compose.env up --build
   ```

2. Services exposed:

   | Service        | URL                  | Description                       |
   |----------------|----------------------|-----------------------------------|
   | Frontend       | http://localhost:3000| Next.js dashboard                  |
   | Backend (Nest) | http://localhost:3001| REST API + auth + dashboards       |
   | ML Service     | http://localhost:8001| FastAPI model inference & metrics  |
   | PostgreSQL     | localhost:5432       | Primary relational database        |

3. Stop the stack and remove containers:

   ```bash
   docker compose down
   ```

4. Persisted data lives in the `pgdata` named volume. Remove it with `docker volume rm burnout_pgdata` if you want a clean database.

---

## 4. Applying Database Migrations

The backend service automatically executes `prisma migrate deploy` during container startup. If you need to run migrations manually:

```bash
docker compose exec backend npx prisma migrate deploy
```

To seed demo data:

```bash
docker compose exec backend npm run prisma:seed
```

---

## 5. Local Development (without Docker)

- **Backend**
  ```bash
  cd backend-nest
  npm install
  npm run prisma:migrate
  npm run start:dev
  ```

- **Frontend**
  ```bash
  cd frontend-next
  npm install
  npm run dev
  ```

- **ML Service**
  ```bash
  cd ml
  pip install -r requirements.txt
  uvicorn ml.src.api.server:app --host 0.0.0.0 --port 8001
  ```

Ensure PostgreSQL is running and `DATABASE_URL` matches your local database credentials.

---

## 6. Production Notes

- Replace hard-coded secrets in `compose.env` with values sourced from a secret manager (AWS Secrets Manager, HashiCorp Vault, etc.).
- Configure a reverse proxy (e.g., Nginx, Traefik) for TLS termination and to route traffic to the frontend and backend containers.
- Add observability: hook service logs into your logging stack and export Prometheus metrics for the ML service if required.
- Regularly trigger the ML training CLI (`burnout-train`) with fresh labeled data and redeploy the ML container with the updated model artifacts.

---

## 7. Troubleshooting

| Issue | Resolution |
| ----- | ---------- |
| Backend reports `prisma` command not found | Ensure the image is rebuilt after modifying `compose.env` or reinstalling dependencies. |
| ML service fails with missing model files | Run the training CLI to produce artifacts or copy pre-trained models into `ml/models/`. |
| `NEXTAUTH_URL`/`NEXT_PUBLIC_BACKEND_URL` mismatched in production | Override these environment variables to match your public domain. |

---

For additional assistance refer to the README or open an issue with logs and configuration snippets.
