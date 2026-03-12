#!/bin/bash
# Generates the backup.sql file used to seed the Playwright test database.
#
# Usage:
#   npm run playwright:generate-backup
#
# This script:
# 1. Starts Docker services with WP 5.2.21 (oldest supported version)
# 2. Installs WordPress and configures it via WP-CLI
# 3. Exports the database to backup.sql
# 4. Tears down the containers

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Use the oldest supported WordPress version for maximum forward-compatibility.
export WP_VERSION=5.2.21

BACKUP_DIR="$PROJECT_DIR/docker/mariadb"
BACKUP_FILE="$BACKUP_DIR/backup.sql"

# Tear down any running containers and volumes to start fresh.
echo "Stopping any existing containers..."
docker compose down -v

# Remove the existing backup.sql so MariaDB starts with an empty database.
# The MYSQL_DATABASE env var will create the empty 'wordpress' database automatically.
mkdir -p "$BACKUP_DIR"
rm -f "$BACKUP_FILE"

echo "Starting Docker services with WP_VERSION=$WP_VERSION..."
WP_DEBUG=0 docker compose up -d

echo "Waiting for WordPress container to be healthy..."
attempt=0
until docker compose exec -T wp curl -f -s -o /dev/null http://localhost; do
    attempt=$((attempt + 1))
    if [[ $attempt -gt 60 ]]; then
        echo "ERROR: WordPress container failed to become healthy." >&2
        docker compose logs wp
        docker compose down -v
        exit 1
    fi
    sleep 2
done
echo "WordPress container is healthy."

# Helper to run WP-CLI commands inside the container as www-data.
wp() {
    docker compose exec -T -u www-data wp wp "$@"
}

echo "Installing WordPress..."
# Suppress warnings from WP bootstrap trying to query tables before they exist.
wp core install \
    --url=http://localhost:9002 \
    --title="Google Site Kit Dev" \
    --admin_user=admin \
    --admin_password=password \
    --admin_email=test@test.com \
    --skip-email \
    --quiet 2>/dev/null

echo "Creating additional users..."
wp user create admin-2 admin-2@example.com --role=administrator --user_pass=password --quiet
wp user create editor editor@example.com --role=editor --user_pass=password --quiet
wp user create author author@example.com --role=author --user_pass=password --quiet
wp user create contributor contributor@example.com --role=contributor --user_pass=password --quiet

echo "Creating sample posts..."
wp post create --post_status=publish --post_title="Hello Solar System!" --quiet
wp post create --post_status=publish --post_title="Hello Milky Way!" --quiet
wp post create --post_status=publish --post_title="Hello Universe!" --quiet
wp post create --post_status=publish --post_title="Hello Spéçïåł čhāràćtęrß!" --quiet

echo "Activating theme and plugin..."
wp theme activate twentynineteen --quiet
wp plugin activate google-site-kit --quiet

echo "Setting permalink structure..."
wp rewrite structure '%postname%' --hard --quiet

# Normalize the database so the dump is deterministic across runs.
echo "Normalizing database for deterministic output..."

FIXED_DATE="2025-01-01 00:00:00"

# Fix password hashes to a pre-computed phpass hash of "password".
FIXED_PASS_HASH='\$P\$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720'
wp db query "UPDATE wp_users SET user_pass = '$FIXED_PASS_HASH', user_registered = '$FIXED_DATE'"

# Fix post dates.
wp db query "UPDATE wp_posts SET post_date = '$FIXED_DATE', post_date_gmt = '$FIXED_DATE', post_modified = '$FIXED_DATE', post_modified_gmt = '$FIXED_DATE'"

# Fix comment dates.
wp db query "UPDATE wp_comments SET comment_date = '$FIXED_DATE', comment_date_gmt = '$FIXED_DATE'"

# Clear session_tokens so they don't vary between runs.
wp db query "DELETE FROM wp_usermeta WHERE meta_key = 'session_tokens'"

# Replace the cron option with a fixed empty cron array and remove transients.
wp option update cron --format=json '{"version":2}'
wp db query "DELETE FROM wp_options WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'"

echo "Exporting database to backup.sql..."
docker compose exec -T mysql mysqldump -u root -pexample wordpress > "$BACKUP_FILE"

# Strip the mysqldump timestamp comment from the last line so diffs are clean.
sed -i '/^-- Dump completed on /d' "$BACKUP_FILE"

echo "Tearing down containers..."
docker compose down -v

echo "Done! backup.sql has been generated at:"
echo "  $BACKUP_FILE"
