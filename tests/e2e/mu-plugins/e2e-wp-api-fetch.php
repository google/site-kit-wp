<?php
/**
 * Plugin Name: E2E WP API Fetch
 * Description: Enqueues the 'wp-api-fetch' script across the entire admin.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'admin_enqueue_scripts',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		wp_enqueue_script( 'wp-api-fetch' );
	},
	11 
); // Needs to be after registration in Site Kit's Assets class.
