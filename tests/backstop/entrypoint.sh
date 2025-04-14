#!/bin/bash

# Start http-server in the background
http-server /src/dist -p 8001 &

# Wait a moment for the server to start
sleep 2

# Run backstop with the provided arguments
# backstop "$@" --config=/src/tests/backstop/config.js
backstop "$@"