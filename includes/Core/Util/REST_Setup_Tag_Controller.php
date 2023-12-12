<?php
/**
 * Class Google\Site_Kit\Core\Util\REST_Setup_Tag_Controller.php
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Contracts\Registerable;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class REST_Setup_Tag_Controller implements Registerable {

	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	private function get_rest_routes() {
		return [
			new REST_Route(
				'core/site/data/setup-tag',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$token = wp_generate_uuid4();
							set_transient( 'googlesitekit_setup_token', $token, 5 * MINUTE_IN_SECONDS );

							return new WP_REST_Response( array( 'token' => $token ) );
						},
						'permission_callback' => fn () => current_user_can( Permissions::SETUP ),
					),
				)
			),
		];
	}
}
