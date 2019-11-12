<?php
/**
 * Plugin Name: E2E Access Token Endpoint
 * Description: REST Endpoint for setting the access token for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action( 'rest_api_init', function () {
	if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
		return;
	}

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/auth/access-token',
		array(
			'methods'  => WP_REST_Server::EDITABLE,
			'callback' => function ( WP_REST_Request $request ) {
				( new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )
					->set_access_token( $request['token'], HOUR_IN_SECONDS );

				return array( 'success' => true, 'token' => $request['token'] );
			}
		)
	);
}, 0 );
