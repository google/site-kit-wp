<?php
/**
 * Class Google\Site_Kit\Core\User\REST_Initial_Setup_Controller
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class for handling initial setup setting REST routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Initial_Setup_Controller {

	/**
	 * Initial_Setup_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Initial_Setup_Settings
	 */
	private $initial_setup_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Initial_Setup_Settings $initial_setup_settings Initial_Setup_Settings instance.
	 */
	public function __construct( Initial_Setup_Settings $initial_setup_settings ) {
		$this->initial_setup_settings = $initial_setup_settings;
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
	 * Gets the REST route definition for initial setup.
	 *
	 * @since n.e.x.t
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
		};

		return array(
			new REST_Route(
				'core/user/data/initial-setup',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->initial_setup_settings->get() );
						},
						'permission_callback' => $can_setup,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$data = $request->get_param( 'data' );

							$this->initial_setup_settings->set( $data['initialSetup'] );

							return new WP_REST_Response( $this->initial_setup_settings->get() );
						},
						'permission_callback' => $can_setup,
						'args'                => array(
							'data' => array(
								'type'                 => 'object',
								'required'             => true,
								'minProperties'        => 1,
								'additionalProperties' => false,
								'properties'           => array(
									'initialSetup' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'isAnalyticsSetupComplete' => array(
												'type'     => 'boolean',
												'required' => true,
											),
										),
									),
								),
							),
						),
					),
				),
			),
		);
	}
}
