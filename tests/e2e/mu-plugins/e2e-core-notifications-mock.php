<?php
/**
 * Plugin Name: E2E Notifications API Mock
 * Description: MU plugin for mocking core site notifications for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\E2E\Notifications;

use Google\Site_Kit\Core\Notifications\Notification;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_Error;
use WP_REST_Request;

const OPTION = 'googlesitekit_e2e_site_notifications';

add_action(
	'rest_api_init',
	function () {
		register_setting(
			OPTION,
			OPTION,
			array(
				'type'         => 'object',
				'default'      => array(),
				'show_in_rest' => true,
			)
		);

		// Utility route to add notifications.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/core/site/notifications',
			array(
				'methods'  => 'POST',
				'callback' => function ( WP_REST_Request $request ) {
					$notifications = get_option( OPTION ) ?: array();
					$notification  = $request->get_json_params();

					$notifications[ $request['slug'] ] = $notification;
					$success                           = update_option( OPTION, $notifications );

					return compact( 'success', 'notification' );
				},
				'args'     => array(
					'slug'    => array(
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

		// Override core notifications endpoint.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'core/site/data/notifications',
			array(
				'methods'  => 'GET',
				'callback' => function ( WP_REST_Request $request ) {
					$notifications = get_option( OPTION );

					return array_map(
						function ( $notification, $slug ) {
							return ( new Notification( $slug, $notification ) )->prepare_for_js();
						},
						$notifications,
						array_keys( $notifications )
					);
				},
			),
			true
		);
		// Override core mark-notification endpoint.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'core/site/data/mark-notification',
			array(
				'methods'  => 'POST',
				'callback' => function ( WP_REST_Request $request ) {
					if ( empty( $request['data']['notificationID'] ) ) {
						return new WP_Error( 'missing_required_param', 'Missing required data.notificationID parameter' );
					}
					if ( empty( $request['data']['notificationState'] ) ) {
						return new WP_Error( 'missing_required_param', 'Missing required data.notificationState parameter' );
					}
					$mark_id              = $request['data']['notificationID'];
					$notifications_before = get_option( OPTION );
					$notifications_after  = array_filter(
						$notifications_before,
						function ( $notification ) use ( $mark_id ) {
							// Remove the notification with the given ID.
							return $notification['slug'] !== $mark_id;
						}
					);
					update_option( OPTION, $notifications_after );

					if ( $notifications_before !== $notifications_after ) {
						return array( 'success' => true );
					} else {
						return array( 'success' => false );
					}
				},
			),
			true
		);
	},
	0
);

