#!/bin/bash

# Stop all parallel Docker Compose stacks for E2E tests.

set -e

WORKERS="${E2E_PARALLEL_WORKERS:-4}"
SCRIPT_DIR="$(dirname "$0")"

# Include useful functions.
. "$SCRIPT_DIR/includes.sh"

status_message "Stopping $WORKERS parallel E2E environments..."

for i in $(seq 0 $((WORKERS - 1))); do
	(
		export COMPOSE_PROJECT_NAME="googlesitekit-e2e-w${i}"
		export WP_HOST_PORT=$((9002 + i))
		export MYSQL_HOST_PORT=$((9306 + i))
		export WP_DB_NAME="wordpress_test_w${i}"

		status_message "Worker $i: Stopping containers..."
		dc down --volumes --remove-orphans >/dev/null 2>&1
	) &
done

wait

status_message "All parallel E2E environments stopped."
