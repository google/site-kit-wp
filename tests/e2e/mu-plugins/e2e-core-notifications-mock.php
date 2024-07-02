<?php
/**
 * Plugin Name: E2E Notifications API Mock
 * Description: MU plugin for mocking core site notifications for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\E2E\Notifications;

use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Plugin;
use WP_Error;
use WP_REST_Request;

/**
 * Option to store temporary notification data in remote/proxy format.
 * This will be cleared by the normal Site Kit plugin reset which happens many times throughout the tests.
 */
const OPTION = 'googlesitekit_e2e_site_notifications';

function get_notifications() {
	return get_option( OPTION ) ?: array();
}

function set_notifications( array $notifications ) {
	return update_option( OPTION, $notifications );
}

function mark_notification( $id ) {
	$notifications_before = get_notifications();
	$notifications_after  = array_filter(
		$notifications_before,
		function ( $notification ) use ( $id ) {
			// Remove the notification with the given ID.
			return $notification['id'] !== $id;
		}
	);

	return set_notifications( $notifications_after );
}

function create_proxy_http_mock( $proxy_base_url ) {
	return function ( $false_value, $parsed_args, $url ) use ( $proxy_base_url ) {
		if ( 0 !== strpos( $url, $proxy_base_url ) ) {
			return $false_value;
		}

		$response = array(
			'headers'       => array(
				'Content-Type: application/json',
			),
			'body'          => '',
			'response'      => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'       => array(),
			'http_response' => null,
		);

		$method = strtoupper( $parsed_args['method'] );
		$path   = parse_url( $url, PHP_URL_PATH );
		$qs     = parse_url( $url, PHP_URL_QUERY );
		parse_str( $qs, $query_params );

		switch ( "$method:$path" ) {
			case 'GET:/notifications/':
				if ( empty( $query_params['site_id'] ) ) {
					return new WP_Error( 'missing_site_id' );
				}

				$response['body'] = wp_json_encode( get_notifications() );
				break;
			case 'POST:/notifications/mark/':
				if ( empty( $parsed_args['body']['site_id'] ) ) {
					return new WP_Error( 'missing_site_id' );
				}
				if ( empty( $parsed_args['body']['site_secret'] ) ) {
					return new WP_Error( 'missing_site_secret' );
				}
				if ( empty( $parsed_args['body']['notification_id'] ) ) {
					return new WP_Error( 'missing_notification_id' );
				}
				if ( empty( $parsed_args['body']['notification_state'] ) ) {
					return new WP_Error( 'missing_notification_state' );
				}

				mark_notification( $parsed_args['body']['notification_id'] );

				$response['body'] = wp_json_encode( array( 'success' => true ) );
				break;
			default:
				return $false_value;
		}

		return $response;
	};
}

add_action(
	'googlesitekit_init',
	function () {
		$proxy     = new Google_Proxy( Plugin::instance()->context() );
		$http_mock = create_proxy_http_mock( $proxy->url() );
		// Intercept HTTP requests to the proxy and mock the responses.
		add_filter( 'pre_http_request', $http_mock, 10, 3 );
	}
);

add_action(
	'rest_api_init',
	function () {
		// Utility route to add notifications.
		// JSON body should contain the new notification to add **in remote format**.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/core/site/notifications',
			array(
				'methods'             => 'POST',
				'callback'            => function ( WP_REST_Request $request ) {
					$notifications = get_notifications();
					$notification  = $request->get_json_params();
					array_push( $notifications, $notification );
					$success = set_notifications( $notifications );

					return compact( 'success' );
				},
				'permission_callback' => '__return_true',
				'args'                => array(
					'id'      => array(
						'type'     => 'string',
						'required' => true,
					),
					'content' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	},
	0
);
