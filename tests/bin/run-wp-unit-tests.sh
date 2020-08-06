#!/usr/bin/env bash


# Set up environment variables
WP_VERSION=${WP_VERSION-latest}

# Install wordpress-tests
bash tests/bin/install.sh wordpress_test root root localhost $WP_VERSION

echo Running with the following versions:
php -v
vendor/bin/phpunit --version

# Run PHPUnit tests
vendor/bin/phpunit || exit 1
#WP_MULTISITE=1 phpunit || exit 1