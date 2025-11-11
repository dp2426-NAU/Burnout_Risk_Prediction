PROJECT_ROOT := $(shell pwd)

.PHONY: install backend frontend ml db-seed train

install:
	cd backend && npm install
	cd frontend && npm install
	test -f ml/requirements.txt && pip install -r ml/requirements.txt || true

backend:
	cd backend && npm run dev

frontend:
	cd frontend && npm run dev

ml:
	cd ml && uvicorn ml.src.api.server:app --host 0.0.0.0 --port 8001

db-seed:
	cd backend && npm run generate-users

train:
	cd ml && burnout-train --data data/snapshots.json --model-dir models --advanced-dir models/advanced
