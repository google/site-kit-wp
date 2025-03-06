<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\REST_Consent_Mode_Controller
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Plugin_Status;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Tag_Manager\Settings as Tag_Manager_Settings;
use Google\Site_Kit\Modules\Tag_Manager;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

/**
 * Class for handling Consent Mode.
 *
 * @since 1.122.0
 * @access private
 * @ignore
 */
class REST_Consent_Mode_Controller {

	/**
	 * Consent_Mode_Settings instance.
	 *
	 * @since 1.122.0
	 * @var Consent_Mode_Settings
	 */
	private $consent_mode_settings;

	/**
	 * Modules instance.
	 *
	 * @since 1.142.0
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Options instance.
	 *
	 * @since 1.142.0
	 * @var Options
	 */
	protected $options;

		/**
		 * Constructor.
		 *
		 * @since 1.122.0
		 * @since 1.142.0 Introduces Modules as an argument.
		 *
		 * @param Modules               $modules               Modules instance.
		 * @param Consent_Mode_Settings $consent_mode_settings Consent_Mode_Settings instance.
		 * @param Options               $options               Optional. Option API instance. Default is a new instance.
		 */
	public function __construct(
		Modules $modules,
		Consent_Mode_Settings $consent_mode_settings,
		Options $options
	) {
		$this->modules               = $modules;
		$this->consent_mode_settings = $consent_mode_settings;
		$this->options               = $options;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.122.0
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
						'/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode',
					)
				);
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/site/data/consent-api-info',
					)
				);
			}
		);
	}

	/**
	 * Gets REST route instances.
	 *
	 * @since 1.122.0
	 *
	 * @return REST_Route[] List of REST_Route objects.
	 */
	protected function get_rest_routes() {
		$can_manage_options = function () {
			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		$can_update_plugins = function () {
			return current_user_can( Permissions::UPDATE_PLUGINS );
		};

		return array(
			new REST_Route(
				'core/site/data/consent-mode',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							return new WP_REST_Response( $this->consent_mode_settings->get() );
						},
						'permission_callback' => $can_manage_options,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function ( WP_REST_Request $request ) {
							$this->consent_mode_settings->set(
								$request['data']['settings']
							);

							return new WP_REST_Response( $this->consent_mode_settings->get() );
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
											'enabled' => array(
												'type' => 'boolean',
											),
											'regions' => array(
												'type'  => 'array',
												'items' => array(
													'type' => 'string',
												),
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
				'core/site/data/consent-api-info',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							// Here we intentionally use a non-plugin-specific detection strategy.
							$is_active = function_exists( 'wp_set_consent' );
							$response  = array(
								'hasConsentAPI' => $is_active,
							);

							// Alternate wp_nonce_url without esc_html breaking query parameters.
							$nonce_url = function ( $action_url, $action ) {
								return add_query_arg( '_wpnonce', wp_create_nonce( $action ), $action_url );
							};

							if ( ! $is_active ) {
								$installed_plugin = $this->get_consent_api_plugin_file();

								$consent_plugin = array(
									'installed'   => (bool) $installed_plugin,
									'installURL'  => false,
									'activateURL' => false,
								);

								if ( ! $installed_plugin && current_user_can( 'install_plugins' ) ) {
									$consent_plugin['installURL'] = $nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=wp-consent-api' ), 'install-plugin_wp-consent-api' );
								}

								if ( $installed_plugin && current_user_can( 'activate_plugin', $installed_plugin ) ) {
									$consent_plugin['activateURL'] = $nonce_url( self_admin_url( 'plugins.php?action=activate&plugin=' . $installed_plugin ), 'activate-plugin_' . $installed_plugin );
								}

								$response['wpConsentPlugin'] = $consent_plugin;
							}

							return new WP_REST_Response( $response );
						},
						'permission_callback' => $can_manage_options,
					),
				)
			),
			new REST_Route(
				'core/site/data/consent-api-activate',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function () {
							require_once ABSPATH . 'wp-admin/includes/plugin.php';

							$slug      = 'wp-consent-api';
							$plugin    = "$slug/$slug.php";

							$activated = activate_plugin( $plugin );

							if ( is_wp_error( $activated ) ) {
								return new WP_Error( 'invalid_module_slug', $activated->get_error_message() );
							}

							return new WP_REST_Response( array( 'success' => true ) );
						},
						'permission_callback' => $can_update_plugins,
					),
				),
			),
			new REST_Route(
				'core/site/data/ads-measurement-status',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$ads_connected = apply_filters( 'googlesitekit_is_module_connected', false, Ads::MODULE_SLUG );

							if ( $ads_connected ) {
								return new WP_REST_Response( array( 'connected' => true ) );
							}

							$analytics_connected = apply_filters( 'googlesitekit_is_module_connected', false, Analytics_4::MODULE_SLUG );
							if ( $analytics_connected ) {
								$analytics_settings = ( new Analytics_Settings( $this->options ) )->get();
								$adsense_linked     = $analytics_settings['adSenseLinked'] ?? false;

								if ( $adsense_linked ) {
									return new WP_REST_Response( array( 'connected' => true ) );
								}

								$container_destination_ids = $analytics_settings['googleTagContainerDestinationIDs'] ?? false;
								if ( is_array( $container_destination_ids ) ) {
									foreach ( $container_destination_ids as $destination_id ) {
										if ( substr( $destination_id, 0, 3 ) === 'AW-' ) {
											return new WP_REST_Response( array( 'connected' => true ) );
										}
									}
								}
							}

							$tag_manager_connected = apply_filters( 'googlesitekit_is_module_connected', false, Tag_Manager::MODULE_SLUG );
							if ( $tag_manager_connected ) {
								$tag_manager          = $this->modules->get_module( Tag_Manager::MODULE_SLUG );
								$tag_manager_settings = ( new Tag_Manager_Settings( $this->options ) )->get();

								if ( ! $tag_manager || ! $tag_manager instanceof Tag_Manager ) {
									return new WP_REST_Response( array( 'connected' => false ) );
								}

								$live_containers_versions = $tag_manager->get_tagmanager_service()->accounts_containers_versions->live(
									"accounts/{$tag_manager_settings['accountID']}/containers/{$tag_manager_settings['internalContainerID']}"
								);

								if ( empty( $live_containers_versions->tag ) ) {
									return new WP_REST_Response( array( 'connected' => false ) );
								}

								$has_ads_tag = array_search( 'awct', array_column( $live_containers_versions->tag, 'type' ), true );
								if ( false !== $has_ads_tag ) {
									return new WP_REST_Response( array( 'connected' => true ) );
								}
							}

							return new WP_REST_Response( array( 'connected' => false ) );
						},
						'permission_callback' => $can_manage_options,
					),
				),
			),
		);
	}

	/**
	 * Gets the plugin file of the installed WP Consent API if found.
	 *
	 * @since 1.148.0
	 *
	 * @return false|string
	 */
	protected function get_consent_api_plugin_file() {
		// Check the default location first.
		if ( Plugin_Status::is_plugin_installed( 'wp-consent-api/wp-consent-api.php' ) ) {
			return 'wp-consent-api/wp-consent-api.php';
		}

		// Here we make an extra effort to attempt to detect the plugin if installed in a non-standard location.
		return Plugin_Status::is_plugin_installed(
			fn ( $installed_plugin ) => 'https://wordpress.org/plugins/wp-consent-api' === $installed_plugin['PluginURI']
		);
	}
}
