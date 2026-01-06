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
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling audience settings rest routes.
 *
 * @since 1.164.0
 * @access private
 * @ignore
 */
class REST_Initial_Setup_Controller {

	/**
	 * Initial_Setup_Settings instance.
	 *
	 * @since 1.164.0
	 * @var Initial_Setup_Settings
	 */
	private $initial_setup_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.164.0
	 *
	 * @param Initial_Setup_Settings $initial_setup_settings Initial_Setup_Settings instance.
	 */
	public function __construct( Initial_Setup_Settings $initial_setup_settings ) {
		$this->initial_setup_settings = $initial_setup_settings;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.164.0
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
						'/' . REST_Routes::REST_ROOT . '/core/user/data/initial-setup-settings',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.164.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
		};

		return array(
			new REST_Route(
				'core/user/data/initial-setup-settings',
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
							$settings = $request['data']['settings'];

							$this->initial_setup_settings->merge( $settings );

							return new WP_REST_Response( $this->initial_setup_settings->get() );
						},
						'permission_callback' => $can_setup,
						'args'                => array(
							'data' => array(
								'type'       => 'object',
								'required'   => true,
								'properties' => array(
									'settings' => array(
										'type'          => 'object',
										'required'      => true,
										'minProperties' => 1,
										'additionalProperties' => false,
										'properties'    => array(
											'isAnalyticsSetupComplete' => array(
												'type' => 'boolean',
											),
										),
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
