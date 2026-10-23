<?php
/**
 * Plugin Name: E2E Data Available
 * Description: Marks the modules and Analytics custom dimensions a test declares via the `withDataAvailable()` annotation as having data, so widgets request their reports instead of showing the gathering data state.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! empty( $_COOKIE['_wp_test_data_available'] ) ) {
	// Each entry is the part of a `googlesitekit_{entry}_data_available`
	// transient name, e.g. `analytics-4` or
	// `custom_dimension_googlesitekit_post_date`.
	$e2e_data_available = explode( ',', wp_unslash( $_COOKIE['_wp_test_data_available'] ) );

	foreach ( $e2e_data_available as $e2e_entry ) {
		add_filter(
			"pre_transient_googlesitekit_{$e2e_entry}_data_available",
			'__return_true'
		);
	}
}
