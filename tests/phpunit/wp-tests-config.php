<?php
/**
 * WordPress configuration file for PHPUnit tests using `wp-phpunit` library.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Test with WordPress debug mode (default).
define( 'WP_DEBUG', true );

// Set path to WordPress installation.
define( 'ABSPATH', dirname( dirname( __DIR__ ) ) . '/vendor/roots/wordpress/' );

/*
 * This configuration file will be used by the copy of WordPress being tested.
 * wordpress/wp-config.php will be ignored.
 *
 * WARNING WARNING WARNING!
 * These tests will DROP ALL TABLES in the database with the prefix named below.
 * DO NOT use a production database or one that is shared with something else.
 */

/**
 * Returns an environment variable value if it exists, otherwise the default value.
 *
 * @since 1.47.0
 *
 * @param string $name Environment variable name.
 * @param mixed $default_value A default value to use if the env variable is not set.
 * @return mixed The environment variable value if it exists, otherwise the default value.
 */
$get_env = function ( $name, $default_value ) {
	$value = getenv( $name );
	if ( false === $value ) {
		$value = $default_value;
	}

	return $value;
};

/*
 * These database credentials refer to the `mysql` service in the Site Kit local
 * environment docker configuration. Run `npm run env:start` before running the
 * PHPUnit tests using this file.
 */
define( 'DB_NAME', 'wordpress_test' );
define( 'DB_USER', $get_env( 'WORDPRESS_DB_USER', 'root' ) );
define( 'DB_PASSWORD', $get_env( 'WORDPRESS_DB_PASSWORD', 'example' ) );
define( 'DB_HOST', $get_env( 'WORDPRESS_DB_HOST', '127.0.0.1:9306' ) );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY', 'put your unique phrase here' );
define( 'SECURE_AUTH_KEY', 'put your unique phrase here' );
define( 'LOGGED_IN_KEY', 'put your unique phrase here' );
define( 'NONCE_KEY', 'put your unique phrase here' );
define( 'AUTH_SALT', 'put your unique phrase here' );
define( 'SECURE_AUTH_SALT', 'put your unique phrase here' );
define( 'LOGGED_IN_SALT', 'put your unique phrase here' );
define( 'NONCE_SALT', 'put your unique phrase here' );

define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Test Blog' );

define( 'WP_PHP_BINARY', 'php' );
