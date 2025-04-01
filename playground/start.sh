#!/bin/bash

# Configuration
export BACKEND_HOST="localhost"
export BACKEND_PORT=8000
export FRONTEND_HOST="localhost"
export FRONTEND_PORT=5173
WAIT_TIMEOUT=30 # Maximum time to wait for each service (seconds)

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a port to be open
wait_for_port() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=$WAIT_TIMEOUT
    local start_time=$(date +%s)

    echo -n "Waiting for $service_name on $host:$port..."

    if command_exists nc; then
        # Use netcat if available
        while ! nc -z $host $port > /dev/null 2>&1; do
            local current_time=$(date +%s)
            if [ $((current_time - start_time)) -ge $timeout ]; then
                echo " Timeout!"
                echo "Error: $service_name did not start within $timeout seconds."
                cleanup # Attempt to kill already started processes
                exit 1
            fi
            echo -n "."
            sleep 1
        done
    elif command_exists curl; then
        # Fallback to curl
         while ! curl --output /dev/null --silent --head --fail "http://$host:$port"; do
            local current_time=$(date +%s)
            if [ $((current_time - start_time)) -ge $timeout ]; then
                echo " Timeout!"
                echo "Error: $service_name did not start within $timeout seconds."
                cleanup # Attempt to kill already started processes
                exit 1
            fi
            echo -n "."
            sleep 1
        done
    else
        echo " Neither 'nc' nor 'curl' command found. Cannot check port status. Assuming services started after a delay."
        sleep 5 # Simple delay as fallback
    fi

    echo " Ready."
}

# Check for required commands
if ! command_exists python3; then
    echo "Error: Python is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi

echo "Starting Semantic Kernel Demo..."
echo "--------------------------------"

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    # Kill processes using PID if available
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Start the backend server
echo "Starting backend server..."
cd backend
# Redirect uv output to avoid cluttering the wait messages
uv run main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start the frontend development server
echo "Starting frontend server..."
cd frontend
# Redirect npm output to avoid cluttering the wait messages
npm run dev -- -p $FRONTEND_PORT > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to be ready
wait_for_port $BACKEND_HOST $BACKEND_PORT "Backend"
wait_for_port $FRONTEND_HOST $FRONTEND_PORT "Frontend"

echo "--------------------------------"
echo "🚀 Services are running!"
echo "Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "Backend: http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "Log files: backend.log, frontend.log"
echo "Press Ctrl+C to stop all services"

# Wait for both background processes to complete (will only happen on Ctrl+C)
wait