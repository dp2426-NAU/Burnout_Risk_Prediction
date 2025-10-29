PROJECT_ROOT := $(shell pwd)

.PHONY: install backend frontend ml docker-up docker-down docker-rebuild prisma-migrate prisma-seed train

install:
	cd backend-nest && npm install
	cd frontend-next && npm install
	test -f ml/requirements.txt && pip install -r ml/requirements.txt || true

backend:
	cd backend-nest && npm run start:dev

frontend:
	cd frontend-next && npm run dev

ml:
	cd ml && uvicorn ml.src.api.server:app --host 0.0.0.0 --port 8001

docker-up:
	docker compose --env-file compose.env up -d --build

docker-down:
	docker compose down

docker-rebuild:
	docker compose --env-file compose.env down
	docker compose --env-file compose.env up -d --build

prisma-migrate:
	cd backend-nest && npx prisma migrate dev

prisma-seed:
	cd backend-nest && npm run prisma:seed

train:
	cd ml && burnout-train --data data/snapshots.json --model-dir models --advanced-dir models/advanced
