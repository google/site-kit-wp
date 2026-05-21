<?php
/**
 * Plugin Name: E2E Tests Enhanced Conversions Plugin
 * Description: Test utilities for Enhanced Conversions E2E tests, enabling deterministic module and user profile configuration.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

/**
 * Transient keys for test state.
 */
const E2E_EC_MODULES_TRANSIENT = 'e2e_enhanced_conversions_connected_modules';
const E2E_EC_PROFILE_TRANSIENT = 'e2e_enhanced_conversions_user_profile_override';

/**
 * Mock the module connection filter for Enhanced Conversions module testing.
 */
add_filter(
	'googlesitekit_is_module_connected',
	function ( $connected, $module ) {
		$connected_modules = get_transient( E2E_EC_MODULES_TRANSIENT );

		if ( ! is_array( $connected_modules ) ) {
			$connected_modules = array();
		}

		// If the module is in our test override list, use that state.
		if ( isset( $connected_modules[ $module ] ) ) {
			return (bool) $connected_modules[ $module ];
		}

		return $connected;
	},
	999,
	2
);

/**
 * Mock the user data retrieval for partial profile tests.
 */
add_filter(
	'user_email',
		// phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
	function ( $email, $_user, $_scheme ) {
		$override = get_transient( E2E_EC_PROFILE_TRANSIENT );

		if ( ! is_array( $override ) || ! array_key_exists( 'email', $override ) ) {
			return $email;
		}

		if ( '' === $override['email'] ) {
			return '';
		}

		if ( null !== $override['email'] ) {
			return sanitize_email( $override['email'] );
		}

		return $email;
	},
	10,
	3
);

add_action(
	'init',
	function () {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$override = get_transient( E2E_EC_PROFILE_TRANSIENT );
		if ( ! is_array( $override ) ) {
			return;
		}

		$user = wp_get_current_user();
		if ( ! $user || ! $user->ID ) {
			return;
		}

		if ( array_key_exists( 'first_name', $override ) && null !== $override['first_name'] ) {
			$user->user_firstname = (string) $override['first_name'];
		}

		if ( array_key_exists( 'last_name', $override ) && null !== $override['last_name'] ) {
			$user->user_lastname = (string) $override['last_name'];
		}

		if ( ! array_key_exists( 'email', $override ) || null === $override['email'] ) {
			return;
		}

		if ( '' === $override['email'] ) {
			$user->user_email = '';
			if ( isset( $user->data ) && is_object( $user->data ) ) {
				$user->data->user_email = '';
			}
			return;
		}

		$sanitized_email  = sanitize_email( $override['email'] );
		$user->user_email = $sanitized_email;
		if ( isset( $user->data ) && is_object( $user->data ) ) {
			$user->data->user_email = $sanitized_email;
		}
	},
	1
);

add_action(
	'googlesitekit_setup_gtag',
	function ( $gtag ) {
		// Only add test tag if we have active test state (transients set).
		$test_state = get_transient( E2E_EC_MODULES_TRANSIENT ) || get_transient( E2E_EC_PROFILE_TRANSIENT );
		if ( $test_state ) {
			$gtag->add_tag( 'G-TEST1234' );
		}
	},
	1
);

/**
 * Register REST endpoints for E2E test configuration.
 */
add_action(
	'rest_api_init',
	function () {
		// Endpoint to set module connection state.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/enhanced-conversions/connect-module',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $request ) {
					$module    = $request->get_param( 'module' );
					$connected = $request->get_param( 'connected' );

					if ( empty( $module ) || ! is_string( $module ) ) {
						return new WP_Error(
							'invalid_module',
							'Module parameter is required and must be a string.',
							array( 'status' => 400 )
						);
					}

					if ( ! is_bool( $connected ) ) {
						return new WP_Error(
							'invalid_connected',
							'Connected parameter is required and must be a boolean.',
							array( 'status' => 400 )
						);
					}

					$connected_modules = get_transient( E2E_EC_MODULES_TRANSIENT );
					if ( ! is_array( $connected_modules ) ) {
						$connected_modules = array();
					}

					$connected_modules[ $module ] = $connected;

					set_transient(
						E2E_EC_MODULES_TRANSIENT,
						$connected_modules,
						5 * MINUTE_IN_SECONDS
					);

					return array(
						'success'   => true,
						'module'    => $module,
						'connected' => $connected,
					);
				},
				'args'                => array(
					'module'    => array(
						'type'     => 'string',
						'required' => true,
					),
					'connected' => array(
						'type'     => 'boolean',
						'required' => true,
					),
				),
			)
		);

		// Endpoint to set user profile fields for partial-data testing.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/enhanced-conversions/set-user-profile',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $request ) {
					$profile = array(
						'email'      => $request->get_param( 'email' ),
						'first_name' => $request->get_param( 'first_name' ),
						'last_name'  => $request->get_param( 'last_name' ),
					);

					// Store the override in a transient so it can be applied during filter.
					set_transient( E2E_EC_PROFILE_TRANSIENT, $profile, 5 * MINUTE_IN_SECONDS );

					// Apply the changes to the current user.
					$user = wp_get_current_user();
					if ( $user->ID ) {
						$update = array( 'ID' => $user->ID );

						if ( null !== $profile['email'] && '' !== $profile['email'] ) {
							$update['user_email'] = sanitize_email( $profile['email'] );
						}

						if ( null !== $profile['first_name'] ) {
							update_user_meta( $user->ID, 'first_name', sanitize_text_field( $profile['first_name'] ) );
						}

						if ( null !== $profile['last_name'] ) {
							update_user_meta( $user->ID, 'last_name', sanitize_text_field( $profile['last_name'] ) );
						}

						if ( isset( $update['user_email'] ) ) {
							wp_update_user( $update );
						}
					}

					return array(
						'success' => true,
						'profile' => $profile,
					);
				},
				'args'                => array(
					'email'      => array( 'type' => 'string' ),
					'first_name' => array( 'type' => 'string' ),
					'last_name'  => array( 'type' => 'string' ),
				),
			)
		);

		// Endpoint to reset all test state.
		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/enhanced-conversions/reset',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'permission_callback' => '__return_true',
				'callback'            => function () {
					delete_transient( E2E_EC_MODULES_TRANSIENT );
					delete_transient( E2E_EC_PROFILE_TRANSIENT );
					return array( 'success' => true );
				},
			)
		);
	}
);
