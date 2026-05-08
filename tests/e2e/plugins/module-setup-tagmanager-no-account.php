<?php
/**
 * Plugin Name: E2E Tests Module Setup TagManager API Mock No Account
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking TagManager Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action(
	'rest_api_init',
	function () {

		register_rest_route(
			REST_Routes::REST_ROOT,
			'modules/tagmanager/data/accounts',
			array(
				'methods'             => 'GET',
				'callback'            => function () {
					return array();
				},
				'permission_callback' => '__return_true',
			),
			true
		);

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/setup/tagmanager/account-created',
			array(
				'methods'             => 'POST',
				'callback'            => function () {
					require_once ABSPATH . 'wp-admin/includes/plugin.php';

					deactivate_plugins( plugin_basename( __FILE__ ), true );
					activate_plugin( plugin_basename( __DIR__ . '/module-setup-tagmanager.php' ), '', false, true );

					return array(
						'success' => true,
						'result'  => 'account-created',
					);
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
