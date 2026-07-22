#!/bin/bash
# Generates the backup.sql file used to seed the Playwright test database.
#
# Usage:
#   npm run playwright:generate-backup
#
# This script:
# 1. Starts Docker services with WP 5.2.21 (oldest supported version)
# 2. Installs WordPress and configures it via WP-CLI
# 3. Seeds WPForms forms and their frontend pages
# 4. Exports the database to backup.sql
# 5. Tears down the containers

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
docker compose --profile test down -v

# Remove the existing backup.sql so MariaDB starts with an empty database.
# The MYSQL_DATABASE env var will create the empty 'wordpress' database automatically.
mkdir -p "$BACKUP_DIR"
rm -f "$BACKUP_FILE"

echo "Starting Docker services with WP_VERSION=$WP_VERSION..."
WP_DEBUG=0 docker compose --profile generate up -d

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

echo "Activating theme and plugins..."
wp theme activate twentynineteen --quiet
wp plugin activate google-site-kit --quiet
wp plugin activate wpforms-lite --quiet
wp plugin activate google-site-kit-test-plugins/enhanced-conversions.php --quiet

echo "Setting permalink structure..."
wp rewrite structure '%postname%' --hard --quiet

echo "Creating WPForms forms and pages..."
wp site-kit-e2e create-wpforms-fixtures --user=admin

wp plugin deactivate wpforms-lite --quiet
wp plugin deactivate google-site-kit-test-plugins/enhanced-conversions.php --quiet

# Normalize the database so the dump is deterministic across runs.
echo "Normalizing database for deterministic output..."

FIXED_DATE="2025-01-01 00:00:00"
FIXED_TIMESTAMP="1735689600"

# Fix password hashes to a pre-computed phpass hash of "password".
FIXED_PASS_HASH='\$P\$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720'
wp db query "UPDATE wp_users SET user_pass = '$FIXED_PASS_HASH', user_registered = '$FIXED_DATE'"

# Fix post dates.
wp db query "UPDATE wp_posts SET post_date = '$FIXED_DATE', post_date_gmt = '$FIXED_DATE', post_modified = '$FIXED_DATE', post_modified_gmt = '$FIXED_DATE'"

# Fix comment dates.
wp db query "UPDATE wp_comments SET comment_date = '$FIXED_DATE', comment_date_gmt = '$FIXED_DATE'"

# Clear session_tokens so they don't vary between runs.
wp db query "DELETE FROM wp_usermeta WHERE meta_key = 'session_tokens'"

# Remove transient activation data and normalize WPForms timestamps.
wp db query "DELETE FROM wp_options WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%' OR option_name = 'recently_activated'"
wp db query "UPDATE wp_options SET option_value = '6.0.$FIXED_TIMESTAMP' WHERE option_name = 'schema-ActionScheduler_StoreSchema'"
wp db query "UPDATE wp_options SET option_value = '3.0.$FIXED_TIMESTAMP' WHERE option_name = 'schema-ActionScheduler_LoggerSchema'"
wp db query "UPDATE wp_options SET option_value = 'a:1:{s:4:\"lite\";i:$FIXED_TIMESTAMP;}' WHERE option_name = 'wpforms_activated'"
wp db query "UPDATE wp_options SET option_value = '$FIXED_TIMESTAMP' WHERE option_name = 'wpforms_forms_first_created'"

# Remove scheduled activation work that is irrelevant to the form tests.
wp db query "TRUNCATE TABLE wp_actionscheduler_logs"
wp db query "TRUNCATE TABLE wp_actionscheduler_actions"
wp db query "TRUNCATE TABLE wp_actionscheduler_claims"
wp db query "TRUNCATE TABLE wp_actionscheduler_groups"

# Replace the cron option last so no subsequent WordPress bootstrap can add
# environment-dependent timestamps back to it before the export.
wp db query "UPDATE wp_options SET option_value = 'a:1:{s:7:\"version\";i:2;}' WHERE option_name = 'cron'"

echo "Exporting database to backup.sql..."
docker compose exec -T mysql mysqldump -u root -pexample wordpress > "$BACKUP_FILE"

# Normalize the platform header and strip the mysqldump timestamp comment so
# the generated fixture is identical on macOS and Linux hosts.
sed -i.bak -e '1s/ ([^()]*)$//' -e '/^-- Dump completed on /d' "$BACKUP_FILE"
rm -f "$BACKUP_FILE.bak"

echo "Tearing down containers..."
docker compose --profile generate down -v

echo "Done! backup.sql has been generated at:"
echo "  $BACKUP_FILE"
