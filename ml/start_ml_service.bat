@echo off
cd /d "%~dp0"
python -m uvicorn src.api.server:app --host 0.0.0.0 --port 8001
pause

