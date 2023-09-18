<?php
/**
 * Plugin Name: E2E Tests Module Setup Analytics API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking Analytics Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\Analytics;

use Google\Site_Kit\Core\REST_API\REST_Routes;

const ACCOUNT_ID_A = '100';
const ACCOUNT_ID_B = '101';

const PROPERTY_ID_X = 'UA-100-1';
const PROPERTY_ID_Y = 'UA-101-1';
const PROPERTY_ID_Z = 'UA-101-2';

const INTERNAL_PROPERTY_ID_X = '200';
const INTERNAL_PROPERTY_ID_Y = '201';
const INTERNAL_PROPERTY_ID_Z = '202';

const PROFILE_ID_X = '300';
const PROFILE_ID_Y = '301';
const PROFILE_ID_Z = '302';

const GA4_PROPERTY_ID_X = '1000';
const GA4_PROPERTY_ID_Y = '2000';
const GA4_PROPERTY_ID_Z = '302';

const GA4_WEBDATASTREAM_ID_X = '400';
const GA4_WEBDATASTREAM_ID_Y = '401';
const GA4_WEBDATASTREAM_ID_Z = '402';

const GA4_MEASUREMENT_ID_X = 'G-500';
const GA4_MEASUREMENT_ID_Y = 'G-501';
const GA4_MEASUREMENT_ID_Z = 'G-502';

register_activation_hook(
	__FUNCTION__,
	function () {
		delete_option( 'googlesitekit_e2e_reference_url' );
	}
);

register_deactivation_hook(
	__FUNCTION__,
	function () {
		delete_option( 'googlesitekit_e2e_reference_url' );
	}
);

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
				return get_internal_id_by_property( $property_id ) === $item['internalWebPropertyId'];
			}
		)
	);
}

function filter_ga4_by_account_id( $items, $account_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $account_id ) {
				return $item['_accountID'] === $account_id;
			}
		)
	);
}

function filter_webdatastream_by_property_ids( $items, $property_ids ) {
	return array_filter(
		$items,
		function ( $item ) use ( $property_ids ) {
			return in_array( (string) $item, $property_ids, true );
		},
		ARRAY_FILTER_USE_KEY
	);
}

function filter_webdatastream_by_property_id( $items, $propery_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $propery_id ) {
				return $item['_propertyID'] === $propery_id;
			}
		)
	);
}

add_action(
	'rest_api_init',
	function () {
		$accounts   = array(
			array(
				'id'          => ACCOUNT_ID_A,
				'kind'        => 'analytics#account',
				'name'        => 'Test Account A',
				'permissions' => array(
					'effective' => array( 'COLLABORATE', 'EDIT', 'MANAGE_USERS', 'READ_AND_ANALYZE' ),
				),
			),
			array(
				'id'          => ACCOUNT_ID_B,
				'kind'        => 'analytics#account',
				'name'        => 'Test Account B',
				'permissions' => array(
					'effective' => array( 'COLLABORATE', 'EDIT', 'MANAGE_USERS', 'READ_AND_ANALYZE' ),
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
				'websiteUrl'            => get_reference_url(),
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

		$profiles = array(
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

		$ga4_properties = array(
			array(

				'displayName' => 'example.com',
				'_id'         => GA4_PROPERTY_ID_X,
				'_accountID'  => ACCOUNT_ID_A,
			),
			array(

				'displayName' => 'example.net',
				'_id'         => GA4_PROPERTY_ID_Y,
				'_accountID'  => ACCOUNT_ID_B,
			),
			array(

				'displayName' => 'example.org',
				'_id'         => GA4_PROPERTY_ID_Z,
				'_accountID'  => ACCOUNT_ID_B,
			),
		);

		$ga4_webdatastreams = array(
			GA4_PROPERTY_ID_X => array(
				array(
					'_id'           => GA4_WEBDATASTREAM_ID_X,
					'_propertyID'   => GA4_PROPERTY_ID_X,
					'name'          => 'properties/' . GA4_PROPERTY_ID_X . '/dataStreams/' . GA4_WEBDATASTREAM_ID_X,
					'webStreamData' => array(
						'measurementId' => GA4_MEASUREMENT_ID_X,
						'defaultUri'    => get_reference_url(),
					),
					'displayName'   => 'Test GA4 WebDataStream',
				),
			),
			GA4_PROPERTY_ID_Y => array(
				array(
					'_id'           => GA4_WEBDATASTREAM_ID_Y,
					'_propertyID'   => GA4_PROPERTY_ID_Y,
					'name'          => 'properties/' . GA4_PROPERTY_ID_Y . '/dataStreams/' . GA4_WEBDATASTREAM_ID_Y,
					'webStreamData' => array(
						'measurementId' => GA4_MEASUREMENT_ID_Y,
						'defaultUri'    => 'example.net',
					),
					'displayName'   => 'Another WebDataStream',
				),
			),
			GA4_PROPERTY_ID_Z => array(
				array(
					'webStreamData' => array(
						'measurementId' => GA4_MEASUREMENT_ID_Z,
						'defaultUri'    => 'example.org',
					),
					'_id'           => GA4_WEBDATASTREAM_ID_Z,
					'_propertyID'   => GA4_PROPERTY_ID_Z,
				),
			),
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics/data/accounts-properties-profiles',
			array(
				'methods'             => 'GET',
				'callback'            => function () use ( $accounts, $properties, $profiles ) {
					$response = array(
						'accounts'   => $accounts,
						'properties' => array(),
						'profiles'   => array(),
					);

					return $response;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		// Called when switching accounts
		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics/data/properties-profiles',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $properties, $profiles ) {
					$filtered_properties = filter_by_account_id( $properties, $request->get_param( 'accountID' ) );

					return array(
						'properties' => $filtered_properties,
						'profiles'   => filter_by_property_id( $profiles, $filtered_properties[0]['id'] ),
					);
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		// Called when switching properties
		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics/data/profiles',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $profiles ) {
					$profiles = filter_by_property_id( $profiles, $request->get_param( 'propertyID' ) );

					return $profiles;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		// Called when switching properties for Analytics 4
		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics-4/data/properties',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $ga4_properties ) {
					$properties = filter_ga4_by_account_id( $ga4_properties, $request->get_param( 'accountID' ) );

					return $properties;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		// Called when switching properties for Analytics 4 to get the measurement ids.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics-4/data/webdatastreams-batch',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $ga4_webdatastreams ) {
					$webdatastreams = filter_webdatastream_by_property_ids( $ga4_webdatastreams, $request->get_param( 'propertyIDs' ) );

					return $webdatastreams;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics-4/data/webdatastreams',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $ga4_webdatastreams ) {
					$webdatastreams = filter_webdatastream_by_property_id( $ga4_webdatastreams, $request->get_param( 'propertyID' ) );

					return $webdatastreams;
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/reference-url',
			array(
				'methods'             => 'POST',
				'callback'            => function ( \WP_REST_Request $request ) {
					$url = $request->get_param( 'url' );
					update_option( 'googlesitekit_e2e_reference_url', $url );

					return array(
						'success' => true,
						'url'     => $url,
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
