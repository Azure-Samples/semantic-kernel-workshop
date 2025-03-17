#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists python; then
    echo "Error: Python is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

echo "Starting Semantic Kernel Demo..."
echo "--------------------------------"

# Start the backend server
echo "Starting backend server..."
cd backend
uv run run.py &
BACKEND_PID=$!

# Wait a bit for the backend to initialize
sleep 2

# Start the frontend development server
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "--------------------------------"
echo "🚀 Services are running!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait