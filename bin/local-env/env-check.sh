#!/bin/bash

# Fail on unset variables.
set -u

# Include useful functions
. "$(dirname "$0")/includes.sh"

# If the WordPress container isn't running, start the environment.
if ! dc ps -q $CONTAINER ; then
	status_message "E2E environment is not running, starting it now..."
	npm run env:start
fi
