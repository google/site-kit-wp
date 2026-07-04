<?php
/**
 * Plugin Name: E2E Access Token Endpoint
 * Description: REST Endpoint for setting the access token for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
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
			'e2e/analytics/existing-property-id',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					if ( $request['id'] ) {
						update_option( 'googlesitekit_e2e_analytics_existing_property_id', $request['id'] );
					} else {
						delete_option( 'googlesitekit_e2e_analytics_existing_property_id' );
					}

					return array(
						'success' => true,
						'id'      => $request['id'],
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
