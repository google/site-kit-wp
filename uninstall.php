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

// Bail if not uninstalling or resetting the plugin.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) && empty( $googlesitekit_reset_context ) ) {
	return;
}

global $wpdb;

$prefix = 'googlesitekit\_%';

// Delete options and transients.
$wpdb->query( // phpcs:ignore WordPress.VIP.DirectDatabaseQuery
	$wpdb->prepare(
		"DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s OR option_name = %s",
		$prefix,
		'_transient_' . $prefix,
		'_transient_timeout_' . $prefix,
		'googlesitekit-active-modules'
	)
);

// Delete user meta.
$wpdb->query( // phpcs:ignore WordPress.VIP.DirectDatabaseQuery
	$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $wpdb->get_blog_prefix() . $prefix )
);

// Clear network data if multisite and uninstalling or resetting network-wide.
$conditions = (
	is_multisite()
	&&
	(
		defined( 'WP_UNINSTALL_PLUGIN' )
		||
		( ! empty( $googlesitekit_reset_context ) && $googlesitekit_reset_context->is_network_mode() )
	)
);

if ( $conditions ) {
	$wpdb->query( // phpcs:ignore WordPress.VIP.DirectDatabaseQuery
		$wpdb->prepare(
			"DELETE FROM $wpdb->sitemeta WHERE meta_key LIKE %s OR meta_key LIKE %s OR meta_key LIKE %s OR meta_key = %s",
			$prefix,
			'_site_transient_' . $prefix,
			'_site_transient_timeout_' . $prefix,
			'googlesitekit-active-modules'
		)
	);

	// Delete user meta.
	$wpdb->query( // phpcs:ignore WordPress.VIP.DirectDatabaseQuery
		$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $prefix )
	);
}

// Clear options cache.
wp_cache_flush();
