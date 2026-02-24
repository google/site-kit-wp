<?php
/**
 * Plugin Name: E2E Test Database Router
 * Description: Routes WordPress database connections to test-specific databases based on a cookie set by Playwright fixtures.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( isset( $_COOKIE['_wp_test_db'] ) ) {
	global $wpdb;
	$db_name = preg_replace( '/[^a-zA-Z0-9_]/', '_', $_COOKIE['_wp_test_db'] );
	$wpdb->select( $db_name, $wpdb->dbh );
}
