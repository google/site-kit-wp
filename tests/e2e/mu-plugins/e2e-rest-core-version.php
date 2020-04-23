<?php
/**
 * Plugin Name: E2E WP Version REST Endpoint
 * Description: REST Endpoint for providing information about the current core version.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/wp/version',
			array(
				'methods'  => 'GET',
				'callback' => function () {
					$version = get_bloginfo( 'version' );
					list( $major, $minor ) = explode( '.', $version );

					return array(
						'version' => $version,
						'major'   => (int) $major,
						'minor'   => (int) $minor,
					);
				},
			)
		);
	},
	0
);
