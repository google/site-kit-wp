<?php
/**
 * Plugin reset and uninstall cleanup.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

// Bail if not uninstalling or reseting the plugin.
if ( ! defined( WP_UNINSTALL_PLUGIN ) && empty( $googlesitekit_reset ) ) {
	return;
}

global $wpdb;

$key = '%googlesitekit%';

// Delete options and transients.
$wpdb->query(
	$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s OR meta_key LIKE %s", $key, 'sitekit_authentication' )
);

// Delete user meta.
$wpdb->query(
	$wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s", $key )
);
