<?php
/**
 * Class Google\Site_Kit\Core\User\REST_Proactive_User_Engagement_Controller
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
 * Class for handling proactive user engagement user settings via REST API.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class REST_Proactive_User_Engagement_Controller {

	/**
	 * Proactive_User_Engagement_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Proactive_User_Engagement_Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param Proactive_User_Engagement_Settings $settings Proactive_User_Engagement_Settings instance.
	 */
	public function __construct( Proactive_User_Engagement_Settings $settings ) {
		$this->settings = $settings;
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
						'/' . REST_Routes::REST_ROOT . '/core/user/data/proactive-user-engagement-settings',
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
		$can_view_dashboard = function () {
			return current_user_can( Permissions::VIEW_DASHBOARD );
		};

		return array(
			new REST_Route(
				'core/user/data/proactive-user-engagement-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->settings->get() );
						},
						'permission_callback' => $can_view_dashboard,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$settings = $request['data']['settings'];

							$this->settings->merge( $settings );

							return new WP_REST_Response( $this->settings->get() );
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
											'frequency'  => array(
												'type' => 'string',
												'enum' => array( 'weekly', 'monthly', 'quarterly' ),
											),
											'subscribed' => array(
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
