<?php
/**
 * Class Google\Site_Kit\Core\Expirables\REST_Expirable_Items_Controller
 *
 * @package   Google\Site_Kit\Core\Expirables
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Expirables;

use Google\Site_Kit\Core\Expirables\Expirable_Items;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling expirable items rest routes.
 *
 * @since 1.128.0
 * @access private
 * @ignore
 */
class REST_Expirable_Items_Controller {

	/**
	 * Expirable_Items instance.
	 *
	 * @since 1.128.0
	 * @var Expirable_Items
	 */
	protected $expirable_items;

	/**
	 * Constructor.
	 *
	 * @since 1.128.0
	 *
	 * @param Expirable_Items $expirable_items Expirable items instance.
	 */
	public function __construct( Expirable_Items $expirable_items ) {
		$this->expirable_items = $expirable_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.128.0
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
						'/' . REST_Routes::REST_ROOT . '/core/user/data/expirable-items',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.128.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_expirable_item = function() {
			return current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/expirable-items',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function () {
						return new WP_REST_Response( $this->expirable_items->get() );
					},
					'permission_callback' => $can_manage_expirable_item,
				)
			),
			new REST_Route(
				'core/user/data/set-expirable-item-timers',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['data'];

						if ( empty( $data ) || ! is_array( $data ) ) {
							return new WP_Error(
								'missing_required_param',
								/* translators: %s: Missing parameter name */
								sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'items' ),
								array( 'status' => 400 )
							);
						}

						foreach ( $data as $datum ) {
							if ( empty( $datum['slug'] ) ) {
								return new WP_Error(
									'missing_required_param',
									/* translators: %s: Missing parameter name */
									sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'slug' ),
									array( 'status' => 400 )
								);
							}

							$expiration = null;
							if ( isset( $datum['expiration'] ) && intval( $datum['expiration'] ) > 0 ) {
								$expiration = $datum['expiration'];
							}

							if ( ! $expiration ) {
								return new WP_Error(
									'missing_required_param',
									/* translators: %s: Missing parameter name */
									sprintf( __( 'Request parameter is invalid: %s.', 'google-site-kit' ), 'expiration' ),
									array( 'status' => 400 )
								);
							}

							$this->expirable_items->add( $datum['slug'], $expiration );
						}

						return new WP_REST_Response( $this->expirable_items->get() );
					},
					'permission_callback' => $can_manage_expirable_item,
					'args'                => array(
						'data' => array(
							'type'     => 'array',
							'required' => true,
							'items'    => array(
								'type'                 => 'object',
								'additionalProperties' => false,
								'properties'           => array(
									'slug'       => array(
										'type'     => 'string',
										'required' => true,
									),
									'expiration' => array(
										'type'     => 'integer',
										'required' => true,
									),
								),
							),
						),
					),
				)
			),
		);
	}
}
