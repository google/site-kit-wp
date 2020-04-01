<?php
/**
 * Plugin Name: E2E Search Console Property Endpoint
 * Description: REST Endpoint for setting the Search Console property for Site Kit during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Modules\Search_Console\Settings;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/setup/search-console-property',
			array(
				'methods'  => WP_REST_Server::EDITABLE,
				'callback' => function ( WP_REST_Request $request ) {
					$settings = get_option( Settings::OPTION );
					$settings['propertyID'] = $request['property'] ?: '';
					update_option( Settings::OPTION, $settings );

					return array( 'success' => true );
				},
			)
		);
	},
	0
);
