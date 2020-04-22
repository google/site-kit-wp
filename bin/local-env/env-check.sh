#!/bin/bash

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Get the host port for the WordPress container.
HOST_PORT=$(dc port $CONTAINER 80 | awk -F : '{printf $2}')

# Check for the site status
if [[ -z $(curl -s --head --fail http://localhost:$HOST_PORT) ]]; then
	echo -e $(status_message 'e2e environment is not running, starting now.')
	npm run env:start
	exit 0
fi
exit 0
