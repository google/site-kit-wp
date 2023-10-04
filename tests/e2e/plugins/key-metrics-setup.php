<?php
/**
 * Plugin Name: E2E Tests Key Metrics Setup API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for setting key_metrics_setup_completed and widgets during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed;
use Google\Site_Kit\Core\REST_API\REST_Routes;

const OPTION = 'googlesitekit_e2e_key_metrics_settings';

$cleanup = function() {
	delete_option( OPTION );
};

register_activation_hook( __FILE__, $cleanup );

register_deactivation_hook( __FILE__, $cleanup );

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/key-metrics/set-key-metrics-setup-completed',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$key_metrics_setup_completed = get_option( 'googlesitekit_e2e_key_metrics_setup_completed', 0 );

					if ( $request['key-metrics-setup-completed'] ) {
						$key_metrics_setup_completed = (int) $request['key-metrics-setup-completed'];
					}

					update_option( Key_Metrics_Setup_Completed::OPTION, $key_metrics_setup_completed );

					return array(
						'success' => true,
					);
				},
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/key-metrics/set-widgets',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$widgets = get_option( OPTION, array() );

					if ( $request['settings'] ) {
						$widgets = $request['settings'];
					}

					$settings = update_option( OPTION, $widgets );

					return array(
						'success' => $settings,
					);
				},
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'core/user/data/key-metrics',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => function () {
					$settings = get_option( OPTION );

					return new WP_REST_Response( $settings );
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
