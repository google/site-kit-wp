<?php
/**
 * Plugin Name: E2E Time Endpoint
 * Description: REST Endpoint for supporting E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/util/data/time', // Required for use with SK API.
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => function () {
					return array(
						'time'      => time(),
						'microtime' => microtime( true ),
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	}
);
