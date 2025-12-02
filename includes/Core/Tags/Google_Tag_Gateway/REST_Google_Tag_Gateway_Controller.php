<?php
/**
 * Class Google\Site_Kit\Core\Tags\Google_Tag_Gateway\REST_Google_Tag_Gateway_Controller
 *
 * @package   Google\Site_Kit\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class for handling Google Tag Gateway settings via REST API.
 *
 * @since 1.141.0
 * @since 1.157.0 Renamed from REST_First_Party_Mode_Controller to REST_Google_Tag_Gateway_Controller.
 * @access private
 * @ignore
 */
class REST_Google_Tag_Gateway_Controller {

	/**
	 * Google_Tag_Gateway instance.
	 *
	 * @since 1.142.0
	 * @var Google_Tag_Gateway
	 */
	private $google_tag_gateway;

	/**
	 * Google_Tag_Gateway_Settings instance.
	 *
	 * @since 1.141.0
	 * @var Google_Tag_Gateway_Settings
	 */
	private $google_tag_gateway_settings;

	/**
	 * Google_Tag_Gateway_Health instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Tag_Gateway_Health
	 */
	private $health_state;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Added health state parameter.
	 *
	 * @param Google_Tag_Gateway          $google_tag_gateway          Google_Tag_Gateway instance.
	 * @param Google_Tag_Gateway_Settings $google_tag_gateway_settings Google_Tag_Gateway_Settings instance.
	 * @param Google_Tag_Gateway_Health   $health_state                Google_Tag_Gateway_Health instance.
	 */
	public function __construct( Google_Tag_Gateway $google_tag_gateway, Google_Tag_Gateway_Settings $google_tag_gateway_settings, Google_Tag_Gateway_Health $health_state ) {
		$this->google_tag_gateway          = $google_tag_gateway;
		$this->google_tag_gateway_settings = $google_tag_gateway_settings;
		$this->health_state                = $health_state;
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/gtg-settings',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Added gtg-health and gtg-health-checks endpoints, updated existing endpoints.
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_options = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		return array(
			new REST_Route(
				'core/site/data/gtg-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->google_tag_gateway_settings->get() );
						},
						'permission_callback' => $can_manage_options,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->google_tag_gateway_settings->set(
								$request['data']['settings']
							);

							return new WP_REST_Response( $this->google_tag_gateway_settings->get() );
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
				'core/site/data/gtg-health',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->health_state->get() );
						},
						'permission_callback' => $can_manage_options,
					),
				)
			),

			new REST_Route(
				'core/site/data/gtg-health-checks',
				array(
					array(
						'methods'             => WP_REST_Server::CREATABLE,
						'callback'            => function () {
							$this->google_tag_gateway->healthcheck();
							return new WP_REST_Response( $this->health_state->get() );
						},
						'permission_callback' => $can_manage_options,
					),
				)
			),

			// Deprecated endpoint - kept for backward compatibility.
			new REST_Route(
				'core/site/data/gtg-server-requirement-status',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$this->google_tag_gateway->healthcheck();
							// Return combined data for backward compatibility.
							return new WP_REST_Response(
								array_merge(
									$this->google_tag_gateway_settings->get(),
									array(
										'isGTGHealthy' => $this->health_state->get()['isUpstreamHealthy'],
										'isScriptAccessEnabled' => $this->health_state->get()['isMpathHealthy'],
									)
								)
							);
						},
						'permission_callback' => $can_manage_options,
					),
				)
			),
		);
	}
}
