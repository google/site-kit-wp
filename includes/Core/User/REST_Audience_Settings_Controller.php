<?php
/**
 * Class Google\Site_Kit\Core\User\REST_Audience_Settings_Controller
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
 * Class for handling audience settings rest routes.
 *
 * @since 1.134.0
 * @access private
 * @ignore
 */
class REST_Audience_Settings_Controller {

	/**
	 * Audience_Settings instance.
	 *
	 * @since 1.134.0
	 * @var Audience_Settings
	 */
	private $audience_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.134.0
	 *
	 * @param Audience_Settings $audience_settings Audience_Settings instance.
	 */
	public function __construct( Audience_Settings $audience_settings ) {
		$this->audience_settings = $audience_settings;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.134.0
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
				if ( Feature_Flags::enabled( 'audienceSegmentation' ) ) {
					return array_merge(
						$paths,
						array(
							'/' . REST_Routes::REST_ROOT . '/core/user/data/audience-settings',
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
	 * @since 1.134.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_view_dashboard = function () {
			return current_user_can( Permissions::VIEW_DASHBOARD );
		};

		if ( ! Feature_Flags::enabled( 'audienceSegmentation' ) ) {
			return array();
		}

		return array(
			new REST_Route(
				'core/user/data/audience-settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->audience_settings->get() );
						},
						'permission_callback' => $can_view_dashboard,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$settings = $request['data']['settings'];

							$this->audience_settings->merge( $settings );

							return new WP_REST_Response( $this->audience_settings->get() );
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
											'configuredAudiences'               => array(
												'type'  => 'array',
												'items' => array(
													'type' => 'string',
												),
											),
											'isAudienceSegmentationWidgetHidden' => array(
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
