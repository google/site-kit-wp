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

const GA4_PROPERTY_ID_X = '1000';
const GA4_PROPERTY_ID_Y = '1001';
const GA4_PROPERTY_ID_Z = '1002';

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

add_action(
	'rest_api_init',
	function () {
		$accounts = array(
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

		$account_summaries = array(
			array(
				'account'           => 'accounts/' . ACCOUNT_ID_A,
				'displayName'       => 'Example Com',
				'name'              => 'accountSummaries/' . ACCOUNT_ID_A,
				'_id'               => ACCOUNT_ID_A,
				'propertySummaries' => array(
					array(
						'displayName' => 'Example Property',
						'property'    => 'properties/' . GA4_PROPERTY_ID_X,
						'_id'         => GA4_PROPERTY_ID_X,
					),
				),
			),
			array(
				'account'           => 'accounts/' . ACCOUNT_ID_B,
				'displayName'       => 'Example Net',
				'name'              => 'accountSummaries/' . ACCOUNT_ID_B,
				'_id'               => ACCOUNT_ID_B,
				'propertySummaries' => array(
					array(
						'displayName' => 'Example Property',
						'property'    => 'properties/' . GA4_PROPERTY_ID_Y,
						'_id'         => GA4_PROPERTY_ID_Y,
					),
					array(
						'displayName' => 'Example Property Z',
						'property'    => 'properties/' . GA4_PROPERTY_ID_Z,
						'_id'         => GA4_PROPERTY_ID_Z,
					),
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
						'defaultUri'    => get_reference_url(),
					),
					'displayName'   => 'Another WebDataStream',
				),
			),
			GA4_PROPERTY_ID_Z => array(
				array(
					'_id'           => GA4_WEBDATASTREAM_ID_Z,
					'_propertyID'   => GA4_PROPERTY_ID_Z,
					'webStreamData' => array(
						'measurementId' => GA4_MEASUREMENT_ID_Z,
						'defaultUri'    => 'example.org',
					),
					'displayName'   => 'Third WebDataStream',
				),
			),
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics/data/accounts-properties-profiles',
			array(
				'methods'             => 'GET',
				'callback'            => function () use ( $accounts ) {
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

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics-4/data/account-summaries',
			array(
				'methods'             => 'GET',
				'callback'            => function () use ( $account_summaries ) {
					return $account_summaries;
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
				'callback'            => function () {
					return array(
						'properties' => array(),
						'profiles'   => array(),
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
				'callback'            => function () {
					return array();
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

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/analytics-4/data/property',
			array(
				'methods'             => 'GET',
				'callback'            => function ( \WP_REST_Request $request ) use ( $ga4_properties ) {
					$property_id = $request->get_param( 'propertyID' );

					foreach ( $ga4_properties as $property ) {
						if ( $property['_id'] === $property_id ) {
							return $property;
						}
					}

					return new \WP_Error( 'e2e:property_not_found', 'E2E: No property found' );
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
					$webdatastreams = filter_webdatastream_by_property_ids( $ga4_webdatastreams, array( $request->get_param( 'propertyID' ) ) );

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
