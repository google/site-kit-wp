<?php
/**
 * Class Google\Site_Kit\Core\User\REST_Conversion_Reporting_Controller
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling conversion reporting settings rest routes.
 *
 * @since 1.144.0
 * @access private
 * @ignore
 */
class REST_Conversion_Reporting_Controller {

	/**
	 * Conversion_Reporting_Settings instance.
	 *
	 * @since 1.144.0
	 * @var Conversion_Reporting_Settings
	 */
	private $conversion_reporting_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.144.0
	 *
	 * @param Conversion_Reporting_Settings $conversion_reporting_settings Conversion_Reporting_Settings instance.
	 */
	public function __construct( Conversion_Reporting_Settings $conversion_reporting_settings ) {
		$this->conversion_reporting_settings = $conversion_reporting_settings;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.144.0
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
				if ( Feature_Flags::enabled( 'conversionReporting' ) ) {
					return array_merge(
						$paths,
						array(
							'/' . REST_Routes::REST_ROOT . '/core/user/data/conversion-reporting-settings',
						)
					);
				}

				return $paths;
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.144.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_view_dashboard = function () {
			return current_user_can( Permissions::VIEW_DASHBOARD );
		};

		if ( ! Feature_Flags::enabled( 'conversionReporting' ) ) {
			return array();
		}

		return array(
			new REST_Route(
				'core/user/data/conversion-reporting-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->conversion_reporting_settings->get() );
						},
						'permission_callback' => $can_view_dashboard,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$settings = $request['data']['settings'];

							$this->conversion_reporting_settings->merge( $settings );

							return new WP_REST_Response( $this->conversion_reporting_settings->get() );
						},
						'permission_callback' => $can_view_dashboard,
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
											'newEventsCalloutDismissedAt'  => array(
												'type' => 'integer',
											),
											'lostEventsCalloutDismissedAt' => array(
												'type' => 'integer',
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
