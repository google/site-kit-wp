<?php
/**
 * Plugin Name: E2E REST Analytics Ads Conversion ID setting
 * Description: REST Endpoint for setting up the Ads module during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Modules\Ads\Settings;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/analytics/ads-conversion-id',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$settings                    = get_option( Settings::OPTION );
					$settings['adsConversionID'] = $request['id'] ?: '';

					update_option( Settings::OPTION, $settings );

					return array( 'success' => true );
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);

