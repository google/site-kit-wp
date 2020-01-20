<?php
/**
 * Plugin Name: E2E Client Configuration Endpoint
 * Description: REST Endpoint for setting the client configuration for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Data_Encryption;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/auth/client-config',
			array(
				'methods'  => WP_REST_Server::EDITABLE,
				'callback' => function ( WP_REST_Request $request ) {
					$credentials = array(
						'oauth2_client_id'     => sanitize_text_field( $request['clientID'] ),
						'oauth2_client_secret' => sanitize_text_field( $request['clientSecret'] ),
					);

					update_option(
						'googlesitekit_credentials',
						( new Data_Encryption() )->encrypt( serialize( $credentials ) )
					);

					return array( 'success' => true );
				},
			)
		);
	},
	0 
);
