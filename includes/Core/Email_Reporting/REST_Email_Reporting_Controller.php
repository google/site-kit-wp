<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\REST_Email_Reporting_Controller
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling Email Reporting site settings via REST API.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class REST_Email_Reporting_Controller {

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	/**
	 * Was_Analytics_4_Connected instance.
	 *
	 * @since 1.168.0
	 * @var Was_Analytics_4_Connected
	 */
	private $was_analytics_4_connected;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param Email_Reporting_Settings  $settings Email_Reporting_Settings instance.
	 * @param Was_Analytics_4_Connected $was_analytics_4_connected  Was_Analytics_4_Connected instance.
	 */
	public function __construct( Email_Reporting_Settings $settings, Was_Analytics_4_Connected $was_analytics_4_connected ) {
		$this->settings                  = $settings;
		$this->was_analytics_4_connected = $was_analytics_4_connected;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting',
						'/' . REST_Routes::REST_ROOT . '/core/site/data/was-analytics-4-connected',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.162.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_access = function () {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/site/data/email-reporting',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->settings->get() );
						},
						'permission_callback' => $can_access,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->settings->set( $request['data']['settings'] );

							return new WP_REST_Response( $this->settings->get() );
						},
						'permission_callback' => $can_access,
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
											'enabled' => array(
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
				'core/site/data/was-analytics-4-connected',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( array( 'wasConnected' => $this->was_analytics_4_connected->get() ) );
						},
						'permission_callback' => $can_access,
					),
				)
			),
		);
	}
}
