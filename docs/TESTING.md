# Testing Strategy

This document outlines recommended regression testing across the ML service, NestJS backend, and Next.js frontend.

---

## 1. Machine Learning Service

| Layer               | Tooling             | How to run                             |
|---------------------|---------------------|-----------------------------------------|
| Unit tests          | `pytest`            | `cd ml && pytest`                       |
| Coverage            | `pytest --cov`      | `cd ml && pytest --cov=src`             |
| Model evaluation    | Training CLI output | `burnout-train --data snapshots.json`   |
| API contract        | `httpx`, `pytest`   | Add tests under `ml/tests/`             |

Key checks:
- Training pipeline stores metrics (accuracy, macro F1, ROC AUC) and confusion matrices.
- `/predict` returns risk level, score, confidence, probabilities, recommendations.
- `/metrics` endpoint serves the latest evaluation artefacts.

---

## 2. NestJS Backend

| Layer                | Tooling         | How to run                                      |
|----------------------|-----------------|-------------------------------------------------|
| Unit / integration    | `jest`, `supertest` | `cd backend-nest && npm run test`                |
| E2E with database     | `jest --config test/jest-e2e.json` | `cd backend-nest && npm run test:e2e` |
| Lint                  | `eslint`        | `npm run lint`                                   |

Recommended scenarios:
1. Auth: register/login, JWT refresh, role-guarded routes.
2. Predictions: `/predictions/self`, admin `/predictions/:id`, persisted BurnoutScore fields.
3. Dashboards: `/employee/dashboard`, `/admin/employees`, `/admin/metrics` response shape.
4. Prisma migrations: run in CI against a disposable Postgres container.

---

## 3. Next.js Frontend

| Layer                 | Tooling                  | How to run                          |
|-----------------------|--------------------------|--------------------------------------|
| Static analysis       | `eslint`                | `cd frontend-next && npm run lint`   |
| Component tests       | `vitest`, `jest-dom` (optional) | Set up in `frontend-next/src/__tests__` |
| Integration / e2e     | `Playwright` or `Cypress` | Example: `npx playwright test`       |

Suggested end-to-end flows (using Playwright/Cypress):
1. **Employee journey**: login → view dashboard → open detailed analysis → assert charts render.
2. **Admin oversight**: login as admin → confirm risk breakdown, table filtering, metrics cards.
3. **Prediction refresh**: trigger self prediction (mock backend) and detect UI update.

---

## 4. Automated Regression Pipeline

Recommended CI workflow (GitHub Actions / GitLab CI):
1. `npm ci` + lint + tests for `backend-nest`.
2. Spin up ML service + backend + Postgres via Docker Compose and run Playwright/Cypress against Next frontend.
3. Train ML models in a nightly schedule, commit updated artefacts or publish to object storage.
4. Publish coverage reports and fail builds below agreed thresholds (e.g., 80%).

---

Keeping this strategy up to date ensures confidence in releases across the data, service, and presentation layers.
