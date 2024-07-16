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

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
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
		 * Constructor.
		 *
		 * @since 1.122.0
		 *
		 * @param Consent_Mode_Settings $consent_mode_settings Consent_Mode_Settings instance.
		 */
	public function __construct( Consent_Mode_Settings $consent_mode_settings ) {
		$this->consent_mode_settings = $consent_mode_settings;
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
							$is_active  = function_exists( 'wp_set_consent' );
							$installed  = $is_active;
							$plugin_uri = 'https://wordpress.org/plugins/wp-consent-api';
							$plugin     = 'wp-consent-api/wp-consent-api.php';

							$response = array(
								'hasConsentAPI' => $is_active,
							);

							if ( ! $is_active ) {
								if ( ! function_exists( 'get_plugins' ) ) {
									require_once ABSPATH . 'wp-admin/includes/plugin.php';
								}

								$plugins = get_plugins();

								if ( array_key_exists( $plugin, $plugins ) ) {
									$installed = true;
								} else {
									foreach ( $plugins as $plugin_file => $installed_plugin ) {
										if ( $installed_plugin['PluginURI'] === $plugin_uri ) {
											$plugin    = $plugin_file;
											$installed = true;
											break;
										}
									}
								}

								// Alternate wp_nonce_url without esc_html breaking query parameters.
								$nonce_url = function ( $action_url, $action ) {
									return add_query_arg( '_wpnonce', wp_create_nonce( $action ), $action_url );
								};
								$activate_url = $nonce_url( self_admin_url( 'plugins.php?action=activate&plugin=' . $plugin ), 'activate-plugin_' . $plugin );
								$install_url = $nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=wp-consent-api' ), 'install-plugin_wp-consent-api' );

								$response['wpConsentPlugin'] = array(
									'installed'   => $installed,
									'activateURL' => current_user_can( 'activate_plugin', $plugin ) ? esc_url_raw( $activate_url ) : false,
									'installURL'  => current_user_can( 'install_plugins' ) ? esc_url_raw( $install_url ) : false,
								);
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
		);
	}
}
