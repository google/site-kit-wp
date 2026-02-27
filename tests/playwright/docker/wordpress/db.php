<?php
/**
 * WordPress DB Drop-in: E2E Test Database Router
 *
 * Routes WordPress database connections to test-specific databases based on a
 * cookie set by Playwright fixtures. This drop-in is loaded at the very
 * beginning of WordPress initialisation — before mu-plugins, before options are
 * read, and before any hooks fire — guaranteeing that the correct database is
 * used for every operation in the request.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

$_e2e_db_name = isset( $_COOKIE['_wp_test_db'] )
	? preg_replace( '/[^a-zA-Z0-9_]/', '_', $_COOKIE['_wp_test_db'] )
	: DB_NAME;

$wpdb = new wpdb( DB_USER, DB_PASSWORD, $_e2e_db_name, DB_HOST );

unset( $_e2e_db_name );

// Skip DB upgrade on every request.
add_filter(
	'pre_option_db_version',
	function () {
		global $wp_db_version;
		return $wp_db_version;
	}
);
