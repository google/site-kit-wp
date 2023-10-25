<?php
/**
 * Tests bootstrap.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

define( 'TESTS_PLUGIN_DIR', dirname( dirname( __DIR__ ) ) );

if ( false !== getenv( 'WP_PLUGIN_DIR' ) ) {
	define( 'WP_PLUGIN_DIR', getenv( 'WP_PLUGIN_DIR' ) );
} else {
	define( 'WP_PLUGIN_DIR', dirname( TESTS_PLUGIN_DIR ) );
}

// Detect where to load the WordPress tests environment from.
if ( false !== getenv( 'WP_TESTS_DIR' ) ) {
	$_test_root = getenv( 'WP_TESTS_DIR' );
} elseif ( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	$_test_root = getenv( 'WP_DEVELOP_DIR' ) . '/tests/phpunit';
} elseif ( file_exists( '/tmp/wordpress-tests-lib/includes/bootstrap.php' ) ) {
	$_test_root = '/tmp/wordpress-tests-lib';
} else {
	if ( ! getenv( 'WP_PHPUNIT__DIR' ) ) {
		printf( '%s is not defined. Run `composer install` to install the WordPress tests library.' . "\n", 'WP_PHPUNIT__DIR' );
		exit;
	}

	$_test_root = getenv( 'WP_PHPUNIT__DIR' );

	// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv
	putenv( sprintf( 'WP_PHPUNIT__TESTS_CONFIG=%s', __DIR__ . '/wp-tests-config.php' ) );
}

$GLOBALS['wp_tests_options'] = array(
	'active_plugins' => array( basename( TESTS_PLUGIN_DIR ) . '/google-site-kit.php' ),
);

// Give access to tests_add_filter() function.
require $_test_root . '/includes/functions.php';

// Ensure all features are disabled when bootstrapping the plugin.
tests_add_filter( 'googlesitekit_is_feature_enabled', '__return_false', 0 );

// Include the time mock functions.
require_once TESTS_PLUGIN_DIR . '/tests/phpunit/includes/global-time-override.php';

// Start up the WP testing environment.
require $_test_root . '/includes/bootstrap.php';
