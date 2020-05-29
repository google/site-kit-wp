#!/bin/bash

# Exit if any command fails
set -e

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Get the host port for the WordPress container.
HOST_PORT=$(dc port $CONTAINER 80 | awk -F : '{printf $2}')

# Check for the site status
if [[ -z $(curl -s --head --fail http://localhost:$HOST_PORT) ]]; then
	status_message "E2E environment is not running, starting it now..."
	npm run env:start
fi
