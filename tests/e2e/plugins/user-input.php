<?php
/**
 * Plugin Name: E2E Tests User Input Settings API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for handling user input settings for Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Authentication\User_Input_State;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Setting;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/auth/user-input',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					update_option(
						User_Setting::OPTION,
						sanitize_text_field( $request['user_input'] )
					);

					return array( 'success' => true );
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
