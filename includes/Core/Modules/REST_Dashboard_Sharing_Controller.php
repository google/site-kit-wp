<?php
/**
 * Class Google\Site_Kit\Core\Modules\REST_Dashboard_Sharing_Controller
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling dashboard sharing rest routes.
 *
 * @since 1.75.0
 * @access private
 * @ignore
 */
class REST_Dashboard_Sharing_Controller {

	/**
	 * Modules instance.
	 *
	 * @since 1.75.0
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Constructor.
	 *
	 * @since 1.75.0
	 *
	 * @param Modules $modules Modules instance.
	 */
	public function __construct( Modules $modules ) {
		$this->modules = $modules;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.75.0
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
	 * @since 1.75.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_options = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/modules/data/sharing-settings',
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$original_module_owners = $this->modules->get_shareable_modules_owners();

						$sharing_settings = $this->modules->get_module_sharing_settings();
						$sharing_settings->merge( (array) $request['data'] );

						$new_sharing_settings = $sharing_settings->get();

						$new_module_owners = $this->modules->get_shareable_modules_owners();
						$changed_module_owners = array_filter(
							$new_module_owners,
							function ( $new_owner_id, $module_slug ) use ( $original_module_owners ) {
								return $new_owner_id !== $original_module_owners[ $module_slug ];
							},
							ARRAY_FILTER_USE_BOTH
						);

						return new WP_REST_Response(
							array(
								'settings'    => $new_sharing_settings,
								// Cast array to an object so JSON encoded response is always an object,
								// even when the array is empty.
								'newOwnerIDs' => (object) $changed_module_owners,
							)
						);
					},
					'permission_callback' => $can_manage_options,
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
