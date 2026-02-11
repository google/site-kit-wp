#!/bin/bash

# Start N parallel Docker Compose stacks for E2E test parallelism.
# Each worker gets its own WordPress + MySQL instance on unique ports.

set -e

WORKERS="${E2E_PARALLEL_WORKERS:-4}"
SCRIPT_DIR="$(dirname "$0")"

# Include useful functions.
. "$SCRIPT_DIR/includes.sh"

# Check that Docker is installed.
if ! command_exists "docker"; then
	error_message "Docker doesn't seem to be installed. Please head on over to the Docker site to download it: $(action_format "https://www.docker.com/products/docker-desktop")"
	exit 1
fi

# Check that Docker is running.
if ! docker info >/dev/null 2>&1; then
	error_message "Docker isn't running. Please check that you've started your Docker app, and see it in your system tray."
	exit 1
fi

status_message "Starting $WORKERS parallel E2E environments..."

# Launch all containers in parallel.
for i in $(seq 0 $((WORKERS - 1))); do
	(
		export COMPOSE_PROJECT_NAME="googlesitekit-e2e-w${i}"
		export WP_HOST_PORT=$((9002 + i))
		export MYSQL_HOST_PORT=$((9306 + i))
		export WP_DB_NAME="wordpress_test_w${i}"

		status_message "Worker $i: Starting containers (WP port $WP_HOST_PORT, MySQL port $MYSQL_HOST_PORT)..."
		dc down --remove-orphans >/dev/null 2>&1 || true
		dc up -d
	) &
done

# Wait for all container launches to complete.
wait

status_message "All containers launched. Installing WordPress on each..."

# Install WordPress on each worker in parallel.
for i in $(seq 0 $((WORKERS - 1))); do
	(
		export COMPOSE_PROJECT_NAME="googlesitekit-e2e-w${i}"
		export WP_HOST_PORT=$((9002 + i))
		export MYSQL_HOST_PORT=$((9306 + i))
		export WP_DB_NAME="wordpress_test_w${i}"

		status_message "Worker $i: Installing WordPress..."
		. "$SCRIPT_DIR/install-wordpress.sh"
		status_message "Worker $i: WordPress installed successfully on port $WP_HOST_PORT."
	) &
done

# Wait for all installations to complete.
wait

status_message "All $WORKERS parallel E2E environments are ready."
