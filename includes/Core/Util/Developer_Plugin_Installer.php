<?php
/**
 * Class Google\Site_Kit\Core\Util\DeveloperPluginInstaller
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class responsible for providing the helper plugin via the automatic updater.
 *
 * @since 1.3.0
 */
class Developer_Plugin_Installer {

	const SLUG = 'google-site-kit-dev-settings';

	/**
	 * Plugin context.
	 *
	 * @since 1.3.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.3.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.3.0
	 */
	public function register() {
		// Only filter plugins API response if the developer plugin is not already active.
		if ( ! defined( 'GOOGLESITEKITDEVSETTINGS_VERSION' ) ) {
			add_filter(
				'plugins_api',
				function ( $value, $action, $args ) {
					return $this->plugin_info( $value, $action, $args );
				},
				10,
				3
			);
		}

		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function () {
			return current_user_can( Permissions::SETUP );
		};

		return array(
			new REST_Route(
				'core/site/data/developer-plugin',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function () {
							$is_active = defined( 'GOOGLESITEKITDEVSETTINGS_VERSION' );
							$installed = $is_active;
							$slug      = self::SLUG;
							$plugin    = "$slug/$slug.php";

							if ( ! $is_active ) {
								if ( ! function_exists( 'get_plugins' ) ) {
									require_once ABSPATH . 'wp-admin/includes/plugin.php';
								}
								foreach ( array_keys( get_plugins() ) as $installed_plugin ) {
									if ( $installed_plugin === $plugin ) {
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
							$install_url = $nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=' . $slug ), 'install-plugin_' . $slug );

							return new WP_REST_Response(
								array(
									'active'       => $is_active,
									'installed'    => $installed,
									'activateURL'  => current_user_can( 'activate_plugin', $plugin ) ? esc_url_raw( $activate_url ) : false,
									'installURL'   => current_user_can( 'install_plugins' ) ? esc_url_raw( $install_url ) : false,
									'configureURL' => $is_active ? esc_url_raw( $this->context->admin_url( 'dev-settings' ) ) : false,
								)
							);
						},
						'permission_callback' => $can_setup,
					),
				)
			),
		);
	}

	/**
	 * Retrieves plugin information data from the Site Kit REST API.
	 *
	 * @since 1.3.0
	 *
	 * @param false|object|array $value  The result object or array. Default false.
	 * @param string             $action The type of information being requested from the Plugin Installation API.
	 * @param object             $args   Plugin API arguments.
	 * @return false|object|array Updated $value, or passed-through $value on failure.
	 */
	private function plugin_info( $value, $action, $args ) {
		if ( 'plugin_information' !== $action || self::SLUG !== $args->slug ) {
			return $value;
		}

		$data = $this->fetch_plugin_data();
		if ( ! $data ) {
			return $value;
		}

		$new_data = array(
			'slug'          => self::SLUG,
			'name'          => $data['name'],
			'version'       => $data['version'],
			'author'        => '<a href="https://opensource.google.com">Google</a>',
			'download_link' => $data['download_url'],
			'trunk'         => $data['download_url'],
			'tested'        => $data['tested'],
			'requires'      => $data['requires'],
			'requires_php'  => $data['requires_php'],
			'last_updated'  => $data['last_updated'],
		);
		if ( ! empty( $data['icons'] ) ) {
			$new_data['icons'] = $data['icons'];
		}
		if ( ! empty( $data['banners'] ) ) {
			$new_data['banners'] = $data['banners'];
		}
		if ( ! empty( $data['banners_rtl'] ) ) {
			$new_data['banners_rtl'] = $data['banners_rtl'];
		}

		return (object) $new_data;
	}

	/**
	 * Gets plugin data from the API.
	 *
	 * @since 1.3.0
	 * @since 1.99.0 Update plugin data to pull from GCS bucket.
	 *
	 * @return array|null Associative array of plugin data, or null on failure.
	 */
	private function fetch_plugin_data() {
		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_remote_get_wp_remote_get
		$response = wp_remote_get( 'https://storage.googleapis.com/site-kit-dev-plugins/google-site-kit-dev-settings/updates.json' );

		// Retrieve data from the body and decode json format.
		return json_decode( wp_remote_retrieve_body( $response ), true );
	}
}
