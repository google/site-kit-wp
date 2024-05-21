<?php
/**
 * Class Google\Site_Kit\Core\Admin\Admin_Columns
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\Storage\Transients;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST controller class for admin columns.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Admin_Columns_REST_Controller {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Columns_Data instance.
	 *
	 * @since n.e.x.t
	 * @var Columns_Data
	 */
	protected $columns_data;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context      Plugin context.
	 * @param Columns_Data $columns_data Columns_Data instance.
	 */
	public function __construct(
		Context $context,
		Columns_Data $columns_data
	) {
		$this->context      = $context;
		$this->columns_data = $columns_data;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_view_columns = function() {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/admin/data/columns-data',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$data = $request['queryParams'];

						$response = $this->columns_data->request_columns_data( $data );

						return new WP_REST_Response( $response );
					},
					'permission_callback' => $can_view_columns,
				)
			),
		);
	}

}
