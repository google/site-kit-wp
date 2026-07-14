<?php
/**
 * Plugin Name: E2E Tests Enhanced Conversions Plugin
 * Description: Test utilities for Enhanced Conversions E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'googlesitekit_setup_gtag',
	function ( $gtag ) {
		$gtag->add_tag( 'G-TEST1234' );
	},
	1
);
