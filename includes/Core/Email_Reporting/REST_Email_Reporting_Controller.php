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

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_User;

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
	 * Modules instance.
	 *
	 * @since 1.170.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Was_Analytics_4_Connected instance.
	 *
	 * @since 1.168.0
	 * @var Was_Analytics_4_Connected
	 */
	private $was_analytics_4_connected;

	/**
	 * User_Email_Reporting_Settings instance.
	 *
	 * @since 1.170.0
	 * @var User_Email_Reporting_Settings
	 */
	private $user_email_reporting_settings;

	/**
	 * Eligible_Subscribers_Query instance.
	 *
	 * @since 1.170.0
	 * @var Eligible_Subscribers_Query
	 */
	private $eligible_subscribers_query;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 * @since 1.170.0 Added modules and user email reporting settings dependencies.
	 *
	 * @param Email_Reporting_Settings      $settings                       Email_Reporting_Settings instance.
	 * @param Was_Analytics_4_Connected     $was_analytics_4_connected      Was_Analytics_4_Connected instance.
	 * @param Modules                       $modules                        Modules instance.
	 * @param User_Options                  $user_options                   User options instance.
	 * @param User_Email_Reporting_Settings $user_email_reporting_settings  User email reporting settings instance.
	 */
	public function __construct(
		Email_Reporting_Settings $settings,
		Was_Analytics_4_Connected $was_analytics_4_connected,
		Modules $modules,
		User_Options $user_options,
		User_Email_Reporting_Settings $user_email_reporting_settings
	) {
		$this->settings                      = $settings;
		$this->modules                       = $modules;
		$this->was_analytics_4_connected     = $was_analytics_4_connected;
		$this->user_email_reporting_settings = $user_email_reporting_settings;
		$this->eligible_subscribers_query    = new Eligible_Subscribers_Query( $this->modules, $user_options );
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/email-reporting-eligible-subscribers',
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
		$can_manage = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
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
				'core/site/data/email-reporting-eligible-subscribers',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$meta_key       = $this->user_email_reporting_settings->get_meta_key();
							$eligible_users = $this->eligible_subscribers_query->get_eligible_users( get_current_user_id() );

							$data = array_map(
								function ( WP_User $user ) use ( $meta_key ) {
									return $this->map_user_to_response( $user, $meta_key );
								},
								$eligible_users
							);

							return new WP_REST_Response( array_values( $data ) );
						},
						'permission_callback' => $can_manage,
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

	/**
	 * Maps a user to the REST response shape.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_User $user     User object.
	 * @param string  $meta_key User meta key for email reporting settings.
	 * @return array
	 */
	private function map_user_to_response( WP_User $user, $meta_key ) {
		$settings = get_user_meta( $user->ID, $meta_key, true );

		return array(
			'id'          => (int) $user->ID,
			'displayName' => $user->display_name,
			'email'       => $user->user_email,
			'role'        => $this->get_primary_role( $user ),
			'subscribed'  => is_array( $settings ) && ! empty( $settings['subscribed'] ),
		);
	}

	/**
	 * Gets the primary role of the user.
	 *
	 * @since 1.170.0
	 *
	 * @param WP_User $user User object.
	 * @return string
	 */
	private function get_primary_role( WP_User $user ) {
		if ( empty( $user->roles ) ) {
			return '';
		}

		$roles = array_values( $user->roles );

		return (string) reset( $roles );
	}
}
