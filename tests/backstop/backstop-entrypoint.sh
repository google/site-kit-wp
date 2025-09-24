#!/bin/bash

echo "Starting the HTTP server for Storybook files..."

# Check if the Storybook build exists.
if [ ! -f /src/dist/iframe.html ]; then
    echo "Error: Storybook build not found at /src/dist/iframe.html"
    echo "Please run: npm run build:storybook"
    exit 1
fi

# Start a Python HTTP server in the background.
python3 -m http.server 3000 --directory /src/dist > /dev/null 2>&1 &
SERVER_PID=$!

# Function to stop the server on exit.
cleanup() {
    echo "Stopping the HTTP server..."
    kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for the server to start and verify.
echo "Waiting for the server to start..."
for i in {1..10}; do
    sleep 1
    if wget --quiet --spider http://localhost:3000/iframe.html 2>/dev/null; then
        echo "Storybook server started successfully on port 3000."
        break
    elif [ $i -eq 10 ]; then
        echo "Warning: Could not verify Storybook server after 10 seconds."
        echo "Proceeding anyway - server may still be functional."
    fi
done

# Run Backstop with the provided arguments.
echo "Running Backstop tests with the following arguments: $*"
backstop --config=/src/tests/backstop/config.js "$@" 