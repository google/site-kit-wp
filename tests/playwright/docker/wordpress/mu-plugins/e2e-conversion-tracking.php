<?php
/**
 * Plugin Name: E2E Conversion Tracking
 * Description: Enables Conversion Tracking during E2E tests based on a cookie set by the Playwright fixture.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

if ( ! empty( $_COOKIE['_wp_test_conversion_tracking'] ) ) {
	add_filter(
		'pre_option_googlesitekit_conversion_tracking',
		function () {
			return array( 'enabled' => true );
		}
	);
}
