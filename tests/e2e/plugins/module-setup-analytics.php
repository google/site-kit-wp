<?php
/**
 * Plugin Name: E2E Tests Module Setup Analytics API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking Analytics Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\Analytics;

use Google\Site_Kit\Core\REST_API\REST_Routes;

const ACCOUNT_ID_A = '100';
const ACCOUNT_ID_B = '101';

const PROPERTY_ID_X = 'UA-00000001-1';
const PROPERTY_ID_Y = 'UA-00000002-1';
const PROPERTY_ID_Z = 'UA-00000003-1';

const INTERNAL_PROPERTY_ID_X = '200';
const INTERNAL_PROPERTY_ID_Y = '201';
const INTERNAL_PROPERTY_ID_Z = '202';

const PROFILE_ID_X = '300';
const PROFILE_ID_Y = '301';
const PROFILE_ID_Z = '302';

register_activation_hook( __FUNCTION__, function () {
	delete_option( 'googlesitekit_e2e_reference_url' );
} );

register_deactivation_hook( __FUNCTION__, function () {
	delete_option( 'googlesitekit_e2e_reference_url' );
} );

function get_reference_url() {
	return get_option( 'googlesitekit_e2e_reference_url' ) ?: home_url();
}

function get_internal_id_by_property( $property_id ) {
	$map = array(
		PROPERTY_ID_X => INTERNAL_PROPERTY_ID_X,
		PROPERTY_ID_Y => INTERNAL_PROPERTY_ID_Y,
		PROPERTY_ID_Z => INTERNAL_PROPERTY_ID_Z,
	);

	return isset( $map[ $property_id ] ) ? $map[ $property_id ] : null;
}

function filter_by_account_id( $items, $account_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $account_id ) {
				return $item['accountId'] === $account_id;
			}
		)
	);
}

function filter_by_property_id( $items, $property_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $property_id ) {
				return $item['internalWebPropertyId'] === get_internal_id_by_property( $property_id );
			}
		)
	);
}

add_action( 'rest_api_init', function () {
	$accounts   = array(
		array(
			'id'          => ACCOUNT_ID_A,
			'kind'        => 'analytics#account',
			'name'        => 'Test Account A',
			'permissions' => array(
				'effective' => array( 'COLLABORATE', 'EDIT', 'MANAGE_USERS', 'READ_AND_ANALYZE' )
			),
		),
		array(
			'id'          => ACCOUNT_ID_B,
			'kind'        => 'analytics#account',
			'name'        => 'Test Account B',
			'permissions' => array(
				'effective' => array( 'COLLABORATE', 'EDIT', 'MANAGE_USERS', 'READ_AND_ANALYZE' )
			),
		),
	);
	$properties = array(
		array(
			'accountId'             => ACCOUNT_ID_A,
			'id'                    => PROPERTY_ID_X,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_X,
			'kind'                  => 'analytics#webproperty',
			'level'                 => 'STANDARD',
			'name'                  => 'Test Property X',
			'websiteUrl'            => get_reference_url(),
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
		array(
			'accountId'             => ACCOUNT_ID_B,
			'id'                    => PROPERTY_ID_Y,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_Y,
			'kind'                  => 'analytics#webproperty',
			'level'                 => 'STANDARD',
			'name'                  => 'Test Property Y',
			'websiteUrl'            => 'https://y.example.com',
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
		array(
			'accountId'             => ACCOUNT_ID_B,
			'id'                    => PROPERTY_ID_Z,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_Z,
			'kind'                  => 'analytics#webproperty',
			'level'                 => 'STANDARD',
			'name'                  => 'Test Property Z',
			'websiteUrl'            => 'https://z.example.com',
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
	);
	$profiles   = array(
		array(
			'accountId'             => ACCOUNT_ID_A,
			'id'                    => PROFILE_ID_X,
			'kind'                  => 'analytics#profile',
			'name'                  => 'Test Profile X',
			'type'                  => 'WEB',
			'webPropertyId'         => PROPERTY_ID_X,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_X,
			'websiteUrl'            => get_reference_url(),
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
		array(
			'accountId'             => ACCOUNT_ID_B,
			'id'                    => PROFILE_ID_Y,
			'kind'                  => 'analytics#profile',
			'name'                  => 'Test Profile Y',
			'type'                  => 'WEB',
			'webPropertyId'         => PROPERTY_ID_Y,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_Y,
			'websiteUrl'            => 'https://example.com',
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
		array(
			'accountId'             => ACCOUNT_ID_B,
			'id'                    => PROFILE_ID_Z,
			'kind'                  => 'analytics#profile',
			'name'                  => 'Test Profile Z',
			'type'                  => 'WEB',
			'webPropertyId'         => PROPERTY_ID_Z,
			'internalWebPropertyId' => INTERNAL_PROPERTY_ID_Z,
			'websiteUrl'            => 'https://z.example.com',
			'permissions'           => array(
				'effective' => array( 'READ_AND_ANALYZE' ),
			),
		),
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/analytics/data/accounts-properties-profiles',
		array(
			'callback' => function () use ( $accounts, $properties, $profiles ) {
				$response = compact( 'accounts', 'properties', 'profiles' );

				$matched_property = array_filter(
					$properties,
					function ( $property ) {
						return $property['websiteUrl'] === home_url();
					}
				);

				if ( $matched_property ) {
					$response['matchedProperty'] = array_shift( $matched_property );
				}

				return $response;
			}
		),
		true
	);

	// Called when switching accounts
	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/analytics/data/properties-profiles',
		array(
			'callback' => function ( \WP_REST_Request $request ) use ( $properties, $profiles ) {
				return array(
					'properties' => filter_by_account_id( $properties, $request->get_param( 'accountId' ) ),
					'profiles'   => filter_by_account_id( $profiles, $request->get_param( 'accountId' ) ),
				);
			}
		),
		true
	);

	// Called when switching properties
	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/analytics/data/get-profiles',
		array(
			'callback' => function ( \WP_REST_Request $request ) use ( $profiles ) {
				$profiles = filter_by_account_id( $profiles, $request->get_param( 'accountId' ) );
				$profiles = filter_by_property_id( $profiles, $request->get_param( 'propertyId' ) );

				return $profiles;
			}
		),
		true
	);

	// Called when creating a new property
	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/analytics/data/save',
		array(
			'methods' => 'POST',
			'callback' => function ( \WP_REST_Request $request ) use ( $profiles ) {
				$option = array(
					'accountId'             => $request['accountId'],
					'propertyId'            => $request['propertyId'] ?: time(), // fake a new property ID if empty
					'internalWebPropertyId' => $request['internalWebPropertyId'],
					'profileId'             => $request['profileId'] ?: time(),  // fake a new profile ID if empty
					'useSnippet'            => ! empty( $request['useSnippet'] ),
					'ampClientIdOptIn'      => ! empty( $request['ampClientIdOptIn'] ),
				);
				update_option( 'googlesitekit_analytics_settings', $option );

				return $option;
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/reference-url',
		array(
			'methods'  => 'POST',
			'callback' => function ( \WP_REST_Request $request ) {
				$url = $request->get_param( 'url' );
				update_option( 'googlesitekit_e2e_reference_url', $url );

				return array( 'success' => true, 'url' => $url );
			}
		)
	);
}, 0 );

