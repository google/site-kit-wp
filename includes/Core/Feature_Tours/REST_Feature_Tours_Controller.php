<?php
/**
 * Class Google\Site_Kit\Core\Feature_Tours\REST_Feature_Tours_Controller
 *
 * @package   Google\Site_Kit\Core\Feature_Tours
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Feature_Tours;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling feature tour rest routes.
 *
 * @since 1.27.0
 * @access private
 * @ignore
 */
class REST_Feature_Tours_Controller {

	/**
	 * Dismissed_Tours instance.
	 *
	 * @since 1.27.0
	 * @var Dismissed_Tours
	 */
	protected $dismissed_tours;

	/**
	 * Constructor.
	 *
	 * @since 1.27.0
	 *
	 * @param Dismissed_Tours $dismissed_tours Dismissed tours instance.
	 */
	public function __construct( Dismissed_Tours $dismissed_tours ) {
		$this->dismissed_tours = $dismissed_tours;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.27.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				$feature_tour_routes = array(
					'/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-tours',
				);

				return array_merge( $paths, $feature_tour_routes );
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.27.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_dismiss_tour = function () {
			return current_user_can( Permissions::AUTHENTICATE ) || current_user_can( Permissions::VIEW_SHARED_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/dismissed-tours',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function () {
						return new WP_REST_Response( $this->dismissed_tours->get() );
					},
					'permission_callback' => $can_dismiss_tour,
				)
			),
			new REST_Route(
				'core/user/data/dismiss-tour',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['data'];

						if ( empty( $data['slug'] ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: %s: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'slug' ),
								array( 'status' => 400 )
							);
						}

						$this->dismissed_tours->add( $data['slug'] );

						return new WP_REST_Response( $this->dismissed_tours->get() );
					},
					'permission_callback' => $can_dismiss_tour,
					'args'                => array(
						'data' => array(
							'type'     => 'object',
							'required' => true,
						),
					),
				)
			),
		);
	}
}
