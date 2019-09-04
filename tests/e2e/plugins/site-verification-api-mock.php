<?php
/**
 * Plugin Name: E2E Tests Site Verification API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for handling site verification for Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

register_activation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_site_verified' );
	delete_transient( 'gsk_e2e_sc_site_exists' );
} );
register_deactivation_hook( __FILE__, function () {
	delete_transient( 'gsk_e2e_site_verified' );
	delete_transient( 'gsk_e2e_sc_site_exists' );
} );

add_action( 'rest_api_init', function () {

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/site-verification/data/verification',
		array(
			'callback' => function () {
				return array(
					'type'       => 'SITE',
					'identifier' => home_url( '/' ),
					'verified'   => (bool) get_transient( 'gsk_e2e_site_verified' ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/site-verification/data/siteverification',
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
					'sites'      => array(),
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
			'callback' => function () {
				return array(
					'exact_match' => home_url( '/' ),
				);
			}
		),
		true
	);

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
		'e2e/verify-site',
		array(
			'methods'  => 'POST',
			'callback' => function () {
				set_transient( 'gsk_e2e_site_verified', true );

				return array( 'success' => true );
			}
		)
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

}, 0 );
