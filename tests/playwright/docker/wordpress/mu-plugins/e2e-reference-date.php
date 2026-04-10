<?php
/**
 * Plugin Name: E2E Reference Date
 * Description: Provides reference date for E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'googlesitekit_reference_date',
	function () {
		return '2026-01-01';
	}
);
