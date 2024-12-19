<?php
/**
 * Plugin Name: E2E Tests FPM Server Requirement Status Plugin
 * Description: Setup for FPM server requirement status E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'rest_api_init',
	function () {
		add_filter(
			'plugins_url',
			function ( $url ) {
				return str_replace( ':9002', ':80', $url );
			},
			10,
			1
		);
	},
	0
);
