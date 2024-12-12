<?php
/**
 * Class Google\Site_Kit\Core\Tags\First_Party_Mode\REST_First_Party_Mode_Controller
 *
 * @package   Google\Site_Kit\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling First Party Mode settings via REST API.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class REST_First_Party_Mode_Controller {

	/**
	 * First_Party_Mode instance.
	 *
	 * @since 1.142.0
	 * @var First_Party_Mode
	 */
	private $first_party_mode;

	/**
	 * First_Party_Mode_Settings instance.
	 *
	 * @since 1.141.0
	 * @var First_Party_Mode_Settings
	 */
	private $first_party_mode_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param First_Party_Mode          $first_party_mode          First_Party_Mode instance.
	 * @param First_Party_Mode_Settings $first_party_mode_settings First_Party_Mode_Settings instance.
	 */
	public function __construct( First_Party_Mode $first_party_mode, First_Party_Mode_Settings $first_party_mode_settings ) {
		$this->first_party_mode          = $first_party_mode;
		$this->first_party_mode_settings = $first_party_mode_settings;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.141.0
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/fpm-settings',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.141.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_options = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/fpm-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->first_party_mode_settings->get() );
						},
						'permission_callback' => $can_manage_options,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->first_party_mode_settings->set(
								$request['data']['settings']
							);

							return new WP_REST_Response( $this->first_party_mode_settings->get() );
						},
						'permission_callback' => $can_manage_options,
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
											'isEnabled' => array(
												'type'     => 'boolean',
												'required' => true,
											),
										),
									),
								),
							),
						),
					),
				)
			),

			new REST_Route(
				'core/site/data/fpm-server-requirement-status',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$this->first_party_mode->healthcheck();
							return new WP_REST_Response( $this->first_party_mode_settings->get() );
						},
						'permission_callback' => $can_manage_options,
					),
				)
			),
		);
	}
}
