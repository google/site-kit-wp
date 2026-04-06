#!/bin/bash

# Site Kit by Google, Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
ROOT_DIR="$SCRIPT_DIR/../../"
DIST_DIR="$ROOT_DIR/dist"
PORT=9001

# Install the appropriate Playwright browser.
if [ -n "$CI" ]; then
	npx playwright install --with-deps chromium-headless-shell
else
	npx playwright install chromium
fi

# Build Storybook if the dist directory doesn't exist.
if [ ! -f "$DIST_DIR/index.html" ]; then
	echo "Storybook build not found. Building..."
	npm run -w storybook build
fi

# Start an HTTP server in the background.
echo "Starting HTTP server for Storybook on port $PORT..."
npx http-server "$DIST_DIR" -p "$PORT" -s &
SERVER_PID=$!

# Stop the server on exit.
cleanup() {
	kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for the server to be ready.
attempt=0
max_attempts=30
while [ "$attempt" -lt "$max_attempts" ]; do
	attempt=$((attempt + 1))
	curl -fsS "http://localhost:$PORT/index.html" > /dev/null 2>&1 && break
	sleep 1
done

if [ "$attempt" -eq "$max_attempts" ]; then
	echo "Storybook server did not start within $max_attempts seconds."
	exit 1
fi

echo "Storybook server is ready."

# Run the test-runner.
npx test-storybook --config-dir "$SCRIPT_DIR/.." --url "http://localhost:$PORT" "$@"
