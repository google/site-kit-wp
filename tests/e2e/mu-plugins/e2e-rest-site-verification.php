<?php
/**
 * Plugin Name: E2E Site Verification Endpoint
 * Description: REST Endpoint for setting the site verification status of the current user during E2E tests.
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action( 'rest_api_init', function () {
	if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
		return;
	}

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/setup/site-verification',
		array(
			'methods'  => WP_REST_Server::EDITABLE,
			'callback' => function ( WP_REST_Request $request ) {
				if ( $request['verified'] ) {
					update_user_option(
						get_current_user_id(),
						'googlesitekit_site_verified_meta',
						'verified'
					);
				} else {
					delete_user_option( get_current_user_id(), 'googlesitekit_site_verified_meta' );
				}
			}
		)
	);
}, 0 );
