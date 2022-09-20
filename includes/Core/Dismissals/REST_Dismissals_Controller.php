<?php
/**
 * Class Google\Site_Kit\Core\Dismissals\REST_Dismissals_Controller
 *
 * @package   Google\Site_Kit\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dismissals;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling dismissed items rest routes.
 *
 * @since 1.37.0
 * @access private
 * @ignore
 */
class REST_Dismissals_Controller {

	/**
	 * Dismissed_Items instance.
	 *
	 * @since 1.37.0
	 * @var Dismissed_Items
	 */
	protected $dismissed_items;

	/**
	 * Constructor.
	 *
	 * @since 1.37.0
	 *
	 * @param Dismissed_Items $dismissed_items Dismissed items instance.
	 */
	public function __construct( Dismissed_Items $dismissed_items ) {
		$this->dismissed_items = $dismissed_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.37.0
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
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-items',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.37.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_dismiss_item = function() {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/dismissed-items',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function () {
						return new WP_REST_Response( $this->dismissed_items->get_dismissed_items() );
					},
					'permission_callback' => $can_dismiss_item,
				)
			),
			new REST_Route(
				'core/user/data/dismiss-item',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['data'];

						if ( empty( $data['slug'] ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: 1: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'slug' ),
								array( 'status' => 400 )
							);
						}

						$expiration = Dismissed_Items::DISMISS_ITEM_PERMANENTLY;
						if ( isset( $data['expiration'] ) && intval( $data['expiration'] ) > 0 ) {
							$expiration = $data['expiration'];
						}

						$this->dismissed_items->add( $data['slug'], $expiration );

						return new WP_REST_Response( $this->dismissed_items->get_dismissed_items() );
					},
					'permission_callback' => $can_dismiss_item,
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
