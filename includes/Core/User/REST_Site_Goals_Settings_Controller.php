<?php
/**
 * Class Google\Site_Kit\Core\User\REST_Site_Goals_Settings_Controller
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2026 Google LLC
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
 * Class for handling per-user Site Goals settings REST routes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class REST_Site_Goals_Settings_Controller {

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Site_Goals_Settings $site_goals_settings Site_Goals_Settings instance.
	 */
	public function __construct( Site_Goals_Settings $site_goals_settings ) {
		$this->site_goals_settings = $site_goals_settings;
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

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/site-goals-settings',
					)
				);
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
		$can_view_dashboard = function () {
			return current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/site-goals-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->site_goals_settings->get() );
						},
						'permission_callback' => $can_view_dashboard,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->site_goals_settings->merge( $request['data']['settings'] );

							return new WP_REST_Response( $this->site_goals_settings->get() );
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
											'goalDrivers' => array(
												'type' => 'object',
											),
											'visitorEngagement' => array(
												'type' => 'object',
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
