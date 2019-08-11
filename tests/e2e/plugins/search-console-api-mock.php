<?php
/**
 * Plugin Name: E2E Tests Search Console API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for handling search console for Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

register_activation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_sc_site_exists' );
} );
register_deactivation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_sc_site_exists' );
} );

add_action( 'rest_api_init', function () {

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/is-site-exist',
		array(
			'callback' => function ( WP_REST_Request $request ) {
				$data = $request->get_param( 'data' );

				return array(
					'siteURL'  => 'https://example.org/',
					'verified' => (bool) get_transient( 'gsk_e2e_sc_site_exists' ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/insert',
		array(
			'methods'  => 'POST',
			'callback' => function ( WP_REST_Request $request ) {
				$data = $request->get_param( 'data' );

				update_option( 'googlesitekit_search_console_property', $data['siteURL'] );

				return array(
					'sites' => array( $data['siteURL'] ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/save-property',
		array(
			'methods'  => 'POST',
			'callback' => function ( WP_REST_Request $request ) {
				$data = $request->get_param( 'data' );

				$response = update_option( 'googlesitekit_search_console_property', $data['siteURL'] );
				return array(
					'updated' => $response,
					'status'  => true,
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/sc-site-exists',
		array(
			'methods'  => 'POST',
			'callback' => function () {
				set_transient( 'gsk_e2e_sc_site_exists', true );

				return array( 'success' => true );
			}
		)
	);
} );