#!/bin/bash

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Check for the site status
if [[ -z $(curl -s --head --fail $npm_package_config_E2E_URL) ]]; then
	echo -e $(status_message 'e2e environment is not running, starting it now.')
	npm run env:start
	exit 0
fi
exit 0
