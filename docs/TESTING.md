# Testing Strategy

This document outlines recommended regression testing across the ML service, Express backend, and React frontend.

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

## 2. Express Backend

| Layer               | Tooling                | How to run                               |
|---------------------|------------------------|-------------------------------------------|
| Unit / integration  | `jest`, `supertest`    | `cd backend && npm run test`             |
| Coverage            | `jest --coverage`      | `cd backend && npm run test:coverage`    |
| Lint                | `eslint`               | `cd backend && npm run lint`             |

Recommended scenarios:
1. Auth: registration/login, JWT refresh, role-based route protection.
2. Predictions: `/api/predictions/self`, `/api/predictions/:id`, cache invalidation.
3. Metadata: `/api/info`, `/api/health`, monitoring endpoints.
4. ML integration: mock the FastAPI service and validate request/response handling.

---

## 3. React Frontend

| Layer                 | Tooling                       | How to run                            |
|-----------------------|-------------------------------|----------------------------------------|
| Static analysis       | `eslint`                      | `cd frontend && npm run lint`          |
| Component tests       | `vitest`, `@testing-library`  | `cd frontend && npm run test`          |
| Coverage              | `vitest --coverage`           | `cd frontend && npm run test:coverage` |
| E2E (optional)        | `Cypress` or `Playwright`     | Configure in `frontend/tests/e2e`      |

Suggested end-to-end flows (using Playwright/Cypress):
1. **Employee journey**: login → view dashboard → open detailed analysis → verify charts render.
2. **Admin oversight**: login as admin → confirm risk breakdown, table filtering, metrics cards.
3. **Prediction refresh**: mock backend prediction update and assert dashboard refresh behavior.

---

## 4. Automated Regression Pipeline

Recommended CI workflow (GitHub Actions / GitLab CI):
1. `npm ci` + lint + tests for `backend`.
2. `npm ci` + lint + tests for `frontend`.
3. `pip install -r requirements.txt` + `pytest` for `ml`.
4. Provision test instances of MongoDB, Redis, and the ML service (e.g., GitHub Actions service containers or a shared test environment) and run Playwright/Cypress against the Vite frontend.
5. Publish coverage reports and fail builds below agreed thresholds (e.g., 80%).

---

Keeping this strategy up to date ensures confidence in releases across the data, service, and presentation layers.
