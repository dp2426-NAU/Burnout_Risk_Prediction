# Start ML Service
cd $PSScriptRoot
python -m uvicorn src.api.server:app --host 0.0.0.0 --port 8001


