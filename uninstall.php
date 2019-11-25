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
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) && empty( $googlesitekit_reset ) ) {
	return;
}

// Include Context class.
require_once plugin_dir_path( __FILE__ ) . 'includes/Context.php';

global $wpdb;

$context = new Context( __FILE__ );
$prefix = 'googlesitekit%';
$user_prefix = $context->is_network_mode() ? $prefix : $wpdb->get_blog_prefix() . $prefix;

// Delete options and transients.
$wpdb->query(
	$wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s", $prefix, '_transient_' . $prefix, '_transient_timeout_' . $prefix )
);

// Delete user meta.
$wpdb->query(
	$wpdb->prepare( "DELETE FROM $wpdb->usermeta WHERE meta_key LIKE %s", $user_prefix )
);
