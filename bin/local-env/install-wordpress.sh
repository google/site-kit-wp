#!/bin/bash

# Exit if any command fails.
set -e

# Common variables.
WP_DEBUG=${WP_DEBUG-false}
SCRIPT_DEBUG=${SCRIPT_DEBUG-true}
WP_VERSION=${WP_VERSION-"latest"}

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Make sure Docker containers are running
dc up -d >/dev/null 2>&1

# Get the host port for the WordPress container.
HOST_PORT=$(dc port $CONTAINER 80 | awk -F : '{printf $2}')

# Wait until the Docker containers are running and the WordPress site is
# responding to requests.
status_message "Attempting to connect to WordPress..."
until $(curl -L http://localhost:$HOST_PORT -so - 2>&1 | grep -q "WordPress"); do
    echo -n '.'
    sleep 1
done
echo ''

# If this is the test site, we reset the database so no posts/comments/etc.
# dirty up the tests.
if [ "$1" == '--reset-site' ]; then
	status_message "Resetting test database..."
	wp db reset --yes --quiet
fi

if [[ ! -z "$WP_VERSION" ]]; then
	# Potentially downgrade WordPress
	status_message "Downloading WordPress version $WP_VERSION..."
	wp core download --version=${WP_VERSION} --force --quiet
fi

# Install WordPress.
status_message "Installing WordPress..."
wp core install --title="$SITE_TITLE" --admin_user=admin --admin_password=password --admin_email=test@test.com --skip-email --url=http://localhost:$HOST_PORT  --quiet

# Create additional Users.
status_message "Creating additional users..."
wp user create admin-2 admin-2@example.com --role=administrator --user_pass=password --quiet
status_message "Admin 2 created! Username: admin-2 Password: password"
wp user create editor editor@example.com --role=editor --user_pass=password --quiet
status_message "Editor created! Username: editor Password: password"
wp user create author author@example.com --role=author --user_pass=password --quiet
status_message "Author created! Username: author Password: password"
wp user create contributor contributor@example.com --role=contributor --user_pass=password --quiet
status_message "Contributor created! Username: contributor Password: password"

# Create a few posts
status_message "Creating a few posts..."
wp post create --post_status=publish --post_title="Hello Solar System!" --quiet
status_message 'Created post with title "Hello Solar System!"'
wp post create --post_status=publish --post_title="Hello Milky Way!" --quiet
status_message 'Created post with title "Hello Milky Way!"'
wp post create --post_status=publish --post_title="Hello Universe!" --quiet
status_message 'Created post with title "Hello Universe!"'
wp post create --post_status=publish --post_title="Hello Spéçïåł čhāràćtęrß!" --quiet
status_message 'Created post with title "Hello Spéçïåł čhāràćtęrß!"'

# Make sure the uploads and upgrade folders exist and we have permissions to add files.
status_message "Ensuring that files can be uploaded..."
container mkdir -p \
	/var/www/html/wp-content/uploads \
	/var/www/html/wp-content/upgrade
container chmod 767 \
	/var/www/html/wp-content \
	/var/www/html/wp-content/plugins \
	/var/www/html/wp-config.php \
	/var/www/html/wp-settings.php \
	/var/www/html/wp-content/uploads \
	/var/www/html/wp-content/upgrade

CURRENT_WP_VERSION=$(wp core version | tr -d '\r')
status_message "Current WordPress version: $CURRENT_WP_VERSION..."

if [ "$WP_VERSION" == "latest" ]; then
	# Check for WordPress updates, to make sure we're running the very latest version.
	status_message "Updating WordPress to the latest version..."
	wp core update --quiet
	status_message "Updating The WordPress Database..."
	wp core update-db --quiet
fi

# Switch to `twentytwenty` theme for consistent results (particularly for AMP compatibility).
# For older versions of WP, download and install it if it isn't present.
# If `twentytwenty` is already the active theme, the script will continue
# without attempting to install it as the activate command will exit with a `0` status code.
wp theme activate twentytwenty || wp theme install --activate twentytwenty

if [[ ! -z "$GUTENBERG_VERSION" ]]; then
	# Potentially install Gutenberg
	status_message "Installing Gutenberg version $GUTENBERG_VERSION..."
	wp plugin install gutenberg --version=${GUTENBERG_VERSION} --activate --force --quiet
fi

# If the 'wordpress' volume wasn't during the down/up earlier, but the post port has changed, we need to update it.
status_message "Checking the site's url..."
CURRENT_URL=$(wp option get siteurl | tr -d '\r')
if [ "$CURRENT_URL" != "http://localhost:$HOST_PORT" ]; then
	wp option update home "http://localhost:$HOST_PORT" --quiet
	wp option update siteurl "http://localhost:$HOST_PORT" --quiet
fi

# Install the AMP plugin
status_message "Installing the AMP plugin..."
if [[ ! -z "$AMP_VERSION" ]]; then
	wp plugin install amp --force --quiet --version="$AMP_VERSION"
else
	# Install latest 2.x by default, but not v3
	wp plugin install amp --force --quiet --version="2.0.0"
	wp plugin update amp --minor --quiet
fi

# Install a placeholder favicon to avoid 404 errors.
status_message "Installing a placeholder favicon..."
container touch /var/www/html/favicon.ico
container chmod 767 /var/www/html/favicon.ico

# Activate Google Site Kit plugin.
status_message "Activating Google Site Kit plugin..."
wp plugin activate google-site-kit --quiet
# Reset post-activate state.
wp google-site-kit reset

# Set pretty permalinks.
status_message "Setting permalink structure..."
wp rewrite structure '%postname%' --hard --quiet

# Configure site constants.
status_message "Configuring site constants..."
WP_DEBUG_CURRENT=$(wp config get --type=constant --format=json WP_DEBUG | tr -d '\r')

if [ "$WP_DEBUG" != $WP_DEBUG_CURRENT ]; then
	wp config set WP_DEBUG $WP_DEBUG --raw --type=constant --quiet
	WP_DEBUG_RESULT=$(wp config get --type=constant --format=json WP_DEBUG | tr -d '\r')
	status_message "WP_DEBUG: $WP_DEBUG_RESULT..."
fi

SCRIPT_DEBUG_CURRENT=$(wp config get --type=constant --format=json SCRIPT_DEBUG | tr -d '\r')
if [ "$SCRIPT_DEBUG" != $SCRIPT_DEBUG_CURRENT ]; then
	wp config set SCRIPT_DEBUG $SCRIPT_DEBUG --raw --type=constant --quiet
	SCRIPT_DEBUG_RESULT=$(wp config get --type=constant --format=json SCRIPT_DEBUG | tr -d '\r')
	status_message "SCRIPT_DEBUG: $SCRIPT_DEBUG_RESULT..."
fi
