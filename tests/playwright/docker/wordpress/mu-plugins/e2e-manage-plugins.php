<?php
/**
 * Plugin Name: E2E Manage Plugins
 * Description: Provides a REST API endpoint for activating and deactivating plugins during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'e2e/v1',
			'/plugins',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $request ) {
					require_once ABSPATH . 'wp-admin/includes/plugin.php';

					$plugin = $request->get_param( 'plugin' );
					$status = $request->get_param( 'status' );

					$err = null;
					if ( 'active' === $status ) {
						$err = activate_plugin( $plugin );
					} else {
						$err = deactivate_plugins( $plugin );
					}

					if ( is_wp_error( $err ) ) {
						return new WP_REST_Response(
							array(
								'plugin' => $plugin,
								'status' => $status,
								'error'  => $err->get_error_message(),
							),
							500
						);
					}

					return new WP_REST_Response(
						array(
							'plugin' => $plugin,
							'status' => $status,
						),
						200
					);
				},
				'args'                => array(
					'plugin' => array(
						'required' => true,
						'type'     => 'string',
					),
					'status' => array(
						'required' => true,
						'type'     => 'string',
						'enum'     => array( 'active', 'inactive' ),
					),
				),
			)
		);
	}
);
