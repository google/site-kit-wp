<?php
/**
 * Plugin Name: E2E Tests Share Modules Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for sharing modules during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Plugin;

const OPTION_SHARED_MODULES = 'googlesitekit_e2e_shared_modules';

$cleanup = function() {
	delete_option( OPTION_SHARED_MODULES );
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
			'e2e/share-modules',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$modules = $request['modules'];
					$roles   = $request['roles'];

					update_option(
						OPTION_SHARED_MODULES,
						array_merge(
							array( 'modules' => $modules ),
							array( 'roles' => $roles )
						)
					);

					$data = get_option( OPTION_SHARED_MODULES );

					return array(
						'success' => $data,
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);

add_action(
	'admin_init',
	function() {
		$shared_modules = get_option( OPTION_SHARED_MODULES );

		if ( ! empty( $shared_modules ) ) {
			$modules = $shared_modules['modules'];
			$roles   = $shared_modules['roles'];

			$context          = Plugin::instance()->context();
			$sharing_settings = new Module_Sharing_Settings( new Options( $context ) );

			$shared_modules = array_combine(
				$modules,
				array_fill(
					0,
					count( $shared_modules ),
					array( 'sharedRoles' => $roles )
				)
			);

			$sharing_settings->set( $shared_modules );
		}
	}
);
