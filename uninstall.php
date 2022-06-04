<?php
/**
 * Uninstallation script for the plugin.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

global $wpdb;

// Prevent execution from directly accessing the file.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Load plugin main file to bootstrap infrastructure and add hooks.
require_once dirname( __FILE__ ) . '/google-site-kit.php';

// Fire action to trigger uninstallation logic.
do_action( 'googlesitekit_uninstallation' );

// Remove options introduced by the plugin.
delete_option( 'googlesitekit_analytics_settings' );
delete_option( 'googlesitekit_analytics-4_settings' );
delete_option( 'googlesitekit_owner_id' );
delete_option( 'googlesitekit_search-console_settings' );
delete_option( 'googlesitekit_connected_proxy_url' );
delete_option( 'googlesitekitpersistent_remote_features' );
delete_option( 'googlesitekit_credentials' );
delete_option( 'googlesitekit_active_modules' );
delete_option( 'googlesitekit_has_connected_admins' );
delete_option( 'googlesitekit_db_version' );

// Remove any transients which the plugin may have left behind.
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE `option_name` LIKE '_transient_%googlesitekit%'" );
