<?php
/**
 * Plugin Name: E2E New Site Posts Endpoint
 * Description: REST Endpoint for setting the number of posts in a new site.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage;

add_action(
	'rest_api_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		register_rest_route(
			REST_Routes::REST_ROOT,
			'e2e/site/posts',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function ( WP_REST_Request $request ) {
					$count = sanitize_text_field( $request['count'] );
					if ( update_option( 'googlesitekit_new_site_posts', $count ) ) {
						return array(
							'success' => true,
							'count'   => $count,
						);
					} else {
						return array(
							'success' => false,
							'count'   => $count,
						);
					}
				},
				'permission_callback' => '__return_true',
			)
		);
	},
	0
);
