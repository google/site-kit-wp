<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\REST_Conversion_Tracking_Controller
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling rest routes for Conversion Tracking settings.
 *
 * @since 1.127.0
 * @access private
 * @ignore
 */
class REST_Conversion_Tracking_Controller {

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @since 1.127.0
	 * @var Conversion_Tracking_Settings
	 */
	protected $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.127.0
	 *
	 * @param Conversion_Tracking_Settings $settings Conversion Tracking settings.
	 */
	public function __construct( Conversion_Tracking_Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.127.0
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/conversion-tracking',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.127.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$has_capabilities = function() {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/conversion-tracking',
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => function () {
						return new WP_REST_Response( $this->settings->get() );
					},
					'permission_callback' => $has_capabilities,
				)
			),
			new REST_Route(
				'core/site/data/conversion-tracking',
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => function ( WP_REST_Request $request ) {
						$this->settings->set(
							$request['data']['settings']
						);

						return new WP_REST_Response( $this->settings->get() );
					},
					'permission_callback' => $has_capabilities,
					'args'                => array(
						'data' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'settings' => array(
									'type'       => 'object',
									'required'   => true,
									'properties' => array(
										'enabled' => array(
											'type'     => 'boolean',
											'required' => true,
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
