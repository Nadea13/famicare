#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting FamiCare Backend Automation..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
