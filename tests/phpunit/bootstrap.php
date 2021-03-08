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
	$_test_root = dirname( dirname( dirname( dirname( TESTS_PLUGIN_DIR ) ) ) ) . '/tests/phpunit';
}

$GLOBALS['wp_tests_options'] = array(
	'active_plugins' => array( basename( TESTS_PLUGIN_DIR ) . '/google-site-kit.php' ),
);

/**
 * PHP 8 Compatibility with PHPUnit 7.
 *
 * WordPress core loads these via the main autoloader but these files
 * aren't installed via Composer (yet) so we need to require them manually
 * before PHPUnit's bundled versions are autoloaded to use the compatible versions.
 *
 * @see https://core.trac.wordpress.org/ticket/50902
 * @see https://core.trac.wordpress.org/ticket/50913
 */
if ( version_compare( '8.0', phpversion(), '<=' ) ) {
	require_once $_test_root . '/includes/phpunit7/MockObject/Builder/NamespaceMatch.php';
	require_once $_test_root . '/includes/phpunit7/MockObject/Builder/ParametersMatch.php';
	require_once $_test_root . '/includes/phpunit7/MockObject/InvocationMocker.php';
	require_once $_test_root . '/includes/phpunit7/MockObject/MockMethod.php';
}

// Give access to tests_add_filter() function.
require $_test_root . '/includes/functions.php';

// Ensure all features are disabled when bootstrapping the plugin.
tests_add_filter( 'googlesitekit_is_feature_enabled', '__return_false', 0 );

// Start up the WP testing environment.
require $_test_root . '/includes/bootstrap.php';
