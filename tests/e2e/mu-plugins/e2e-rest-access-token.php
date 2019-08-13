<?php
/**
 * Plugin Name: E2E Access Token Endpoint
 * Description: REST Endpoint for setting the access token for Site Kit during E2E tests.
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Data_Encryption;

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
				update_user_option(
					get_current_user_id(),
					'googlesitekit_access_token',
					( new Data_Encryption() )->encrypt(
						serialize( array( 'access_token' => $request['token'] ) )
					)
				);

				return array( 'success' => true, 'token' => $request['token'] );
			}
		)
	);
}, 0 );
