<?php
/**
 * Plugin Name: E2E Tests Site Verification API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for handling site verification for Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Plugin;

register_activation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_site_verified' );
} );
register_deactivation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_site_verified' );
} );

add_action( 'rest_api_init', function () {

	$get_site_url = function ($data) {
		if ( (bool) get_transient( 'gsk_e2e_site_verified' ) ) {
			return Plugin::instance()->context()->get_reference_site_url();
		}

		return isset( $data['siteURL'] ) ? $data['siteURL'] : '';
	};

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/is-site-exist',
		array(
			'callback' => function ( WP_REST_Request $request ) use ( $get_site_url ) {
				$data = $request->get_param( 'data' );

				return array(
					'siteURL'  => $get_site_url( $data ),
					'verified' => (bool) get_transient( 'gsk_e2e_site_verified' ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/siteverification-list',
		array(
			'callback' => function ( WP_REST_Request $request ) use ( $get_site_url ) {
				$data = $request->get_param( 'data' );

				return array(
					'type'       => 'SITE',
					'identifier' => $get_site_url( $data ),
					'verified'   => (bool) get_transient( 'gsk_e2e_site_verified' ),
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
		'modules/search-console/data/siteverification',
		array(
			'methods'  => 'POST',
			'callback' => function ( WP_REST_Request $request ) {
				$data = $request->get_param( 'data' );

				update_user_option(
					get_current_user_id(),
					'googlesitekit_site_verified_meta',
					'verified'
				);

				return array(
					'updated'    => true,
					'sites'      => array( $data['siteURL'] ),
					'identifier' => $data['siteURL'],
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/search-console/data/matched-sites',
		array(
			'callback' => function ( WP_REST_Request $request ) {
				$data = $request->get_param( 'data' );
				update_user_option(
					get_current_user_id(),
					'googlesitekit_search_console_property',
					'verified'
				);
				return array(
					'exact_match' => site_url( '/' ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/verify-site',
		array(
			'methods'  => 'POST',
			'callback' => function () {
				set_transient( 'gsk_e2e_site_verified', true );

				return array( 'success' => true );
			}
		)
	);

}, 0 );
