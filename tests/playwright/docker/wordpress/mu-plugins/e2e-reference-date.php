<?php
/**
 * Plugin Name: E2E Reference Date
 * Description: Provides reference date for E2E tests, overridable by a cookie set by the Playwright fixture.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'googlesitekit_reference_date',
	function () {
		if (
			! empty( $_COOKIE['_wp_test_reference_date'] ) &&
			preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_COOKIE['_wp_test_reference_date'] )
		) {
			return $_COOKIE['_wp_test_reference_date'];
		}

		return '2026-01-01';
	}
);
